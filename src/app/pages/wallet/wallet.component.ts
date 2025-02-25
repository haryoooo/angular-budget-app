// Angular modules
import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
// import { ToastModule } from 'primeng/toast';

// Services
import { StoreService } from '@services/store.service';
import { Router } from '@angular/router';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
  standalone: true,
  imports: [PageLayoutComponent, NgIf, ProgressBarComponent, NgClass],
})
export class WalletComponent implements OnInit {
  public activeTab: string = 'cards';

  constructor(public router: Router, public storeService: StoreService) {}

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  public ngOnInit(): void {
    setTimeout((_) => {
      this.storeService.isLoading.set(false);
    }, 2000);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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
