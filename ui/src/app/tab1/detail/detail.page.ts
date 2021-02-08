import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { candlestickColors } from '../../../../../schemas/colors'
import { candlestickOptions } from '../../../../../schemas/timeframeOptions'
import { fiatCurrencies } from '../../../../../schemas/fiatcurrency'
import { allowedCurrencySwaps } from '../../../../../schemas/allowedCurrecySwaps'
import { OhlcHistoricalDataService } from '../../services/ohlc-historical-data/ohlc-historical-data.service'
import { LiveDataBitstampService } from '../../services/live-data-bitstamp/live-data-bitstamp.service'
import { BuysellComponent } from './buysell/BuysellComponent'
import { PopoverController } from '@ionic/angular';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  constructor(private activatedRoute: ActivatedRoute, private historicalData: OhlcHistoricalDataService, private liveData: LiveDataBitstampService, private popoverCtrl: PopoverController) { 
    //assign all selection options before lifecycle starts
    this.candleTimes = Array.from(candlestickOptions.keys())
    this.fiatCurrencies = fiatCurrencies
  }

  //displayable static data (charts, high-low, volume)
  staticData:{highlow:[number, number] | null, totalvolume:number | null, candlestick:Chart | null, volume:Chart | null } = {highlow:null, totalvolume:null, candlestick:null, volume:null}

  //displayable live buy sell values
  liveTrading:{buy:number | null, sell:number | null} = {buy:null, sell:null}

  //site variable
  cryptoCurrency:string

  //all selectable options
  candleTimes:Array<string> = []
  fiatCurrencies:Array<any> = []

  //selected variables
  selectedFiatCurrency:string
  selectedCandleTime:{step:number, display:object}
  selectedCandleSelection:string = '1 hour'

  ngOnInit() {
    this.activatedRoute.params.subscribe(
      data => {
        this.cryptoCurrency = data['currency']
        this.selectedFiatCurrency = data['fiat']
        this.selectedCandleTime = candlestickOptions.get(this.selectedCandleSelection)
      }
    )
  }

  ionViewDidEnter(event?){
    console.log('view enter')
    //clear global variable of potenial deprecated data
    this._clearAllData()
    //determine if currency swap is allowed
    let currencySwapAllowed = allowedCurrencySwaps.includes(this.cryptoCurrency + this.selectedFiatCurrency)
    //fetch data
    this.historicalData.getOHLCData(this.cryptoCurrency + this.selectedFiatCurrency,this.selectedCandleTime.step,96).then(
      response => this._initializeStaticData(response['data']['ohlc'], currencySwapAllowed)
    ).catch(
      response => {
        this._initializeStaticData([], currencySwapAllowed)
      }
    )
    //subscribe to live data
    if(currencySwapAllowed){//only if swap is valid
      this.liveData.liveSellBuy(this.cryptoCurrency + this.selectedFiatCurrency,1)
      .subscribe(
        data => {
          console.log(data)
          this.liveTrading = data
        },
        error => console.log(error),
        ()=>console.log('done')
      )
    }else{//otherwise display placeholders
      this.liveTrading = {buy:NaN, sell:NaN}
    }

    //activate timeout in case this function is being used with ion-refresher
    event ? setTimeout(() => {
      event.target.complete();
    }, 1500) : 0;
  }


  
  ionViewDidLeave(){
    console.log('view leave')
    this.unsubscribe()
  }


  /**
   * Method to unsubscribe from current live data subscription.
   * Must be used upon any update.
   */
  unsubscribe(){
    this.liveData.unsubscribeLiveSellBuy(this.cryptoCurrency + this.selectedFiatCurrency)
  }


   /**
   * Used within html. Updates view and values after currency change.
   * @param event 
   */
  updateFiatCurrency(event?){
    //unsubscribe from current live data
    this.unsubscribe()
    //update global variable
    this.selectedFiatCurrency = event.detail.value
    //initialize view again
    this.ionViewDidEnter()
  }

  /**
   * Used within html. Updates view and values after candle time selection change.
   * @param event 
   */
  updateCandleSelection(event?){
    //unsubscribe from current live data
    this.unsubscribe()
    //update globales
    this.selectedCandleSelection = event.detail.value
    this.selectedCandleTime = candlestickOptions.get(this.selectedCandleSelection)
    //initialize view again
    this.ionViewDidEnter()
  }

  /**
   * Initializes global variable containing non-live data to be displayed.
   * @param ohlcData ohlc data array
   * @param currencySwapAllowed is the currency swap allowed or not?
   */
  _initializeStaticData(ohlcData:Array<object>, currencySwapAllowed:boolean){
    //gather chart html references
    let candleReference = document.getElementById('candlestick')
    let volumeReference = document.getElementById('volume')

    if(currencySwapAllowed){//proceed normally
      //create candlestickchart, gather all parameters
      let candleOpenClose = this._ohlcBarExtractor(ohlcData,'open','close')
      let candleHighLow = this._ohlcBarExtractor(ohlcData,'high','low')
      let candleColors = this._barColors(candleOpenClose, candlestickColors['pump'], candlestickColors['dump'])
      let timeLabels = this._timeLabels(ohlcData, this.selectedCandleTime.display) //will be used for volume chart aswell
      //assign chart to global variable
      this.staticData.candlestick = this._buildCandlestickChart(candleReference, candleOpenClose, candleHighLow, candleColors, timeLabels)
      //create volumechart, gather all parameters
      let volumeValues = []
      ohlcData.forEach(element => {
        volumeValues.push(element['volume'])
      });
      //assign to global variable
      this.staticData.volume = this._buildVolumeChart(volumeReference, volumeValues, timeLabels)
      //assign highlow and total volume values
      this.staticData.highlow = this._highLow(ohlcData)
      this.staticData.totalvolume = this._totalVolume(ohlcData)

    }else{//fill global variable with placeholder error messages
      this.staticData.candlestick = this._buildCandlestickChart(candleReference, [], [], [], [], true, 'No data available.')
      this.staticData.volume = this._buildVolumeChart(volumeReference, [], [], true, 'No data available.')
      this.staticData.highlow = [NaN, NaN]
      this.staticData.totalvolume = NaN

    }
  }


  /**
   * Clear global variable containing non live data aswell as stored live data values.
   */
  _clearAllData(){
    //clear charts of global variable
    let candlestick = this.staticData.candlestick
    let volume = this.staticData.volume
    if(candlestick == undefined || volume == undefined){
      //nothing to clear in terms of charts
    }else{//clear charts, set their variables to null
      candlestick.clear()
      volume.clear()
      this.staticData.candlestick = null
      this.staticData.volume = null
    }
    //clear highlow and total volume
    this.staticData.highlow = null
    this.staticData.totalvolume = null
    //clear stored live data
    this.liveTrading.buy = null
    this.liveTrading.sell = null
  }


  /**
   * Build candlestick chart.
   * @param htmlReference 
   * @param openCloseBars 
   * @param highLowBars 
   * @param barColors 
   * @param timeLabels 
   * @param displayTitle can be used for error messages
   * @param titleMessage error message
   */
  _buildCandlestickChart(htmlReference:HTMLElement, openCloseBars: Array<Array<any>>, highLowBars: Array<Array<any>>, barColors:Array<string>, timeLabels: Array<string>, displayTitle:boolean=false, titleMessage:string=''):Chart{
    let candlestickChart = new Chart(htmlReference, {
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
        },
        title: {
          display: displayTitle,
          text: titleMessage
        }
      }
    });
    return candlestickChart
  }


  /**
   * Build volume chart.
   * @param htmlReference 
   * @param volumeValues 
   * @param timeLabels 
   * @param displayTitle can be used for error messages
   * @param titleMessage error message
   */
  _buildVolumeChart(htmlReference:HTMLElement, volumeValues:Array<number>, timeLabels: Array<string>, displayTitle:boolean=false, titleMessage:string=''):Chart{
    let volumeChart = new Chart(htmlReference, {
      type: 'bar',
      data: {
        labels: timeLabels,
        datasets: [
          {
            data: volumeValues,
            barThickness:4,
            //backgroundColor: barColors
          }]
        },
      options: {
        legend: {//hide labels
          display: false,
          labels: {
            display: false
          }
        },
        plugins: {//disables bar percentages
          labels: false
        },
        title: {
          display: displayTitle,
          text: titleMessage
        }
      }
    });
    return volumeChart
  }


  /**
   * Returns an array of tuples extracted from ohlc data which can be used to generate a bar chart.
   * @param ohlcData ohlc data array
   * @param barTop open, high
   * @param barBottom close, low
   */
  _ohlcBarExtractor(ohlcData:Array<object>, barTop:string, barBottom:string):Array<Array<any>>{
    let arrayOfBars = [] //array to be filled with bar-tuples
    ohlcData.forEach(element => {
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
  _highLow(ohlcData:Array<object>):[number, number]{
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
  _totalVolume(ohlcData:Array<object>):number{
    let totalVolume = 0
    ohlcData.forEach(element => {
      totalVolume = totalVolume + parseFloat(element['volume'])
    });
    return totalVolume
  }


  async presentPopover(){
    let popover = await this.popoverCtrl.create({
      component:BuysellComponent,
      backdropDismiss:false,
      componentProps:{
        cryptoCurrency:this.cryptoCurrency,
        fiatCurrency:this.selectedFiatCurrency
      }
    });
    return await popover.present()
    
  }
}




