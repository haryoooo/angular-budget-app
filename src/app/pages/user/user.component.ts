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
    private route: ActivatedRoute
  ) {}

  showMessageNotification(sign: string, message: string): void {
    this.messageService.add({
      severity: sign.toLowerCase(),
      summary: sign,
      detail: message,
    });
  }

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

  // Single navigation method
  navigateToPage(route: string) {
    this.router.navigateByUrl(route);
  }

  ngOnInit(): void {}
}
