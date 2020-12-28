import { Injectable } from '@angular/core';
import { RequestsService } from '../requests/requests.service'

@Injectable({
  providedIn: 'root'
})
export class OhlcHistoricalDataService {

  constructor(private requester: RequestsService) {}


  /**
   * Returns ohlc data for given trading pair, can be used to create candlesticks.
   * @param tradingPair btceur, btcusd, etheur...
   * @param step timeframe in seconds 60, 180, 300, 900, 1800, 3600, 7200, 14400, 21600, 43200, 86400, 259200
   * @param limit number of candlesticks, minimum 1, maximum 1000
   */
  getOHLCData(tradingPair: string, step:number, limit:number):Promise<Object>{
    return this.requester.universalRequest(`https://www.bitstamp.net/api/v2/ohlc/${tradingPair}?step=${step.toString()}&limit=${limit.toString()}`)
  }


  /**
   * Returns requested data type as array from ohlc data.
   * @param tradingPair btceur, btcusd, etheur...
   * @param step timeframe in seconds 60, 180, 300, 900, 1800, 3600, 7200, 14400, 21600, 43200, 86400, 259200
   * @param limit number of candlesticks, minimum 1, maximum 1000
   * @param dataType high, low, open, close, timestamp, volume
   */
  async numberArrayFromOHLC(tradingPair: string, step:number, limit:number, dataType: string):Promise<Array<string>>{
    let ohlcData = await this.getOHLCData(tradingPair,step,limit)
    //initialize number array and fill it
    let numberArray = []
    ohlcData['data']['ohlc'].forEach(element => {
      numberArray.push(element[dataType])
    });
    //return filled array
    return numberArray
  }
}
