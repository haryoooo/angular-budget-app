// Angular modules
import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';

// Services
import { StoreService } from '@services/store.service';
import {
  OptionsDropdown,
  TransactionService,
} from '@services/transaction.service';
import { FirebaseService } from '@services/firebase.service';
import { Router } from '@angular/router';
// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';
import Chart from 'chart.js/auto'; // Import Chart.js
import { formatMoney } from '@helpers/moneyFormatter.helper';
import * as moment from 'moment';

const initialStateOptions = [
  { name: 'Expense', code: 'exp' },
  { name: 'Income', code: 'inc' },
];

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  standalone: true,
  imports: [
    PageLayoutComponent,
    NgIf,
    NgFor,
    NgClass,
    ProgressBarComponent,
    FormsModule,
    DropdownModule,
    SelectButtonModule,
  ],
})
export class ChartComponent implements OnInit, AfterViewInit {
  public lineChart: any;
  public options: OptionsDropdown[] | undefined;

  public selectedOptions = this.stateService.getStateDropdown();
  public allTransactions: any[] = [];
  public amountTransactions: number = 0;
  public wallet = this.stateService._stateWallet.value;
  public transactions = this.stateService.getStateTransactions(this.wallet);

  public isAscending = true;
  public isAnimating = false;

  public moment = moment;

  // Use ViewChild to grab the canvas element
  @ViewChild('lineCanvas') private lineCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    public storeService: StoreService,
    public router: Router,
    public stateService: TransactionService,
    public firebaseService: FirebaseService
  ) {
    this.stateService.stateOptions$.subscribe((state) => {
      this.selectedOptions = state;

      this.getAllTransactions(state?.name);
      this.createLineChart();
    });
  }

  ngOnInit(): void {
    this.listDropdown();

    // Simulate loading
    setTimeout(() => {
      this.storeService.isLoading.set(false);
    }, 2000);
  }

  ngAfterViewInit(): void {
    this.waitForCanvas();
  }

  // -------------------------------------------------------------------------------
  // NOTE Actions ------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  async getAllTransactions(option: string | undefined) {
    try {
      let transactions = await this.firebaseService.getCollectionData(this.wallet);
      const selectedOpts = option?.toLowerCase();

      transactions?.sort((a: any, b: any) => b.amount - a.amount);

      const payload = transactions?.filter(
        (el: any) => el['type'] === selectedOpts
      );

      this.allTransactions = option ? payload : transactions;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // This method waits until the canvas element is available
  waitForCanvas(): void {
    if (this.lineCanvas && this.lineCanvas.nativeElement) {
      this.createLineChart();
    } else {
      console.warn('lineCanvas not available, retrying...');
      setTimeout(() => {
        this.waitForCanvas(); // Retry until available
      }, 100); // Retry after 100ms
    }
  }

  listDropdown(): void {
    this.options = initialStateOptions;
  }

  handleSetOptions(updateValue: any) {
    this.stateService.setStateDropdown(updateValue?.value);
  }

  getFormattedAmount(amount: number): string {
    return formatMoney(amount);
  }

  sortTransactions() {
    this.allTransactions.sort((a, b) => {
      return this.isAscending ? a.amount - b.amount : b.amount - a.amount;
    });

    this.isAscending = !this.isAscending; // Toggle the order
    this.isAnimating = true;
  }

  async createLineChart() {
    const option = this.selectedOptions;
    const allTransactions = await this.stateService.getStateTransactions(this.wallet);

    const filterTransactions = allTransactions?.filter(
      (el: any) => el?.type === option?.name?.toLowerCase()
    );

    const countAmount = filterTransactions?.reduce(
      (acc: any, el: any) => acc + el?.amount,
      0
    );

    const labels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ];

    const currentMonthNumber = moment().month();
    const subsetData = [65, 59, 80, 81, 56, 55, 40, 50, 75, 100, 35, 40];

    const subsetFilteredData = subsetData?.map((el, index) => {
      if (index === currentMonthNumber) {
        return countAmount;
      }
      return el;
    });

    if (this.lineCanvas && this.lineCanvas.nativeElement) {
      // Create gradient
      const ctx = this.lineCanvas.nativeElement.getContext('2d');
      const gradient = ctx?.createLinearGradient(0, 0, 0, 400);
      if (gradient) {
        gradient.addColorStop(0, 'rgba(42, 157, 143, 0.1)');
        gradient.addColorStop(1, 'rgba(42, 157, 143, 0)');
      }

      // Destroy previous chart instance if it exists
      if (this.lineChart) {
        this.lineChart.destroy();
      }

      this.lineChart = new Chart(this.lineCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              data: subsetFilteredData,
              borderColor: '#29756f',
              backgroundColor: gradient || 'rgba(75,192,192,0.1)',
              fill: true,
              tension: 0.4,
              borderCapStyle: 'round',
              pointBackgroundColor: '#29756f',
              pointBorderColor: 'white',
              pointBorderWidth: 2,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                padding: 10,
                font: {
                  size: 11,
                },
              },
              border: {
                display: false,
              },
            },
            y: {
              grid: {
                display: false,
              },
              ticks: {
                display: false,
              },
              border: {
                display: false,
              },
              beginAtZero: true,
            },
          },
          elements: {
            line: {
              borderWidth: 2,
              tension: 0.4,
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'white',
              titleColor: '#333',
              bodyColor: '#666',
              borderColor: '#ddd',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function (context: any) {
                  return `Rp ${context.raw.toLocaleString()}`;
                },
              },
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    } else {
      console.error('Failed to create chart, canvas not available');
    }
  }

  returnHome(): void {
    this.router.navigate(['home']);
  }
}
