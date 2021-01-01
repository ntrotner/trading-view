import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { colors } from '../../../../schemas/colors';
import { Chart } from 'chart.js';
import { PortfolioService } from '../services/portfolio/portfolio.service';

@Component({
  selector: 'app-chart-history',
  templateUrl: './chart-history.component.html',
  styleUrls: ['./chart-history.component.scss'],
})
export class ChartHistoryComponent {
  @Input() fiatString: string;
  @Input() fiatExchange: { [key: string]: { price: number } }; // key is currency 

  @ViewChild('lineChart') lineChart: ElementRef;
  line: Chart;

  constructor(private portfolio: PortfolioService) { }

  ionViewDidEnter() {
    this.createLine();
    this.updateLine();
  }

  /**
   * updated chart to segment
   * 
   * @param segment 
   */
  public segmentChange(segment: string) {
    if (segment === 'history') {
      this.updateLine();
      this.lineChart.nativeElement.style.visibility = 'visible';
      this.lineChart.nativeElement.style.position = 'initial';
    } else {
      this.lineChart.nativeElement.style.visibility = 'hidden';
      this.lineChart.nativeElement.style.position = 'fixed';
    }
  }

  /**
   * creates the line chart
   */
  public createLine() {
    try {
      this.line = new Chart(this.lineChart.nativeElement, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: []
          }],
        },
        options: {
          tooltips: {
            callbacks: {
              label: (tooltipItem, data) => {
                var label = tooltipItem.yLabel || '';
                return label != '' ? label.toFixed(2) + ' ' + this.fiatString.toUpperCase() : label;
              },
              title: (tooltipItem, data) => {
                var label = tooltipItem[0].xLabel || '';
                let dateLabel = new Date(label);
                return label != '' ?
                  `${dateLabel.getDay()}.${dateLabel.getMonth() + 1}.${dateLabel.getFullYear()} ` +
                  `${dateLabel.getHours()}:${(dateLabel.getMinutes() < 10 ? '0' : '') + dateLabel.getMinutes()}`
                  : label;
              },
            }
          },
          legend: {
            display: false,
            onClick: (e) => e.stopPropagation()
          },
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'hour',
                displayFormats: {
                  'minute': 'HH:mm',
                  'hour': 'HH:mm',
                  'day': 'h:mm a',
                  'week': 'MMM DD',
                  'month': 'MMM DD',
                }
              },
              display: true,
            }],
            yAxes: [{
              ticks: {
                autoSkip: true,
                maxTicksLimit: 8,
                callback: (value, index, values) => Number(value.toFixed(2))
              }
            }]
          }
        }
      });
    } catch { }
  }

  /**
   * updates the line chart
   */
  public updateLine() {
    try {
      this.line.data.datasets.forEach((set) => {
        set.spanGaps = true;
        set.data = this.portfolio.getTempPortfolio().history.map((value) => {
          return { t: value.date.toLocaleString(), y: value[this.fiatString] }
        });
        set.borderColor = colors[3];
        set.pointRadius = 2;
      });
      this.line.update();
    } catch { }
  }
}
