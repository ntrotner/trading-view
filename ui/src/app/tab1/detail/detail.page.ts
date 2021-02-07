import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { candlestickColors } from '../../../../../schemas/colors'
import { candlestickOptions } from '../../../../../schemas/timeframeOptions'
import { OhlcHistoricalDataService } from '../../services/ohlc-historical-data/ohlc-historical-data.service'
import { LiveDataBitstampService } from '../../services/live-data-bitstamp/live-data-bitstamp.service'

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  constructor(private activatedRoute: ActivatedRoute, private historicalData: OhlcHistoricalDataService, private liveData: LiveDataBitstampService) { 
    //initialize default selected values
    this.selectedCandleTime = candlestickOptions.get('15 min')

  }

  //displayable live buy sell values
  liveTrading:{buy:number | null, sell:number | null} = {buy:null, sell:null}

  // selectable variables
  selectedFiatCurrency:string
  selectedCandleTime:{step:number, display:object}

  async ngOnInit() {
    this.activatedRoute.params.subscribe(
      async data => {
        console.log(data)
        let ohlcData = await this.historicalData.getOHLCData(data['currency'] + 'eur',this.selectedCandleTime.step,96)
        console.log(ohlcData, this.totalVolume(ohlcData['data']['ohlc']))
        console.log(this.highLow(ohlcData['data']['ohlc']))
        let openCloseBars = this._ohlcBarExtractor(ohlcData,'open','close')
        let highLowBars = this._ohlcBarExtractor(ohlcData,'high','low')
        let barColors = this._barColors(openCloseBars, candlestickColors['pump'], candlestickColors['dump'])
        this.buildCandlestickChart(document.getElementById('candlestick'), openCloseBars, highLowBars, barColors, this._timeLabels(ohlcData['data']['ohlc'], this.selectedCandleTime.display))
      }
    )
    
  }
  ionViewDidEnter(){
    console.log('view enter')
    this.liveData.liveSellBuy('btceur',1)
      .subscribe(
        data => {
          console.log(data)
          this.liveTrading = data
          
        },
        error => console.log(error),
        ()=>console.log('done')
      )
  }

  ionViewDidLeave(){
    console.log('view leave')
    this.liveData.unsubscribeLiveSellBuy('btceur')
  }

  buildCandlestickChart(htmlReference:HTMLElement, openCloseBars: Array<Array<any>>, highLowBars: Array<Array<any>>, barColors:Array<string>, timeLabels: Array<string>){
    var candlestickChart = new Chart(htmlReference, {
      type: 'bar',
      data: {
        labels: timeLabels,
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


  /**
   * Creates an array of time labels useable for a chart displaying ohlc data.
   * @param ohlcData 
   * @param displayOptions e.g. {day:'2-digit', month:'2-digit'}, basically JS-Datetime formatting.
   */
  _timeLabels(ohlcData:Array<object>, displayOptions:object):Array<string>{
    let labels = []
    ohlcData.forEach(element => {
      let timestamp = element['timestamp']*1000
      labels.push(new Date(timestamp).toLocaleString([], displayOptions))
    });
    return labels
  }


  /**
   * Returns a tuple of the highest high and the lowest low in a given array.
   * @param ohlcData 
   */
  highLow(ohlcData:Array<object>):[number, number]{
    let highs = []
    let lows = []
    ohlcData.forEach(element => {
      highs.push(parseFloat(element['high']))
      lows.push(parseFloat(element['low']))
    });
    return [Math.max.apply(Math, highs), Math.min.apply(Math, lows)]
  }


  /**
   * Returns the total trading volume in a given array.
   * @param ohlcData 
   */
  totalVolume(ohlcData:Array<object>):number{
    let totalVolume = 0
    ohlcData.forEach(element => {
      totalVolume = totalVolume + parseFloat(element['volume'])
    });
    return totalVolume
  }
}

