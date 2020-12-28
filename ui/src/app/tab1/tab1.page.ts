import { Component, ViewChild } from '@angular/core';
import { RequestsService } from '../services/requests/requests.service'
import { OhlcHistoricalDataService } from '../services/ohlc-historical-data/ohlc-historical-data.service'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { allowedCurrencySwaps } from '../../../../schemas/allowedCurrecySwaps';
import { chartOverviewColors } from '../../../../schemas/colors'
import { cryptoCurrencies } from '../../../../schemas/cryptocurrency'

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private requerster:RequestsService, private historicalData: OhlcHistoricalDataService) {}

  //displayed currencies
  displayedCurrencies:Array<Object> = cryptoCurrencies;
  

  async test(){
  
    this.historicalData.getOHLCData('btceur',900,12).then(
      resp => console.log(resp)
    )
    let data = await this.historicalData.numberArrayFromOHLC('usdceur',900,96,'close')
    console.log(data)

    //initialize chart references
    let charts = []
    this.displayedCurrencies.forEach(currency => {
      charts.push(document.getElementById(currency['short']))
    });
    //fetch data
    console.log(charts)
    
    this.displayedCurrencies.forEach(currency => {
      this.historicalData.numberArrayFromOHLC(currency['short']+'eur',900,90,'close').then(
        response => {
          this.buildOverviewLineChart(charts[this.displayedCurrencies.indexOf(currency)],response)
        }
      )
    });
    
    
  }

  ionViewDidEnter(){
    this.test()
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

}
