// Angular modules
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

// Services
import { StoreService } from '@services/store.service';
import { TransactionService } from '@services/transaction.service';
import { ToastModule } from 'primeng/toast';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';
import * as moment from 'moment';
import { formatMoney, parseMoney } from '@helpers/moneyFormatter.helper';
import { FirebaseService } from '@services/firebase.service';
import { MessageService } from 'primeng/api';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone: true,
  imports: [
    PageLayoutComponent,
    NgIf,
    ProgressBarComponent,
    CommonModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class TransactionsComponent implements OnInit {
  public stateTransaction: any = [];
  public moment = moment;
  public stateAdd: any;
  public queryId = this.route.snapshot.queryParams['id'];
  public wallet = this.stateService._stateWallet.value;

  public isModalOpen = false;
  public isSubmitted = false;
  public isAnimating = false;

  public loading = false;

  constructor(
    public storeService: StoreService,
    public router: Router,
    public stateService: TransactionService,
    public firebaseService: FirebaseService,
    public messageService: MessageService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  showMessageNotification(sign: string, message: string): void {
    this.messageService.add({
      severity: sign.toLowerCase(),
      summary: sign,
      detail: message,
    });
  }

  openModal(): void {
    this.isModalOpen = true;
    this.cdr.detectChanges(); // Force Angular to detect changes
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.cdr.detectChanges(); // Force Angular to detect changes
  }

  confirmTransaction(): void {
    this.showMessageNotification('Success', 'Success delete transaction');
    this.isSubmitted = true;

    setTimeout(() => {
      this.deleteTransaction();
      this.returnHome();
      this.isSubmitted = false;
    }, 1000);
  }

  deleteTransaction(): void {
    const id = this.queryId;

    this.stateService.deleteTransaction(id);

    this.isAnimating = true;

    this.cdr.detectChanges(); // Trigger change detection
  }

  ngOnInit(): void {
    this.getDataTransaction(this.wallet).then(() => {
      // Now that stateTransaction is available, we can safely update stateAdd

      // Subscribe to state changes
      this.stateService.stateAdd$.subscribe((state) => {
        this.updateStateAdd(state);
      });

      // Listen for query parameter changes
      this.route.queryParams.subscribe((params) => {
        this.queryId = params['id']; // Update queryId when URL changes
        this.updateStateAdd(this.stateAdd); // Ensure state is updated when queryId changes
      });

      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          this.updateStateAdd(this.stateAdd);
        });

      setTimeout(() => {
        this.storeService.isLoading.set(false);
      }, 2000);
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const modal = document.querySelector('.modal');
    if (this.isModalOpen && modal && !modal.contains(event.target as Node)) {
      this.closeModal();
    }
  }

  updateStateAdd(state: any) {
    const paramValue = this.queryId;
    const filterById = this.stateTransaction?.find(
      (el: any) => el?.identifier === paramValue
    );

    if (filterById?.identifier) {
      const { id, ...filteredData } = filterById;
      this.stateAdd = { ...filteredData };
    } else {
      this.stateAdd = { ...state };
    }

    this.cdr.detectChanges(); // Trigger change detection
  }

  handleNavigation() {
    this.updateStateAdd(this.stateAdd);
  }

  async getDataTransaction(collectionName: string) {
    try {
      this.stateTransaction = await this.firebaseService
        .getCollectionData(collectionName)
        .then((el) => el);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  updateName(event: Event): void {
    this.stateAdd = {
      ...this.stateAdd,
      desc: (event.target as HTMLInputElement).value,
    };
    this.cdr.detectChanges();
  }

  updateNameWallet(event: Event): void {
    this.stateAdd = {
      ...this.stateAdd,
      desc: (event.target as HTMLInputElement).value,
    };
    this.cdr.detectChanges();
  }

  updateType(selectedType: string): void {
    this.stateAdd = { ...this.stateAdd, type: selectedType };
    this.cdr.detectChanges();
  }

  updateAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Allow only numbers and dots (thousands separator)
    if (!/^[\d.]+$/.test(value)) {
      input.value = ''; // Clear input if it contains alphabets
      return;
    }

    let parsedAmount = parseMoney(input.value); // Parse input value

    // Convert BigInt to string if necessary
    const amount =
      typeof parsedAmount === 'bigint' ? parsedAmount.toString() : parsedAmount;

    // Update state with unformatted value
    this.stateAdd = { ...this.stateAdd, amount };

    // Manually update input field with formatted value
    input.value = formatMoney(amount);

    this.cdr.detectChanges();
  }

  updateDate(event: Event): void {
    const inputDate = (event.target as HTMLInputElement).value; // Expected format: 'YYYY-MM-DD'

    this.stateAdd = {
      ...this.stateAdd,
      date: moment(inputDate, 'YYYY-MM-DD').format('dddd, MMMM D, YYYY'), // Store formatted date without time
    };

    this.cdr.detectChanges();
  }

  clearAmount(): void {
    this.stateAdd = { ...this.stateAdd, amount: 0 };
    this.cdr.detectChanges();
  }

  getFormattedAmount(): string {
    return formatMoney(this.stateAdd.amount);
  }

  isFormValid(): boolean {
    const { desc, type, amount, date } = this.stateAdd;
    return desc && type && amount > 0 && date;
  }

  returnHome(): void {
    this.router.navigate(['home']);
  }

  submitTransaction(): void {
    this.loading = true;

    const paramValueEdit = this.queryId;
    const messageSuccess = paramValueEdit
      ? 'Success edit transaction'
      : 'Success add transaction';

    const newTransaction = {
      type: this.stateAdd.type,
      date: moment(this.stateAdd.date).format('dddd, MMMM D, YYYY'),
      desc: this.stateAdd.desc,
      amount: this.stateAdd.amount,
    };

    this.isSubmitted = true;

    this.showMessageNotification('Success', messageSuccess);

    setTimeout(() => {
      if (paramValueEdit) {
        this.stateService.updateTransaction(paramValueEdit, this.stateAdd);
            this.cdr.detectChanges();
      } else {
        this.stateService.setLatestTransactions(newTransaction);
        this.cdr.detectChanges();
      }
      this.stateService.resetStateAdd();
      this.returnHome();
      this.isSubmitted = false;
      this.loading = false;
    }, 1000);
  }
}
