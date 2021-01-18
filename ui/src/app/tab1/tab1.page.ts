import { Component, ViewChild } from '@angular/core';
import { RequestsService } from '../services/requests/requests.service'
import { OhlcHistoricalDataService } from '../services/ohlc-historical-data/ohlc-historical-data.service'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { allowedCurrencySwaps } from '../../../../schemas/allowedCurrecySwaps';
import { chartOverviewColors } from '../../../../schemas/colors'
import { cryptoCurrencies } from '../../../../schemas/cryptocurrency'
import { fiatCurrencies } from '../../../../schemas/fiatcurrency'
import { timeframeOptions } from '../../../../schemas/timeframeOptions'
import { Network } from '@ionic-native/network/ngx';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private requerster:RequestsService, private historicalData: OhlcHistoricalDataService, private network: Network) {
    //initialize default selected values for fiat and timeframe
    this.selectedFiatCurrency = fiatCurrencies[0].short
    this.selectedTimeframe = timeframeOptions.get('day')
    
  }

  //displayable card data
  currencyCards:Map<string, {chart:Chart, latest:number, change:number}> = new Map()
  
  //global immutable variables
  cryptoCurrencies:Array<Object> = cryptoCurrencies;
  fiatCurrencies:Array<Object> = fiatCurrencies
  timeframes:Array<string> = Array.from(timeframeOptions.keys())
  
  //selectable variables
  selectedFiatCurrency:string
  selectedTimeframe:{step:number, limit:number}
  

  /**
   * 
   * @param fiatCurrency eur, gbp, usd
   * @param timeframe {step:number, limit:number}
   */
  initializeView(fiatCurrency:string, timeframe:{step:number, limit:number}){
    //initialize chart references
    let references = this._htmlChartReferences()
    //fetch and process data, create charts
    this.cryptoCurrencies.forEach(currency => {
      this._assignCardData(currency['short'], fiatCurrency, timeframe, references.get(currency['short']))
    });
  }


  /**
   * Assigns chart, latest, change data to global card map.
   * @param cryptoCurreny btc, eth, xrp...
   * @param fiatCurrency eur, gbp, usd
   * @param timeframe
   * @param htmlReference 
   */
  _assignCardData(cryptoCurreny:string, fiatCurrency:string, timeframe:{step:number, limit:number}, htmlReference:HTMLElement){
    try{
      //first check if currency pair is a valid one, if yes proceed to fill card and chart with data
      if(allowedCurrencySwaps.includes(cryptoCurreny + fiatCurrency)){
        this.historicalData.numberArrayFromOHLC(cryptoCurreny + fiatCurrency, timeframe.step, timeframe.limit, 'close').then(
          response => {
            //process response, put values into global map
            let chart = this._buildOverviewLineChart(htmlReference,response,false)
            let latest = parseFloat(response[response.length-1])
            let change = this._percentageChange(parseFloat(response[0]), latest, 2)
            this.currencyCards.set(cryptoCurreny, {chart:chart, latest:latest, change:change})
          }
        )
      }else{//currency pair is invalid, fill card and chart accordingly
          let chart = this._buildOverviewLineChart(htmlReference, [], true, 'No data available.')
          this.currencyCards.set(cryptoCurreny, {chart:chart, latest:NaN, change:NaN})
      }
    }catch{}
  }


  /**
   * Clear all the card data for a crypto currency.
   * @param cryptoCurreny 
   */
  _clearCardData(cryptoCurreny:string){
    let cardData = this.currencyCards.get(cryptoCurreny)
    cardData.chart.clear()
    cardData.latest = NaN
    cardData.change = NaN
  }


  /**
   * Retrieves chart references from html.
   */
  _htmlChartReferences():Map<string,HTMLElement>{
    let chartRefereces = new Map()
    this.cryptoCurrencies.forEach(currency => {
      chartRefereces.set(currency['short'],document.getElementById(currency['short']))
    });
    return chartRefereces
  }


  /**
   * Used within html. Updates view and values after currency change.
   * @param event 
   */
  updateFiatCurrency(event?){
    //update global variable
    this.selectedFiatCurrency = event.detail.value
    //initialize view again
    this.initializeView(this.selectedFiatCurrency, this.selectedTimeframe)
  }


  /**
   * Used within html. Updates view and values after timeframe change.
   * @param event html event
   */
  updateTimeframe(event?){
    //update global variable
    this.selectedTimeframe = timeframeOptions.get(event.detail.value)
    //initialize view again
    this.initializeView(this.selectedFiatCurrency, this.selectedTimeframe)
  }


  ionViewDidEnter(event?){
    this.initializeView(this.selectedFiatCurrency, this.selectedTimeframe)
    //activate timeout in case this function is being used with ion-refresher
    event ? setTimeout(() => { 
      event.target.complete();
      this._clearCardData('eth') 
      console.log(this.currencyCards.get('xmr'))
    }, 1500) : 0;
  }


  /**
   * Creates an overview chart for a given dataset.
   * @param htmlReference reference in html code (document.getElementById...)
   * @param displayNumbers data array to be displayed
   */
  _buildOverviewLineChart(htmlReference:HTMLElement, displayNumbers:Array<string>, displayTitle:boolean, titleMessage:string=''):Chart{
    //determine line and background colors
    let chartlineColor = chartOverviewColors['dump']['chartline']
    let backgroundColor = chartOverviewColors['dump']['background']
    if(this._doesItPump(displayNumbers)){
      chartlineColor = chartOverviewColors['pump']['chartline']
      backgroundColor = chartOverviewColors['pump']['background']
    }
    //create chart
    let lineChart = new Chart(htmlReference, {
      type: 'line',
      data: {
        labels: displayNumbers,
        datasets: [{ 
            data: displayNumbers,
            borderColor: chartlineColor,
            fill: true,
            backgroundColor:backgroundColor,
            pointRadius:0
          }]
        },
      options: {
        legend: {
          display: false,
          labels: {
            display: false
          }
        },
        scales: {
          xAxes: [{
              gridLines: {
                  display:false
              },
              ticks: {
                display: false
              }  
          }],
          yAxes: [{
              gridLines: {
                  display:false
              },
              ticks: {
                display: false
              }   
          }]
        },
        title: {
          display: displayTitle,
          text: titleMessage
        }
      }
    });
    return lineChart
  }


  /**
   * Helper function for chart generation. Compares the first value of an array to its last value.
   * @param data array of numbers
   */
  _doesItPump(data:Array<string>):Boolean{
    
    if(parseFloat(data[0]) <= parseFloat(data[data.length - 1])){
      return true
    }else{
      return false
    }
  }


  /**
   * Calculates a rounded percentage change of two values in a timeframe.
   * One might need to apply .toFixed() method on a result for visual purposes.
   * @param firstValue first value of timeframe
   * @param recentValue latest value of timeframe
   * @param decimalPlaces whole number of decimal places 
   */
  _percentageChange(firstValue:number, recentValue:number, decimalPlaces:number): number {
    return Math.round((recentValue/firstValue - 1)*100*(10**decimalPlaces))/(10**decimalPlaces)
  }

}
