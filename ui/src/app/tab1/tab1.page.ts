import { Component } from '@angular/core';
import { RequestsService } from '../requests/requests.service'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { allowedCurrencySwaps } from '../../../../schemas/allowedCurrecySwaps';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private requerster:RequestsService) {}

  

  async test(){


    let link1 = 'https://www.bitstamp.net/api/v2/ohlc/btceur' //ohlc
    let link2 = 'https://www.bitstamp.net/api/v2/ticker/btceur/' //ticker
    let link3 = 'https://www.bitstamp.net/api/v2/ohlc/btceur?step=900&limit=12' //ohlc+params
    this.requerster.universalRequest(link3).then(
      resp => console.log('async',resp)
    )
    let resp = await this.requerster.universalRequest(link3)
    console.log('sync',resp)
  }
}
