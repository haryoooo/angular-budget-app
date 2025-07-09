// Angular modules
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';

// Services
import { StoreService } from '@services/store.service';
import { TransactionService } from '@services/transaction.service';
import { ToastModule } from 'primeng/toast';
import { FirebaseService } from '@services/firebase.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '@services/auth.service';

// Components
import { ProgressBarComponent } from '@blocks/progress-bar/progress-bar.component';
import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';
import * as moment from 'moment';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
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
export class UserComponent implements OnInit {
  public moment = moment;
  public userProfile: any;

  public isSubmitted = false;
  public isAnimating = false;

  public loading = false;

  constructor(
    public storeService: StoreService,
    public router: Router,
    public stateService: TransactionService,
    public firebaseService: FirebaseService,
    public messageService: MessageService,
    public authService: AuthService,
  ) {}

  // Menu items data array
  menuItems = [
    {
      title: 'Account info',
      icon: '../../../assets/img/project/navigation/user.png',
      route: '/account-info',
    },
    {
      title: 'Personal profile',
      icon: '../../../assets/img/project/navigation/users.png',
      route: '/personal-profile',
    },
    {
      title: 'Login and security',
      icon: '../../../assets/img/project/navigation/shield-checkered.png',
      route: '/login-security',
    },
  ];

  public showMessageNotification(sign: string, message: string): void {
    this.messageService.add({
      severity: sign.toLowerCase(),
      summary: sign,
      detail: message,
    });
  }

  // Single navigation method
  navigateToPage(route: string) {
    this.router.navigateByUrl(route);
  }

  public logout() {
    this.firebaseService.logoutUser();
    this.showMessageNotification('Success', 'Logout Success');
    localStorage.clear();
    
    setTimeout(() => {
      this.navigateToPage("/")
    }, 1000);
  }

  ngOnInit(): void {
    this.authService.userProfile$.subscribe((profile) => {
      this.userProfile = profile;
    });
  }
}
