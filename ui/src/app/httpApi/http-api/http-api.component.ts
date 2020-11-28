import { Component, OnInit } from '@angular/core';
import { RequestsService } from '../../requests/requests.service'

@Component({
  selector: 'app-http-api',
  templateUrl: './http-api.component.html',
  styleUrls: ['./http-api.component.scss'],
})
export class HttpApiComponent implements OnInit {

  constructor(private requests: RequestsService) { }

  ngOnInit() {}

}
