// Angular modules
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
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
  public wallet = this.stateService._stateWallet.value;
  public transactions = this.stateService.getStateTransactions(this.wallet);
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
    this.stateService.stateWallet$.subscribe((state) => {
      this.getAllTransactions(state);
    });

    this.authService.userProfile$.subscribe((profile) => {
      this.userProfile = profile;
    });
  }

  async getAllTransactions(walletId: string) {
    try {
      let transactions = await this.firebaseService.getCollectionData(walletId);

      transactions.forEach((transaction: any) => {
        transaction.formattedDate = formatTransactionDate(transaction.date);
      });

      // Sort transactions by date (newest first)
      transactions.sort(
        (a: any, b: any) =>
          moment(b.formattedDate, 'YYYY-MM-DD HH:mm:ss').valueOf() -
          moment(a.formattedDate, 'YYYY-MM-DD HH:mm:ss').valueOf()
      );

      this.allTransactions = transactions;
      // const findTitle = this.userProfile?.wallets?.fi d

      // localStorage.setItem('type', walletId);
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
