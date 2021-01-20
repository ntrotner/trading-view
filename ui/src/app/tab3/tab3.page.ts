import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { fiatCurrencies } from '../../../../schemas/fiatcurrency';
import { portfolio } from '../../../../schemas/portfolio';
import { PortfolioService } from '../services/portfolio/portfolio.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  portfolioList: Observable<portfolio>;
  calculatedGains: number;
  currencyList = fiatCurrencies;
  fiatString: string = this.currencyList[0].short;

  constructor(private portfolio: PortfolioService) {
    this.portfolioList = this.portfolio.getPortfolio();
  }

  ionViewDidEnter() {
    this.calculateGains();
  }

  calculateGains(): number | boolean {
    let tempPortfolio = this.portfolio.getTempPortfolio();
    if (tempPortfolio.history.length < 2 || !this.fiatString) return false;

    const first = tempPortfolio.history[0];
    const last = tempPortfolio.history[tempPortfolio.history.length - 1];

    this.calculatedGains = Number(last[this.fiatString]) - Number(first[this.fiatString]);
  }

  selectFiatCurrency(item): void {
    this.fiatString = item.detail.value;
    this.calculateGains();
  }

}
