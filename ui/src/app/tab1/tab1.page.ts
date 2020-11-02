import { Component } from '@angular/core';
import { RequestsService } from '../requests/requests.service'

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private requerster:RequestsService) {}

  async test(){
    console.log('execute test method')
    this.requerster.getRequestAngular('https://www.google.com/').then(
      resp => console.log('async',resp)
    )
    let resp = await this.requerster.getRequestAngular('https://www.google.com/')
    console.log('sync',resp)
  }
}
