// Angular modules
import { NgClass, NgIf, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
// import { ToastModule } from 'primeng/toast';

// Services
import { StoreService } from '@services/store.service';
import { Router } from '@angular/router';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';
import { TransactionService } from '@services/transaction.service';

interface Option {
  id: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
  standalone: true,
  imports: [PageLayoutComponent, NgIf, ProgressBarComponent, NgClass, NgFor],
})
export class WalletComponent implements OnInit {
  public wallet = this.stateService._stateWallet.value;
  public activeTab: string = 'accounts';
  public selectedOption: string = this.wallet; // Default selected option
  public loading = false;

  constructor(
    public router: Router,
    public stateService: TransactionService,
    public storeService: StoreService
  ) { }

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  options: Option[] = [
    {
      id: 'budget',
      title: 'Wallet 1',
      description: 'Connect into wallet 1 to organize your funds',
    },
    {
      id: 'budget-2',
      title: 'Wallet 2',
      description: 'Connect into wallet 2 to organize your funds',
    },
    {
      id: 'budget-3',
      title: 'Wallet 3',
      description: 'Connect into wallet 3 to organize your funds',
    },
  ];

  public ngOnInit(): void {
    setTimeout((_) => {
      this.storeService.isLoading.set(false);
    }, 2000);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  selectOption(optionId: string): void {
    this.selectedOption = optionId;
  }

  getIconSrc(optionId: string): string {
    return this.selectedOption === optionId
      ? '../../../assets/img/project/navigation/wallet-fill.png'
      : '../../../assets/img/project/navigation/wallet.png';
  }

  submitChangeWallet(): void {
    this.loading = true;
    this.stateService.setWallet(this.selectedOption)

    setTimeout(() => { 
      this.router.navigate(['home']), 
      this.loading = false; 
    }, 1000)
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
