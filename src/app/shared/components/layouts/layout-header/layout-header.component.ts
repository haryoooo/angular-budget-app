// Angular modules
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

// External modules
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

// Internal modules
import { environment } from '@env/environment';
import { NgFor, NgIf } from '@angular/common';
import { StoreService } from '@services/store.service';

@Component({
  selector: 'app-layout-header',
  templateUrl: './layout-header.component.html',
  styleUrls: ['./layout-header.component.scss'],
  standalone: true,
  imports: [
    NgbCollapse,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    TranslateModule,
    NgFor,
    NgIf,
  ],
})
export class LayoutHeaderComponent implements OnInit {
  private isGuest = this.storeService.isGuest();
  public appName: string = environment.appName;
  public isMenuCollapsed: boolean = true;
  public addMenuOpen = false;

  constructor(private router: Router, private storeService: StoreService) {}

  // Navigation items for the bottom navigation bar
  public navItems = [
    {
      src: '../../../../../assets/img/project/navigation/home.svg',
      alt: 'home',
    },
    {
      src: '../../../../../assets/img/project/navigation/chart.svg',
      alt: 'chart',
    },
    {
      src: '../../../../../assets/img/project/navigation/wallet.svg',
      alt: 'wallet',
    },
    {
      src: '../../../../../assets/img/project/navigation/user.svg',
      alt: 'user',
    },
  ];

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  public ngOnInit(): void {
    if(this.isGuest){
      this.navItems.pop(); // Removes the last item
    }
  }

  // -------------------------------------------------------------------------------
  // NOTE Actions ------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  public async onClickLogout(): Promise<void> {
    // NOTE Redirect to login
    this.router.navigate(['/auth/login']);
  }

  public ngOnActive(navItems: any): any {
    return {
      ...navItems,
      src: `${navItems.src?.slice(0, 45)}${navItems?.alt}-fill.svg`,
    };
  }

  public isActive(navItem: any): boolean {
    return this.router.url.includes(navItem.alt) && !this.router.url.includes('transaction'); // Simplified example
  }

  public isShowed(): boolean {
    if (this.router.url.includes('transaction')) {
      return false;
    }
    if (this.router.url.includes('receipt-scan')) {
      return false;
    }

    return true;
  }

  public showFloatingAdd(): boolean {
    return (
      this.isActive({ alt: 'home' }) &&
      !this.router.url.includes('receipt-scan')
    );
  }

  public toggleAddMenu(event: Event): void {
    event.stopPropagation();
    this.addMenuOpen = !this.addMenuOpen;
  }

  public closeAddMenu(): void {
    this.addMenuOpen = false;
  }

  public goManual(): void {
    this.closeAddMenu();
    this.navigateTo('home/transactions');
  }

  public goReceiptScan(): void {
    this.closeAddMenu();
    this.navigateTo('home/receipt-scan');
  }

  public navigateTo(url: string): void {
    this.router.navigateByUrl(url, { replaceUrl: true });
  }

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
