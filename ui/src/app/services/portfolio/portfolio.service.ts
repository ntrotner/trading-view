import { Injectable } from '@angular/core';
import { portfolio, position } from '../../../../../schemas/portfolio';
import { BehaviorSubject, Observable } from 'rxjs';

export const PORTFOLIO_KEY = 'portfolio';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private loadedPortfolio: portfolio = this.defaultPortfolio();
  private observablePortfolio = new BehaviorSubject<portfolio>(this.loadedPortfolio);

  constructor() {
    // initialize portfolio
    if (!localStorage.getItem(PORTFOLIO_KEY)) {
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(this.defaultPortfolio()));
    }
    this.loadPortfolio();
  }

  /**
   * returns default portfolio state
   */
  private defaultPortfolio(): portfolio {
    return new portfolio([
      new position('eur', 5000),
      new position('btc', 1.5),
      new position('ltc', 25),
      new position('bch', 30),
      new position('usd', 5000),
      new position('eth', 15),
      new position('pax', 25),
      new position('link', 30)
    ]);
  }

  /**
   * loads saved portfolio
   */
  private loadPortfolio(): void {
    this.loadedPortfolio = JSON.parse(localStorage.getItem(PORTFOLIO_KEY));
    this.observablePortfolio.next(this.loadedPortfolio);
    console.log('[Portfolio] loaded');
  }

  /**
   * saves the variable portfolio to the local storage
   * should be run after every change
   */
  private saveHook(): void {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(this.loadedPortfolio));
    this.observablePortfolio.next(this.loadedPortfolio);
    console.log('[Portfolio] saved');
  }

  /**
   * finds the currency object in the portfolio
   * if there is none then create and return it 
   * 
   * @param id 
   */
  private findCurrencyObject(id: string): position {
    let found = this.loadedPortfolio.positions.find((pos) => pos.id === id);
    if (!found) {
      // if not found then create it and set it as found
      found = this.loadedPortfolio.positions[
        this.loadedPortfolio.positions.push(new position(id, 0)) - 1
      ];
    }
    this.saveHook();
    return found;
  }

  /**
   * add history input
   * 
   * @param currencyExchange 
   */
  public addHistory(currencyExchange: { date: Date, [key: string]: number | Date }) {
    this.loadedPortfolio.history.push(currencyExchange);
    this.saveHook();
  }

  /**
   * executes exchange order
   * if successfull it will return true
   * 
   * ! the buyrate and amount are calculated to 10 decimal places !
   * 
   * @param fromCurrency designation for currency with which you pay
   * @param toCurrency design. for c. which you buy
   * @param buyrate e.g 16000 as 1 btc = 16000 usd
   * @param amount e.g. buy 2 btc
   */
  public exchangeCurrencies(fromCurrency: string, toCurrency: string, buyrate: number, amount: number): boolean {
    buyrate = Number(buyrate.toFixed(10));
    amount = Number(amount.toFixed(10));

    const objCurrencyTo = this.findCurrencyObject(toCurrency);
    const objCurrencyFrom = this.findCurrencyObject(fromCurrency);

    // check if enough resources are available to buy it
    if (objCurrencyFrom.amount >= buyrate * amount) {
      objCurrencyTo.amount += amount;
      objCurrencyFrom.amount -= buyrate * amount;
      this.saveHook();
      return true;
    } else {
      return false;
    }
  }

  /**
  * This methodes initates the sort algorithm and then emits the new value to the subscribers
  * 
  * @param sortCriteria 'value', 'name', 'amount'
  * @param orientation false = descending, true = ascending
  * @param currencyExchange object with exchangerates {eur: 1.245, ...}
  */
  public sortPortfolio(sortCriteria: string, orientation: boolean, currencyExchange: object): void {
    switch (sortCriteria) {
      case 'value':
        this.sortByValue(orientation, currencyExchange);
        break;
      case 'name':
        this.sortByName(orientation);
        break;
      case 'amount':
        this.sortByAmount(orientation);
        break;
      default:
        break;
    }
  }

  private sortByValue(orientation: boolean, currencyExchange: object): void {
    try {
      this.observablePortfolio.getValue().positions.sort((a, b) =>
        (a.amount * currencyExchange[a.id].price) - (b.amount * currencyExchange[b.id].price)
      );
      if (!orientation) {
        this.observablePortfolio.getValue().positions.reverse();
      }
    } catch { }
  }

  private sortByName(orientation: boolean): void {
    this.observablePortfolio.getValue().positions.sort((a, b) => a.id.localeCompare(b.id));
    if (!orientation) {
      this.loadedPortfolio.positions = this.observablePortfolio.getValue().positions.reverse();
    }
  }

  private sortByAmount(orientation: boolean): void {
    this.observablePortfolio.getValue().positions.sort((a, b) => a.amount - b.amount);
    if (!orientation) {
      this.loadedPortfolio.positions = this.observablePortfolio.getValue().positions.reverse();
    }
  }

  /**
   * returns just the current state of the portfolio
   * ! It will be obsolete after the next change to the portfolio !
   */
  public getTempPortfolio(): portfolio {
    return this.loadedPortfolio;
  }

  /**
   * returns an up to date version of the portfolio
   */
  public getPortfolio(): Observable<portfolio> {
    return this.observablePortfolio.asObservable();
  }

  /**
   * emits the up to date version of the portfolio
   */
  public emitPortfolio(): void {
    this.saveHook();
  }
}
