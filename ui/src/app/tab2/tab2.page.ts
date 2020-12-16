import { Component, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { portfolio } from '../../../../schemas/portfolio';
import { colors } from '../../../../schemas/colors';
import { fiatCurrencies } from '../../../../schemas/fiatcurrency';
import { PortfolioService } from '../services/portfolio/portfolio.service';
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { RequestsService } from '../requests/requests.service';
import { allowedCurrencySwaps } from '../../../../schemas/allowedCurrecySwaps';
import { sortingOptions } from '../../../../schemas/sortingOptions';
import { Network } from '@ionic-native/network/ngx';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  // Chart values
  @ViewChild('doughnutPie') doughnutPie;
  pie: Chart;

  // HTML declarations
  sortingOption = sortingOptions;
  currencyList = fiatCurrencies;

  portfolioList: Observable<portfolio>;
  fiatExchange: Object = {}; // Array<{ id: string, exchangeRate: number }> 
  fiatString = this.currencyList[0].short;

  constructor(private portfolio: PortfolioService, private requestService: RequestsService, private network: Network) {
    this.portfolioList = portfolio.getPortfolio();
    this.selectFiatCurrency({ detail: { value: this.currencyList[0].short } });
  }

  ionViewDidEnter() {
    this.createChart();
  }

  selectSorting(item): void {
    const sortType = item.detail.value;
    // split string to prefix (that contains the criteria) and suffix (that contains the orientation)
    this.portfolio.sortPortfolio(sortType.slice(0, -1), sortType.slice(-1) === 'a', { ...this.fiatExchange, [this.fiatString]: { price: 1 } });
  }

  /**
   * creates http requests to add currency keys to the fiatExchange,
   * so that the exchange rate can be determined for each currency in the portfolio
   *
   * @param item 
   */
  selectFiatCurrency(item, event?): void {
    // remove api generated information
    this.fiatExchange = {};
    this.clearChart();

    // set new fiatstring for translated values
    this.fiatString = item.detail.value;
    this.portfolio.getTempPortfolio().positions.forEach((value) => {
      if (value.id === item.detail.value) { return; }

      let swapString: string = `${value.id}${item.detail.value}`;

      if (allowedCurrencySwaps.find((swapCombination) => swapCombination === swapString)) {
        this.requestExchangeRate(swapString, value, false);
      } else {
        swapString = `${item.detail.value}${value.id}`;
        this.requestExchangeRate(swapString, value, true);
      }
    });

    event ? setTimeout(() => { event.target.complete(); }, 1500) : 0;
  }

  /**
   * get exchange rate for currency and insert it into dictionary
   * 
   * @param swapString 
   * @param value 
   * @param inverse 
   */
  requestExchangeRate(swapString: string, value, inverse: boolean): void {
    if (this.network.Connection.NONE !== this.network.type) {
      this.requestService.universalRequest(`https://www.bitstamp.net/api/v2/ticker_hour/${swapString}/`)
        .then((response) => {
          // when requesting with smartphone the response is saved as a string in the 'data' key
          if (response['data']) {
            response = JSON.parse(response['data']);
          }
          // when http request has failed then try again later
          if (response['ok'] === false) {
            setTimeout(() => {
              this.requestExchangeRate(swapString, value, inverse);
            }, 2500);
            return;
          }

          try {
            let exchangeValue = response['bid'];
            if (inverse) {
              let calculatedExchangerate = Number((1 / Number(exchangeValue)).toFixed(3));
              isNaN(calculatedExchangerate) ? 0 : this.fiatExchange[value.id] = { price: calculatedExchangerate }
            } else {
              isNaN(exchangeValue) ? 0 : this.fiatExchange[value.id] = { price: Number(exchangeValue) }
            }
          } catch { }
          this.portfolio.sortPortfolio('value', true, { ...this.fiatExchange, [this.fiatString]: { price: 1 } });
        })
        .catch((err) => console.log(err));
    }
  }

  /**
   * calculates the whole portfolio value with the initial selected fiat value
   * and the crypto currencies that are converted through the fiatExchange object
   *
   * @param portfolioState 
   */
  calculatePortfolioValue(portfolioState: portfolio): string {
    if (this.network.Connection.NONE !== this.network.type) {
      let selectedFiatCurrency = portfolioState.positions.find((value) => value.id === this.fiatString);

      let accumulatedRelativeValue = portfolioState.positions.reduce<number>((accumulator: number, currentValue) => {
        return accumulator + Number(this.calculateValueNumber(currentValue.id, currentValue.amount))
      }, selectedFiatCurrency ? selectedFiatCurrency.amount : 0);

      try {
        this.pie.data.labels = portfolioState.positions.map((value) => value.id.toUpperCase());
        this.pie.data.datasets.forEach((set) => {
          set.data = portfolioState.positions.map((value) =>
            value.id !== this.fiatString ? this.calculateValueNumber(value.id, value.amount) : value.amount
          );
          set.backgroundColor = this.getColorArray(portfolioState.positions.length);
        });
        this.pie.update();
      } catch { }
      return `${accumulatedRelativeValue.toFixed(2)} ${this.fiatString.toUpperCase()}`
    } else {
      return 'No internet connection found'
    }
  }

  /**
   * returns string representation of converted currency
   *
   * @param id 
   * @param amount 
   */
  calculateValueString(id: string, amount: number): string {
    return this.fiatExchange[id] ? `${(this.fiatExchange[id].price * amount).toFixed(2)} ${this.fiatString.toUpperCase()}` : ''
  }

  /**
   * returns number representation of converted currency
   *
   * @param id 
   * @param amount 
   */
  calculateValueNumber(id: string, amount: number): number {
    return this.fiatExchange[id] ? Number((this.fiatExchange[id].price * amount).toFixed(2)) : 0;
  }

  /**
   * returns array of colors with hexa values
   * @param amount 
   */
  getColorArray(amount: number): Array<string> {
    let finalColors = [];
    for (let index = 0; index < amount; index++) {
      finalColors.push(colors[index % colors.length]);
    }
    return finalColors;
  }

  /**
   * resets the chart
   */
  clearChart(): void {
    try {
      this.pie.data.labels = [];
      this.pie.data.datasets.forEach((set) => set.data = []);
      this.pie.update();
    } catch { }
  }

  /**
   * creates the chart
   */
  createChart() {
    try {
      this.pie = new Chart(this.doughnutPie.nativeElement, {
        type: 'pie',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderWidth: 1,
          }],
        },
        options: {
          circumference: Math.PI,
          cutoutPercentage: 50,
          rotation: Math.PI,
          legend: {
            display: false,
            onClick: (e) => e.stopPropagation()
          },
          events: [],
          plugins: {
            labels: {
              render: (arg) => arg.percentage > 3 ? `${arg.label}: ${arg.percentage}%` : '',
              textShadow: true,
              shadowBlur: 6,
              shadowColor: 'rgba(0,0,0,1)',
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              fontColor: 'white',
              fontSize: '14',
              position: 'border',
            }
          }
        }
      });
    } catch {
    }
  }

}
