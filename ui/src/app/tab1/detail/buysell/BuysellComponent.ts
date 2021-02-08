import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { PortfolioService } from '../../../services/portfolio/portfolio.service'
import { RequestsService } from '../../../services/requests/requests.service'
import { AlertController } from '@ionic/angular'


@Component({
  selector: 'app-buysell',
  templateUrl: './buysell.component.html',
  styleUrls: ['./buysell.component.scss'],
})
export class BuysellComponent implements OnInit {

  constructor(private popoverCtrl: PopoverController, private navParams: NavParams, private portfolioService: PortfolioService, private request: RequestsService, private alertCtrl: AlertController) { }

  //currencies
  cryptoCurrency:string = null;
  fiatCurrency:string = null;

  //amount to be bought or sold
  amountBuySell:number = 0

  //which box is checked
  buySellSelected:'buy'|'sell'='buy'

  ngOnInit() { 
      //on init get currencies
      this.cryptoCurrency = this.navParams.get('cryptoCurrency')
      this.fiatCurrency = this.navParams.get('fiatCurrency')
  }

  swapSelect(buySell:'buy'|'sell'){
      this.buySellSelected = buySell
      console.log(this.buySellSelected)
  }

  updateAmount(event?){
      this.amountBuySell = parseFloat(event.target.value)
      console.log(this.amountBuySell)
  }



  dismiss(){
      this.popoverCtrl.dismiss()
  }

  
  /**
   * Exchange amount of fiat to crypto and vice versa.
   * @param amount 
   */
  async exchange(){
      if(this.amountBuySell > 0 && (typeof this.amountBuySell)=='number' && this.amountBuySell!=NaN && this.amountBuySell!=Infinity){//only then proceed to exchange
        console.log('here',this.amountBuySell)
        let exchangeSuccesfull = false
        let buyrate
        let currentValue = parseFloat((await this.request.universalRequest(`https://www.bitstamp.net/api/v2/ticker_hour/${this.cryptoCurrency+this.fiatCurrency}/`))['last'])
        if(this.buySellSelected == 'buy'){
            buyrate = 1/currentValue
            console.log(buyrate,this.amountBuySell,this.buySellSelected, this.cryptoCurrency, this.fiatCurrency)
            exchangeSuccesfull = this.portfolioService.exchangeCurrencies(this.fiatCurrency, this.cryptoCurrency, buyrate, this.amountBuySell*buyrate)
        }else{
            buyrate = currentValue
            console.log(buyrate,this.amountBuySell,this.buySellSelected, this.cryptoCurrency, this.fiatCurrency)
            exchangeSuccesfull = this.portfolioService.exchangeCurrencies(this.cryptoCurrency, this.fiatCurrency, buyrate, this.amountBuySell*buyrate)
        }
        this.alertExchange(exchangeSuccesfull,this.buySellSelected,currentValue)
      }else{
          this.alertError()
      }
  }


  async alertExchange(success:boolean,buySell:'buy'|'sell',currentValue:number) {
    let message = ''
    if(success){
        message = 'Exchange succesfull.'
    }else{
        message = 'Not enough funds in portfolio.'
    }

    let alert = await this.alertCtrl.create({
      header:'Tried to '+buySell+' at '+currentValue.toString()+' '+this.fiatCurrency+'/'+this.cryptoCurrency+'.',
      message: message,
      buttons: [{
        text: 'Ok',
        handler: () => {
          this.dismiss();
        }
      }]
    });
    await alert.present()
   }

   async alertError(){
    let alert = await this.alertCtrl.create({
        message: 'Please enter a valid number.',
        buttons: [{
          text: 'Ok',
          handler: () => {
            this.dismiss();
          }
        }]
      });
      await alert.present()
   }

}
