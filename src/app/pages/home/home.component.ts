// Angular modules
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
// Services
import { AddState, TransactionService } from '@services/transaction.service';
import { StoreService } from '@services/store.service';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';

import * as moment from 'moment';
import { formatMoney } from '@helpers/moneyFormatter.helper';
import { FirebaseService } from '@services/firebase.service';
import { calculateTransaction } from '@helpers/transactionSum.helper';
import formatTransactionDate from '@helpers/formatTransactionDate.helper';
import { AuthService } from '@services/auth.service';
import generateIdFormat from '@helpers/generateIdFormat.helper';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [PageLayoutComponent, NgIf, ProgressBarComponent, NgFor, NgClass],
})
export class HomeComponent implements OnInit {
  public allTransactions: AddState[] | void | any = [];
  public moment = moment;
  public greeting: string = '';
  public wallet: string = '';
  public transactions: any;
  public userProfile: any;
  public loading = true;
  public isGuest = this.storeService.isGuest();

  constructor(
    public storeService: StoreService,
    public stateService: TransactionService,
    public firebaseService: FirebaseService,
    public authService: AuthService,
    public router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  ngOnInit(): void {
    this.initializeWallet();

    // Subscribe to wallet changes
    this.stateService.stateWallet$.subscribe((walletId) => {
      const id = generateIdFormat(walletId);
      
      this.loading = false;
      if (walletId && walletId !== this.wallet) {
        this.wallet = walletId;

        if (!this.isGuest) {
          this.getAllTransactions(id);
        }
      }
    });

    // ✅ Subscribe to guest transactions (only in guest mode)
    if (this.isGuest) {
      this.stateService.stateTransactions$.subscribe((guestTransactions) => {
        this.loading = false;
        this.allTransactions = [...guestTransactions].map(
          (transaction: AddState) => ({
            ...transaction,
            formattedDate: transaction.date
          })
        );

        this.sortTransactions(this.allTransactions);
        this.cdr.detectChanges();
      });
    }

    // Subscribe to profile
    this.authService.userProfile$.subscribe((profile) => {
      this.userProfile = profile;
    });
  }

  public sortTransactions(allTransactions: AddState[]): AddState[] {
    const tempTransactions = [...allTransactions];

    tempTransactions.sort((a: AddState, b: AddState) => {
      return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
    });
    
    return tempTransactions; // Return the sorted array
  }

  public formatDate(date: string): string {
    return moment(date).format('dddd, MMMM D, YYYY');
  }

  private initializeWallet(): void {
    const id = generateIdFormat(this.stateService._stateWallet.value);
    const isGuest = this.storeService.isGuest();
    this.wallet = isGuest ? 'Budget 1' : this.stateService._stateWallet.value;

    if (this.wallet) {
      this.getAllTransactions(id);
    }
  }

  async getAllTransactions(walletId: string) {
    const id = generateIdFormat(this.stateService._stateWallet.value);

    if (!walletId) {
      return;
    }

    try {
      let transactions = this.isGuest
        ? this?.stateService?._stateTransactions?.value
        : await this.firebaseService.getCollectionData(id);
      this.loading = false;

      // Add display format (optional)
      transactions.forEach((transaction: any) => {
        transaction.formattedDate = formatTransactionDate(transaction.date);
      });

      this.allTransactions = this.sortTransactions(transactions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getFormattedAmount(amount: number): string {
    return formatMoney(amount);
  }

  calculateTransactions(type: string) {
    const result = calculateTransaction(this.allTransactions, type);
    return formatMoney(result);
  }

  navigateTo(url: string, id: string): void {
    this.router.navigate([url], {
      queryParams: { id: id },
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    return hour < 12
      ? 'Good Morning,'
      : hour < 18
      ? 'Good Afternoon,'
      : 'Good Evening,';
  }

  get isAmountVisible(): boolean {
    return this.storeService.isAmountVisible();
  }

  toggleAmountVisibility(): void {
    this.storeService.isAmountVisible.set(!this.storeService.isAmountVisible());
  }

  getMaskedAmount(): string {
    return '••••••••';
  }

  onLogout(): void {
    this.storeService.isGuest.set(false);
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  // -------------------------------------------------------------------------------
  // NOTE Actions ------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Computed props -----------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Helpers ------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Requests -----------------------------------------------------------------
  // -------------------------------------------------------------------------------

  // -------------------------------------------------------------------------------
  // NOTE Subscriptions ------------------------------------------------------------
  // -------------------------------------------------------------------------------
}
