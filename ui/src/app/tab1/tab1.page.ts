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
import { LiveDataBitstampService } from '../services/live-data-bitstamp/live-data-bitstamp.service'
import { observable } from 'rxjs';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private requerster:RequestsService, private historicalData: OhlcHistoricalDataService, private liveData:LiveDataBitstampService) {
    //initialize default selected values for fiat and timeframe
    this.selectedFiatCurrency = fiatCurrencies[0]
    this.selectedTimeframe = timeframeOptions[0].values
  }

  //displayable crypto currencies
  cryptoCurrencies:Array<Object> = cryptoCurrencies;
  //selectable fiat currencies
  fiatCurrencies:Array<Object> = fiatCurrencies
  //selectable timeframes
  timeframes:Array<Object> = timeframeOptions
  //displayable card data
  cardData:Map<string,{value:number, change:number}> = new Map()
  //currently selected fiat currency and timeframe
  selectedFiatCurrency:{long:string, short:string}
  selectedTimeframe:{step:number, limit:number}
  

  /**
   * 
   * @param fiatCurrency {long:string, short:string}
   * @param timeframe {step:number, limit:number}
   */
  initializeView(fiatCurrency:{long:string, short:string}, timeframe:{step:number, limit:number}){

    //initialize chart references
    let charts = []
    this.cryptoCurrencies.forEach(currency => {
      charts.push(document.getElementById(currency['short']))
    });
    //fetch and process data, create charts
    this.cryptoCurrencies.forEach(currency => {
      this.historicalData.numberArrayFromOHLC(currency['short'] + fiatCurrency['short'], timeframe['step'], timeframe['limit'], 'close').then(
        response => {
          //assign data to charts
          this.buildOverviewLineChart(charts[this.cryptoCurrencies.indexOf(currency)],response)
          //fill card data
          let latestValue = parseFloat(response[response.length-1])
          let percentageChange = this._percentageChange(parseFloat(response[0]), latestValue, 2)
          this.cardData.set(currency['short'] ,{value:latestValue, change:percentageChange})
        }
      )
    });
    
  }


  /**
   * Wrapper function for initializeView() that updates global variables.
   * @param fiatCurrency {long:string, short:string}
   * @param timeframe {step:number, limit:number}
   */
  update(fiatCurrency:{long:string, short:string}, timeframe:{step:number, limit:number}, event?){
    console.log('attepting update',fiatCurrency,timeframe)
    //update global variables
    this.selectedFiatCurrency = fiatCurrency
    this.selectedTimeframe = timeframe
    //update view elements
    this.initializeView(fiatCurrency, timeframe)
  }

  updateSelectedFiatCurrency(fiatCurrency:{long:string, short:string}, event?){
    this.selectedFiatCurrency = fiatCurrency
    console.log(this.selectedFiatCurrency,fiatCurrency)
    this.initializeView(fiatCurrency, this.selectedTimeframe)
  }

  ionViewDidEnter(){
    this.update(this.selectedFiatCurrency,this.selectedTimeframe)
  }



  /**
   * Creates an overview chart for a given dataset.
   * @param htmlReference reference in html code (document.getElementById...)
   * @param displayNumbers data array to be displayed
   */
  buildOverviewLineChart(htmlReference:HTMLElement, displayNumbers:Array<string>){
    //determine line and background colors
    let chartlineColor = chartOverviewColors['dump']['chartline']
    let backgroundColor = chartOverviewColors['dump']['background']
    if(this._doesItPump(displayNumbers)){
      chartlineColor = chartOverviewColors['pump']['chartline']
      backgroundColor = chartOverviewColors['pump']['background']
    }
    //create chart
    var lineChart = new Chart(htmlReference, {
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
      }
      }
    });
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
