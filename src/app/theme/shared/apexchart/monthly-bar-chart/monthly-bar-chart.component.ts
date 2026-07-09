// angular import
import { Component, OnInit, viewChild } from '@angular/core';

// project import

// third party
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-monthly-bar-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './monthly-bar-chart.component.html',
  styleUrl: './monthly-bar-chart.component.scss'
})
export class MonthlyBarChartComponent implements OnInit {
  // public props
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions: Partial<ApexOptions>;
  constructor() {
    this.chartOptions = {
      chart: {
        height: 380,
        type: 'area',
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#2C2075', '#00875A'], // Purple / green theme
      series: [
        {
          name: 'Expected Collections',
          data: [12000, 15000, 18000, 22000, 20000, 25000, 28000, 30000, 27000, 32000, 35000, 40000]
        },
        {
          name: 'Actual Collections',
          data: [11000, 14500, 17200, 21000, 19500, 24000, 27500, 29000, 25000, 31000, 33000, 38500]
        }
      ],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: {
            colors: [
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c'
            ]
          }
        },
        axisBorder: {
          show: true,
          color: '#f0f0f0'
        },
        tickAmount: 11
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#8c8c8c']
          },
          formatter: (value) => {
            return 'AED ' + value.toLocaleString();
          }
        }
      },
      grid: {
        strokeDashArray: 0,
        borderColor: '#f5f5f5'
      },
      theme: {
        mode: 'light'
      }
    };
  }

  // life cycle hook
  ngOnInit() {
    document.querySelector('.chart-income.month')?.classList.add('active');
  }

  // public method
  toggleActive(value: string) {
    this.chartOptions.series = [
      {
        name: 'Expected Collections',
        data: value === 'month' 
          ? [12000, 15000, 18000, 22000, 20000, 25000, 28000, 30000, 27000, 32000, 35000, 40000]
          : [3000, 4500, 3800, 5200, 4800, 6000, 5500]
      },
      {
        name: 'Actual Collections',
        data: value === 'month'
          ? [11000, 14500, 17200, 21000, 19500, 24000, 27500, 29000, 25000, 31000, 33000, 38500]
          : [2800, 4200, 3600, 5000, 4500, 5800, 5200]
      }
    ];
    const xaxis = { ...this.chartOptions.xaxis };
    xaxis.categories =
      value === 'month'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    xaxis.tickAmount = value === 'month' ? 11 : 7;
    this.chartOptions = { ...this.chartOptions, xaxis };
    if (value === 'month') {
      document.querySelector('.chart-income.month')?.classList.add('active');
      document.querySelector('.chart-income.week')?.classList.remove('active');
    } else {
      document.querySelector('.chart-income.week')?.classList.add('active');
      document.querySelector('.chart-income.month')?.classList.remove('active');
    }
  }
}
