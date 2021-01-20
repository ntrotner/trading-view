import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { portfolio, position } from '../../../../schemas/portfolio';
import { fiatCurrencies } from '../../../../schemas/fiatcurrency';
import { PortfolioService } from '../services/portfolio/portfolio.service';
import { RequestsService } from '../services/requests/requests.service';
import { allowedCurrencySwaps } from '../../../../schemas/allowedCurrecySwaps';
import { sortingOptions } from '../../../../schemas/sortingOptions';
import { Network } from '@ionic-native/network/ngx';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnDestroy {
  // Chart values
  @ViewChild('currentChart') currentChart;
  @ViewChild('historyChart') historyChart;

  subscriptions: Subscription = new Subscription();

  // HTML declarations
  sortingOption = sortingOptions;
  currencyList = fiatCurrencies;

  portfolioList: Observable<portfolio>;
  fiatExchange: { [key: string]: { price: number } } = {}; // key is currency 
  fiatString = this.currencyList[0].short;
  accumulatedValue: number;
  sectionValue: string;

  constructor(private portfolio: PortfolioService, private requestService: RequestsService, private network: Network) {
    // set observable for html async pipe
    this.portfolioList = portfolio.getPortfolio();
    this.selectFiatCurrency({ detail: { value: this.currencyList[0].short } });
  }

  ionViewDidEnter() {
    this.historyChart.createLine();
    this.currentChart.createChart();
    this.segmentChanged({ detail: { value: 'current' } });

    /*
     * horrible code but I need to set a timer so that chart.js doesn't throw an error that is
     *  caused by emitting portfolio values and "async" chart creation.
     * This doesn't restrict the application in any way but it delays the portfolio updates
     */
    setTimeout(() => {
      /*
       * first update hook that listens for changes to the portfolio
       * second one exists in calculatePortfolioValue
       */
      this.subscriptions.add(this.portfolioList.subscribe((_) => this.updateViewContent()));
      this.portfolio.emitPortfolio();
    }, 5000);

  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  selectSorting(item): void {
    const sortType = item.detail.value;
    // split string to prefix (that contains the criteria) and suffix (that contains the orientation)
    this.portfolio.sortPortfolio(sortType.slice(0, -1), sortType.slice(-1) === 'a', { ...this.fiatExchange, [this.fiatString]: { price: 1 } });
  }

  /**
   * updates the information/charts shown on the tab
   */
  updateViewContent() {
    this.calculatePortfolioValue();
    this.calculateHistoryValue(this.accumulatedValue);
    this.currentChart.updateChart();
    this.historyChart.updateLine();
  }

  /**
   * creates http requests to add currency keys to the fiatExchange,
   * so that the exchange rate can be determined for each currency in the portfolio
   *
   * @param item 
   */
  selectFiatCurrency(item, event?): void {
    // remove api generated information
    this.fiatExchange = { [item.detail.value]: { price: 1 } };

    this.portfolio.emitPortfolio();

    // set new fiatstring for translated values
    this.fiatString = item.detail.value;
    this.portfolio.getTempPortfolio().positions.forEach((value) => {
      // skip if conversion between same currencies
      if (value.id === this.fiatString) return;

      // check for allowed currency string and send response
      this.decideCurrencySwapType(value);
    });

    // close spinning icon
    event ? setTimeout(() => { event.target.complete(); }, 1500) : 0;
  }

  /**
   * check which swap string to send
   * 
   * @param value 
   */
  decideCurrencySwapType(value: position) {
    this.fiatExchange[value.id] = { price: undefined };
    if (allowedCurrencySwaps.find((swapCombination) => swapCombination === `${value.id}${this.fiatString}`)) {
      this.requestExchangeRate(`${value.id}${this.fiatString}`, value, false);
    } else if (allowedCurrencySwaps.find((swapCombination) => swapCombination === `${this.fiatString}${value.id}`)) {
      this.requestExchangeRate(`${this.fiatString}${value.id}`, value, true);
    }
  }

  /**
   * get exchange rate for currency and insert it into dictionary
   * 
   * @param swapString 
   * @param value 
   * @param inverse 
   */
  requestExchangeRate(swapString: string, value: position, inverse: boolean): void {
    if (this.network.Connection.NONE !== this.network.type) {
      this.requestService.universalRequest(`https://www.bitstamp.net/api/v2/ticker_hour/${swapString}/`)
        .then((response) => {
          // when requesting with smartphone the response is saved as a string in the 'data' key
          if (response['data']) response = JSON.parse(response['data']);

          // when http request has failed then try again later
          if (response['ok'] === false) {
            setTimeout(() => {
              this.requestExchangeRate(swapString, value, inverse);
            }, 5000);
            return;
          }

          try {
            let exchangeValue = response['bid'];

            if (inverse) {
              let calculatedExchangeRate = Number((1 / Number(exchangeValue)).toFixed(3));
              isNaN(calculatedExchangeRate) ? 0 : this.fiatExchange[value.id] = { price: calculatedExchangeRate }
            } else {
              isNaN(exchangeValue) ? 0 : this.fiatExchange[value.id] = { price: Number(exchangeValue) }
            }
          } catch { }
          this.portfolio.sortPortfolio('value', true, { ...this.fiatExchange, [this.fiatString]: { price: 1 } });

          // second update hook that listens for changes by the http requests
          this.updateViewContent();
          this.portfolio.emitPortfolio();
        })
        .catch((err) => console.log(err));
    }
  }

  /**
   * calculates the whole portfolio value with the initial selected fiat value
   * and the crypto currencies that are converted through the fiatExchange object
   */
  calculatePortfolioValue(): void {
    try {
      let selectedFiatCurrency = this.portfolio.getTempPortfolio().positions.find((value) => value.id === this.fiatString);

      let accumulatedRelativeValue = this.portfolio.getTempPortfolio().positions
        .reduce<number>((accumulator: number, currentValue) =>
          accumulator + Number(this.calculateValueNumber(currentValue.id, currentValue.amount))
          , selectedFiatCurrency ? selectedFiatCurrency.amount : 0); // set default start value
      this.accumulatedValue = accumulatedRelativeValue;
    } catch {
      this.accumulatedValue = undefined;
    }
  }

  /**
   * get the current date and get the value in every currency.
   * since the calculated value is dependent on the currency, we need to convert it to every
   * available currency (eur, usd, gbp) as the future exchange rate may show a wrong result
   *
   * @param accumulatedValue 
   */
  calculateHistoryValue(accumulatedValue) {
    if (this.portfolio.getTempPortfolio().history.length > 0) {
      // get delta of last history entry (in ms)
      let lastValueUpdate = Math.abs(
        new Date(this.portfolio.getTempPortfolio().history[this.portfolio.getTempPortfolio().history.length - 1].date).getTime() // last history input
        - new Date().getTime() // current time
      );

      // if the last update was performed less than 2 mins ago then ignore it
      if (lastValueUpdate < 1000 * 60 * 2) return;
    }

    let history = {};
    for (const currency of fiatCurrencies) {
      // check if exchange exists, if not then abort calculation and request missing ones
      if (!this.fiatExchange[currency.short]) {
        this.decideCurrencySwapType(new position(currency.short, 0));
        return;
      }

      history[currency.short] = accumulatedValue * (1 / this.fiatExchange[currency.short].price);
    }

    let combinedPortfolioAndExchange = {};
    Object.keys(this.fiatExchange).forEach((key) => combinedPortfolioAndExchange[`${key}`] = true);
    this.portfolio.getTempPortfolio().positions.forEach((value) => combinedPortfolioAndExchange[`${value.id}`] = true);

    let existsUndefined = Object.keys(this.fiatExchange).find((value) => !this.fiatExchange[value].price);

    // if every position got an exchange rate and can convert it to every fiat currency then proceed and add it to the history
    if (Object.keys(history).length === fiatCurrencies.length && this.accumulatedValue && !existsUndefined &&
      Object.keys(this.fiatExchange).length === Object.keys(combinedPortfolioAndExchange).length &&
      !Object.keys(history).find((key) => history[key] == null)
    ) {
      this.portfolio.addHistory({ date: new Date(), ...history });
    }
  }

  /**
   * disables either the pie or line chart
   * 
   * @param event 
   */
  segmentChanged(event) {
    switch (event.detail.value) {
      case 'current':
        this.sectionValue = 'current';
        this.historyChart.segmentChange(event.detail.value);
        this.currentChart.segmentChange(event.detail.value);
        break;
      case 'history':
        this.sectionValue = 'history';
        this.historyChart.segmentChange(event.detail.value);
        this.currentChart.segmentChange(event.detail.value);
        break;
      default:
        break;
    }
  }

  /**
   * returns string representation of converted currency
   *
   * @param id 
   * @param amount 
   */
  calculateValueString(id: string, amount: number): string {
    return this.fiatExchange[id] && this.fiatExchange[id].price ?
      `${(this.fiatExchange[id].price * amount).toFixed(2)} ${this.fiatString.toUpperCase()}`
      : ''
  }

  /**
   * returns number representation of converted currency
   *
   * @param id 
   * @param amount 
   */
  calculateValueNumber(id: string, amount: number): number {
    if (!this.fiatExchange[id] || !this.fiatExchange[id].price) return 0;
    return Number((this.fiatExchange[id].price * amount).toFixed(2));
  }
}
