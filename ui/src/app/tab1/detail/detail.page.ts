import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { chartOverviewColors } from '../../../../../schemas/colors'

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(
      data => console.log(data)
    )
    this.buildCandlestickChart(document.getElementById('candlestick'))
  }

  buildCandlestickChart(htmlReference:HTMLElement){
    var candlestickChart = new Chart(htmlReference, {
      type: 'bar',
      data: {
        labels: [1,2,3,4,5],
        datasets: [{ 
            data: [[1,2],[2,3],[3,4],[5,3]],
            barThickness:20,
            backgroundColor:'#4E787',
          },
          {
            data: [[0,3],[1,3],[3,5],[6,2]],
            barThickness:4,
            backgroundColor:chartOverviewColors[]
          }]
        },
      options: {
        scales: {
          xAxes: [{
            stacked:true
          }],
          yAxes: [{
              
          }]
        }
      }
    });
  }

}
