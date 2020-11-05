import { Component } from '@angular/core';
import { RequestsService } from '../requests/requests.service'
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private requerster:RequestsService) {}

  

  async test(){

    let test = new HttpHeaders({
      'step':'900',
      'limit':'12',
    })

    let httpOptions = {
      //observe:'response',
      //responseType:'json',
      //headers:test
    }

    let link1 = 'https://www.bitstamp.net/api/v2/ohlc/btceur' //ohlc
    let link2 = 'https://www.bitstamp.net/api/v2/ticker/btceur/' //ticker
    let link3 = 'https://www.bitstamp.net/api/v2/ohlc/btceur?step=900&limit=12' //ohlc+params
    console.log('execute test method',test)
    this.requerster.getRequestAngular(link3,httpOptions).then(
      resp => console.log('async',resp)
    )
    let resp = await this.requerster.getRequestAngular(link3,httpOptions)
    console.log('sync',resp)
  }
}
