import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { candlestickColors } from '../../../../../schemas/colors'
import { OhlcHistoricalDataService } from '../../services/ohlc-historical-data/ohlc-historical-data.service'

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  constructor(private activatedRoute: ActivatedRoute, private historicalData: OhlcHistoricalDataService) { }

  async ngOnInit() {
    this.activatedRoute.params.subscribe(
      async data => {
        console.log(data)
        let ohlcData = await this.historicalData.getOHLCData(data['currency'] + 'eur',900,96)
        console.log(ohlcData)
        let openCloseBars = this._ohlcBarExtractor(ohlcData,'open','close')
        let highLowBars = this._ohlcBarExtractor(ohlcData,'high','low')
        let barColors = this._barColors(openCloseBars, candlestickColors['pump'], candlestickColors['dump'])
        this.buildCandlestickChart(document.getElementById('candlestick'), openCloseBars, highLowBars, barColors)
      }
    )
  }

  buildCandlestickChart(htmlReference:HTMLElement, openCloseBars: Array<Array<any>>, highLowBars: Array<Array<any>>, barColors:Array<string>){
    var candlestickChart = new Chart(htmlReference, {
      type: 'bar',
      data: {
        labels: barColors,
        datasets: [{ 
            data: openCloseBars,
            barThickness:4,
            backgroundColor: barColors,
          },
          {
            data: highLowBars,
            barThickness:1,
            backgroundColor: barColors
          }]
        },
      options: {
        legend: {//hide labels
          display: false,
          labels: {
            display: false
          }
        },
        scales: {
          xAxes: [{//allows bar overlays
            stacked:true
          }]
        },
        plugins: {//disables bar percentages
          labels: false
        }
      }
    });
  }


  /**
   * Returns an array of tuples extracted from ohlc data which can be used to generate a bar chart.
   * @param ohlcData ohlc data object: {data:ohlc:[...]}
   * @param barTop open, high
   * @param barBottom close, low
   */
  _ohlcBarExtractor(ohlcData:Object, barTop:string, barBottom:string):Array<Array<any>>{
    let arrayOfBars = [] //array to be filled with bar-tuples
    ohlcData['data']['ohlc'].forEach(element => {
    let barTuple = [element[barTop], element[barBottom]] //bar-tuple
      arrayOfBars.push(barTuple)
    });
    return arrayOfBars
  }


  /**
   * Creates an array of fitting colors corresponding to open-close bars. This array can be used to color the candlesticks.
   * @param openCloseBars array of open-close-bar-tuples
   * @param pumpColor hex color code
   * @param dumpColor hex color code
   */
  _barColors(openCloseBars:Array<Array<any>>, pumpColor:string, dumpColor:string):Array<string>{
    let arrayOfColors = [] //array to be filled with hex color codes
    openCloseBars.forEach(element => {
      if(element[0] > element[1]){ //compare open value to close value, if open > close push the dump-color
        arrayOfColors.push(dumpColor)
      }else{ //if open <= close push pump-color
        arrayOfColors.push(pumpColor)
      }
    });
    return arrayOfColors
  }
}

