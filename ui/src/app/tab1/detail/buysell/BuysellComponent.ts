import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { PortfolioService } from '../../../services/portfolio/portfolio.service'
import { RequestsService } from '../../../services/requests/requests.service'


@Component({
  selector: 'app-buysell',
  templateUrl: './buysell.component.html',
  styleUrls: ['./buysell.component.scss'],
})
export class BuysellComponent implements OnInit {

  constructor(private popoverCtrl: PopoverController, private navParams: NavParams, private portfolioService: PortfolioService, private request: RequestsService) { }

  //currencies
  cryptoCurrency:string = null;
  fiatCurrency:string = null;

  //amount to be bought or sold
  amount:number

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
      this.amount = event.target.value
      console.log(this.amount)
      if(this.amount > 0 && this.amount != undefined && (typeof this.amount) == 'number'){
          this.disableButton(false)
      }else{
          this.disableButton(true)
      }
  }


  disableButton(disable:boolean){
      document.getElementById('proceed').setAttribute('disabled',disable.toString())
  }

  dismiss(){
      this.popoverCtrl.dismiss()
  }


  /**
   * Buy crypto with fiat.
   * On success return true, otherwise false.
   * @param amount 
   */
  async buy(amount:number):Promise<boolean>{
    let currentValues = await this.request.universalRequest(`https://www.bitstamp.net/api/v2/ticker_hour/${this.cryptoCurrency+this.fiatCurrency}/`)
    let buyrate = 1/parseFloat(currentValues['last'])
    return this.portfolioService.exchangeCurrencies(this.fiatCurrency, this.cryptoCurrency, buyrate, amount)
  }


  /**
   * Sell crypto for fiat.
   * On success return true, otherwise false.
   * @param amount 
   */
  async sell(amount:number):Promise<boolean>{
    let currentValues = await this.request.universalRequest(`https://www.bitstamp.net/api/v2/ticker_hour/${this.cryptoCurrency+this.fiatCurrency}/`)
    let buyrate = parseFloat(currentValues['last'])
    return this.portfolioService.exchangeCurrencies(this.cryptoCurrency, this.fiatCurrency, buyrate, amount)
  }
  

  
}
