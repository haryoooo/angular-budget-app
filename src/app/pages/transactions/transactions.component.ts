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
import { AddState, TransactionService } from '@services/transaction.service';
import { ToastModule } from 'primeng/toast';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';
import * as moment from 'moment';
import { formatMoney, parseMoney } from '@helpers/moneyFormatter.helper';
import { FirebaseService } from '@services/firebase.service';
import { MessageService } from 'primeng/api';
import { filter } from 'rxjs/operators';
import generateIdFormat from '@helpers/generateIdFormat.helper';

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
  public stateTransaction: AddState[] = [];
  public moment = moment;
  public stateAdd: any;
  public queryId = this.route.snapshot.queryParams['id'];
  public wallet = generateIdFormat(this.stateService._stateWallet.value);
  public isGuest = this.storeService.isGuest();

  public isModalOpen = false;
  public isSubmitted = false;
  public isAnimating = false;

  public loading = false;
  public now = moment();

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

  async deleteTransaction(): Promise<void> {
    const id = this.queryId;

    await this.stateService.deleteTransaction(id, this.isGuest);

    this.isAnimating = true;
    await this.getDataTransaction(this.wallet); // Re-fetch stateTransaction if needed

    this.cdr.detectChanges(); // Trigger change detection
  }

  ngOnInit(): void {
    this.getDataTransaction(this.wallet).then(() => {
      // Existing subscription for stateAdd
      this.stateService.stateAdd$.subscribe((state) => {
        this.updateStateAdd(state);
      });

      // ✅ If guest, re-render stateTransaction on update
      if (this.isGuest) {
        this.stateService.stateTransactions$.subscribe((transactions) => {
          this.stateTransaction = transactions; // Update local state
          this.updateStateAdd(this.stateAdd);   // Re-pick correct transaction
          this.cdr.detectChanges();             // Trigger re-render
        });
      }

      // Query param & navigation subscriptions
      this.route.queryParams.subscribe((params) => {
        this.queryId = params['id'];
        this.updateStateAdd(this.stateAdd);
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

  updateStateAdd(state: AddState) {
    const paramValue = this.queryId;
    const filterById = this.stateTransaction?.find(
      (el: any) => el?.identifier === paramValue
    );

    if (filterById?.identifier) {
      const { identifier, ...filteredData } = filterById;

      // ✅ Preserve createdAt
      this.stateAdd = {
        ...filteredData,
        createdAt: filterById.createdAt ?? moment().format('YYYY-MM-DD HH:mm:ss'),
      };
    } else {
      this.stateAdd = {
        ...state,
        createdAt: state.createdAt ?? moment().format('YYYY-MM-DD HH:mm:ss'),
      };
    }

    this.cdr.detectChanges(); // Trigger change detection
  }

  handleNavigation() {
    this.updateStateAdd(this.stateAdd);
  }

  async getDataTransaction(collectionName: string) {
    try {
      const data = await this.firebaseService.getCollectionData(collectionName);
      this.stateTransaction = data;
      this.stateService._stateTransactions.next(data); // Push to state
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  updateName(event: Event): void {
    this.stateAdd = {
      ...this.stateAdd,
      lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'),
      desc: (event.target as HTMLInputElement).value,
    };
    this.cdr.detectChanges();
  }

  updateNameWallet(event: Event): void {
    this.stateAdd = {
      ...this.stateAdd,
      lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'),
      desc: (event.target as HTMLInputElement).value,
    };
    this.cdr.detectChanges();
  }

  updateType(selectedType: string): void {
    this.stateAdd = { ...this.stateAdd, type: selectedType, lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'), };
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
    this.stateAdd = { ...this.stateAdd, amount, lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'), };

    // Manually update input field with formatted value
    input.value = formatMoney(amount);

    this.cdr.detectChanges();
  }

  updateDate(event: Event): void {
    const inputDate = (event.target as HTMLInputElement).value; // Expected format: 'YYYY-MM-DD'

    this.stateAdd = {
      ...this.stateAdd,
      lastUpdate: moment(inputDate).format('YYYY-MM-DD HH:mm:ss'),
      date: moment(inputDate, 'YYYY-MM-DD').format('dddd, MMMM D, YYYY'), // Store formatted date without time
      month: moment(inputDate).month() + 1
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

  async submitTransaction(): Promise<void> {
    this.loading = true;

    const paramValueEdit = this.queryId;

    const messageSuccess = paramValueEdit
      ? 'Success edit transaction'
      : 'Success add transaction';

    const newTransaction = {
      type: this.stateAdd.type,
      date: moment(this.stateAdd.date).format('dddd, MMMM D, YYYY'),
      month: moment(this.stateAdd.date).month() + 1,
      desc: this.stateAdd.desc,
      amount: this.stateAdd.amount,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    this.isSubmitted = true;
    this.showMessageNotification('Success', messageSuccess);
    
    console.log(this.stateAdd);

    if (paramValueEdit) {
      await this.stateService.updateTransaction(paramValueEdit, this.stateAdd, this.isGuest);
    } else {
      await this.stateService.setLatestTransactions(newTransaction, this.isGuest);
    }

    await this.getDataTransaction(this.wallet); // Update local view

    this.stateService.resetStateAdd();
    this.isSubmitted = false;
    this.loading = false;
    // Navigate Home
    this.returnHome();

    this.cdr.detectChanges();
  }
}
