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
  public appName: string = environment.appName;
  public isMenuCollapsed: boolean = true;

  constructor(private router: Router) { }

  // Navigation items for the bottom navigation bar
  public navItems = [
    {
      src: '../../../../../assets/img/project/navigation/home.png',
      alt: 'home',
    },
    {
      src: '../../../../../assets/img/project/navigation/chart.png',
      alt: 'chart',
    },
    {
      src: '../../../../../assets/img/project/navigation/wallet.png',
      alt: 'wallet',
    },
    {
      src: '../../../../../assets/img/project/navigation/user.png',
      alt: 'user',
    },
  ];

  public ngOnInit(): void { }
  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------

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
      src: `${navItems.src?.slice(0, 45)}${navItems?.alt}-fill.png`,
    };
  }

  public isActive(navItem: any): boolean {
    return this.router.url.includes(navItem.alt) && !this.router.url.includes('transaction'); // Simplified example
  }

  public isShowed(): boolean {
    if(this.router.url.includes('transaction')){
      return false
    }

    return true
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
