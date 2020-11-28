import { Injectable } from '@angular/core';
import { bitstamp_channel_modify, bitstamp_channel_order_book_response } from '@trading-schemas';
import { Observable, Subject, Subscriber, Subscription } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { catchError, finalize, map, throttleTime } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
import { convertBuySell } from './operatorBuySell';
import { Network } from '@ionic-native/network/ngx';
import { Platform, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LiveDataBitstampService {
  private webSocketConnection: WebSocketSubject<any>;
  private networkConnect: Subscription;
  private networkDisconnect: Subscription;
  private toast: HTMLIonToastElement;

  private subscribeObject(event: string): bitstamp_channel_modify {
    return {
      event: 'bts:subscribe',
      data: {
        channel: `${event}`
      }
    }
  }

  private unsubscribeObject(event: string): bitstamp_channel_modify {
    return {
      event: 'bts:unsubscribe',
      data: {
        channel: `${event}`
      }
    }
  }

  /**
   * creates toast at the bottom of the screen
   * if seconds is 0, then it has to be closed manually
   * @param message 
   * @param seconds 
   */
  private async createToast(message: string, seconds: number): Promise<void> {
    this.toast = await this.toastController.create({
      message,
      duration: seconds * 1000,
      animated: true,
      color: 'warning',
      buttons: [
        {
          text: 'Got it!',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    this.toast.present();
  }

  constructor(private network: Network, public toastController: ToastController, public platform: Platform) {
    // create connection and establish message channel
    // also add (dis)connect handler
    this.network.type !== this.network.Connection.NONE ? this.connect() : null;
    this.onConnect();
    this.onDisconnect();

    this.platform.pause.subscribe(async () => {
      console.log('Disconnecting WebSocket due to Plattform "Pause"');
      this.webSocketConnection.complete();
    });

    this.platform.resume.subscribe(async () => {
      console.log('Reconnecting WebSocket due to Plattform "Resume"');
      this.connect();
    });
  }

  /**
   * removes toast and creates a websocket connection to bitstamp
   */
  private onConnect(): void {
    this.networkConnect = this.network.onConnect().subscribe(async () => {
      setTimeout(async () => {
        console.log('Network connected');
        // remove toast that indicates that it tries to reconnect
        try {
          await this.toast.dismiss();
        } catch {
        }
        // acts as a blocker to prevent multiple toasts of same message
        this.toast = undefined;
        this.connect();
      }, 1500);
    });
  }


  /**
   * creates toast on screen to inform the user that no connection is possible
   */
  private onDisconnect(): void {
    this.networkDisconnect = this.network.onDisconnect().subscribe(async () => {
      console.log('Network disconnected');
      // only create toast if it doesn't exist
      !this.toast ? await this.createToast('Connection to live update has been lost.\nTrying to reconnect...', 0) : null;
    });
  }

  /**
   * checks if subscriber should receive message
   * by checking the event and message channel value
   * @param event
   * @param subscriber
   * @param message
   */
  private forwardMessage(event: string, subscriber: Subscriber<any>, message: bitstamp_channel_order_book_response): void {
    event === message.channel ? subscriber.next(message) : null;
  }

  /**
   * returns an observable that emits messages
   * from the specified event
   *
   * @param event 
   */
  private subscribeToEvent(event: string) {
    return new Observable((subscriber) => {
      let localSubscription: Subscription;
      let networkSubscriptions: Subscription = new Subscription();

      try {
        this.webSocketConnection.next(this.subscribeObject(event));
        localSubscription = this.webSocketConnection.subscribe((message: bitstamp_channel_order_book_response) => {
          if (subscriber.closed) {
            // avoid memory leak
            networkSubscriptions.unsubscribe();
            localSubscription.unsubscribe();
            console.log('Terminated Network and Live Update Subscription');
          } else {
            this.forwardMessage(event, subscriber, message)
          }
        });
      } catch {
        console.error('Could\'t connect to WebSocket, waiting for connection...');
      }

      networkSubscriptions.add(
        this.network.onConnect().subscribe((_) => {
          setTimeout(() => {
            try {
              this.webSocketConnection.next(this.subscribeObject(event));
              localSubscription = this.webSocketConnection.subscribe((message: bitstamp_channel_order_book_response) => this.forwardMessage(event, subscriber, message));
            } catch {
              console.error('No connection to WebSocket has been established => no Subscription can be created')
            }
          }, 2750);
        }));

      networkSubscriptions.add(
        this.network.onDisconnect().subscribe((_) => {
          try {
            localSubscription.unsubscribe();
          } catch {
            console.log('Could\'t unsubscribe, as no subscription is available');
          }
        }));
    });
  }

  /**
   * connect to bitstamp websocket
   */
  private connect(): void {
    try {
      this.webSocketConnection.unsubscribe();
      console.log('Unsubscribe WebSocket');
    } catch {
    }
    this.webSocketConnection = webSocket(environment.bitstampSocketURL);
    console.log('Creating WebSocket');

    this.webSocketConnection.subscribe(
      (msg: bitstamp_channel_modify) => {
        // if server notifies to reconnect then accept it
        if (msg.event === 'bts:request_reconnect') {
          this.webSocketConnection.next({ event: 'bts:request_reconnect', data: '', channel: '' });
        } else {
          return msg;
        }
      },
      async err => {
        try {
          if (!err.wasClean && err.type === 'close') {
            await setTimeout(() => {
              this.webSocketConnection.unsubscribe();
              this.connect();
            }, 1500);
          }
        } catch {
          console.error('Can\'t reconnect');
        }
      }, // Don't log it as it does already by itself
      async () => {
        if (this.network.type === this.network.Connection.NONE) {
          await setTimeout(() => {
            this.connect();
            console.log('WebSocked closed -- Trying to reconnect');
          }, 1500);
        }
      } // Called when connection is closed
    );
  }

  /**
   * returns an observable that emits the buy and sell prices 
   * for the specified currency
   * 
   * a throttle can be specified to limit requests to every
   * x seconds
   * 
   * The observable tries to reconnect automatically
   * 
   * @param currency 
   * @param throttle
   */
  public liveSellBuy(currency: string, throttle: number = 0): Observable<{ buy: number | null, sell: number | null }> {
    // the reason why this is separated into a subject and a subscription is to unsub the subscriptions of liveData, else it wont work...
    const redirection = new Subject();
    const liveData = this.subscribeToEvent(`order_book_${currency}`).subscribe((data) => { redirection.next(data) });
    return redirection
      .pipe(
        throttleTime(throttle * 1000), // only process every 'throttle' seconds
        map((response: bitstamp_channel_order_book_response) => { // prepares for conversion and checks of data exists
          if (response.data.asks && response.data.bids) {
            return { asks: response.data.asks, bids: response.data.bids }
          }
        }),
        convertBuySell(),
        finalize(() => { this.unsubscribeLiveSellBuy(currency); liveData.unsubscribe(); redirection.complete() }), // send unsubscribe object to websocket connection
        catchError(_ => of({ buy: null, sell: null }))
      )
  }

  /**
   * Unsubscribes from the specified websocket event
   * 
   * @param currency 
   */
  public unsubscribeLiveSellBuy(currency: string): void {
    this.webSocketConnection.next(this.unsubscribeObject(`order_book_${currency}`));
  }
}
