import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { PortfolioService } from '../../../services/portfolio/portfolio.service'


@Component({
  selector: 'app-buysell',
  templateUrl: './buysell.component.html',
  styleUrls: ['./buysell.component.scss'],
})
export class BuysellComponent implements OnInit {

  constructor(private popoverCtrl: PopoverController, private navParams: NavParams, private portfolioService: PortfolioService) { }

  cryptoCurrency:string = null;
  fiatCurrency:string = null;

  ngOnInit() { 
      //on init get currencies
      this.cryptoCurrency = this.navParams.get('cryptoCurrency')
      this.fiatCurrency = this.navParams.get('fiatCurrency')
  }

  
}
