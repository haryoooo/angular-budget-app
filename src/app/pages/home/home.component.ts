// Angular modules
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
// Services
import { TransactionService } from '@services/transaction.service';
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

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [PageLayoutComponent, NgIf, ProgressBarComponent, NgFor, NgClass],
})
export class HomeComponent implements OnInit {
  public allTransactions: any[] = [];
  public moment = moment;
  public greeting: string = '';
  public wallet: string = '';
  public transactions: any;
  public userProfile: any;
  public loading = true;

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

  public ngOnInit(): void {
    // Initialize wallet immediately
    this.initializeWallet();

    // Subscribe to wallet state changes
    this.stateService.stateWallet$.subscribe((walletId) => {
      this.loading = false;
      
      if (walletId && walletId !== this.wallet) {
        this.wallet = walletId;
        this.transactions = this.stateService.getStateTransactions(walletId);
        this.getAllTransactions(walletId);
      }
    });

    // Subscribe to user profile changes
    this.authService.userProfile$.subscribe((profile) => {
      this.userProfile = profile;
    });
  }

  private initializeWallet(): void {
    const isGuest = this.storeService.isGuest();
    this.wallet = isGuest ? 'budget-1' : this.stateService._stateWallet.value;
    
    if (this.wallet) {
      this.getAllTransactions(this.wallet);
    }
  }

  async getAllTransactions(walletId: string) {
    if (!walletId) {
      return;
    }
    
    try {
      let transactions = await this.firebaseService.getCollectionData(walletId);
      this.loading = false;

      // Add display format (optional)
      transactions.forEach((transaction: any) => {
        transaction.formattedDate = formatTransactionDate(transaction.date);
      });

      // Sort by createdAt (or original date field if it includes full timestamp)
      transactions.sort(
        (a: any, b: any) =>
          moment(b.createdAt || b.date).valueOf() - moment(a.createdAt || a.date).valueOf()
      );

      this.allTransactions = transactions;
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
