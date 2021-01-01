import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import 'chartjs-plugin-labels';
import { colors } from '../../../../schemas/colors';
import { PortfolioService } from '../services/portfolio/portfolio.service';

@Component({
  selector: 'app-chart-current',
  templateUrl: './chart-current.component.html',
  styleUrls: ['./chart-current.component.scss'],
})
export class ChartCurrentComponent {
  @Input() fiatString: string;
  @Input() fiatExchange: { [key: string]: { price: number } }; // key is currency 

  @ViewChild('doughnutPie') doughnutPie: ElementRef;
  pie: Chart;

  constructor(private portfolio: PortfolioService) { }

  ionViewDidEnter() {
    this.createChart();
    this.updateChart();
  }

  /**
   * updated chart to segment
   * 
   * @param segment 
   */
  public segmentChange(segment: string) {
    if (segment === 'current') {
      this.updateChart();

      this.doughnutPie.nativeElement.style.visibility = 'visible';
      this.doughnutPie.nativeElement.style.position = 'initial';
    } else {
      this.doughnutPie.nativeElement.style.visibility = 'hidden';
      this.doughnutPie.nativeElement.style.position = 'fixed';
    }
  }

  /**
   * returns array of colors with hexa values
   * @param amount 
   */
  private getColorArray(amount: number): Array<string> {
    let finalColors = [];
    for (let index = 0; index < amount; index++) {
      finalColors.push(colors[index % colors.length]);
    }
    return finalColors;
  }

  /**
   * returns number representation of converted currency
   *
   * @param id 
   * @param amount 
   */
  private calculateValueNumber(id: string, amount: number): number {
    if (!this.fiatExchange[id]) { throw new Error('Could\'t get exchange rate') }
    return Number((this.fiatExchange[id].price * amount).toFixed(2));
  }

  /**
   * creates the chart
   */
  public createChart() {
    try {
      this.pie = new Chart(this.doughnutPie.nativeElement, {
        type: 'pie',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderWidth: 1,
          }],
        },
        options: {
          circumference: Math.PI,
          cutoutPercentage: 50,
          rotation: Math.PI,
          legend: {
            display: false,
            onClick: (e) => e.stopPropagation()
          },
          events: [],
          plugins: {
            labels: {
              render: (arg) => arg.percentage > 3 ? `${arg.label}: ${arg.percentage}%` : '',
              textShadow: true,
              shadowBlur: 6,
              shadowColor: 'rgba(0,0,0,1)',
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              fontColor: 'white',
              fontSize: '14',
              position: 'border',
            }
          }
        }
      });
    } catch { }
  }

  /**
   * updates chart with newest portfolio
   */
  public updateChart(): void {
    try {
      // fill pie chart with new data
      this.pie.data.labels = this.portfolio.getTempPortfolio().positions.map((value) => value.id.toUpperCase());
      this.pie.data.datasets.forEach((set) => {
        set.data = this.portfolio.getTempPortfolio().positions.map((value) =>
          value.id !== this.fiatString ? this.calculateValueNumber(value.id, value.amount) : value.amount
        );
        set.backgroundColor = this.getColorArray(this.portfolio.getTempPortfolio().positions.length);
      });
      // finished updating pie chart with current value
      this.pie.update();
    } catch { }
  }

  /**
   * resets the chart
   */
  public clearChart(): void {
    try {
      this.pie.data.labels = [];
      this.pie.data.datasets.forEach((set) => set.data = []);
      this.pie.update();
    } catch { }
  }

}
