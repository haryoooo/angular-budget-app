// Angular modules
import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

// Services
import { StoreService } from '@services/store.service';
import { TransactionService } from '@services/transaction.service';

// Components
import { ToastComponent } from '@blocks/toast/toast.component';
import { AuthService } from '@services/auth.service';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FirebaseService } from '@services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NgIf],
})
export class AppComponent implements OnInit {
  public userProfile: any = this.authService.userProfileSubject.value;
  public userAuthorization: any = this.authService.authStateSubject.value;
  public setUserAuthorization: any = this.authService.setUserAuthorization;
  public setUserProfile: any = this.authService.setUserProfile;

  private static readonly AUTH_UID_KEY = 'budgetAppActiveAuthUid';

  constructor(
    public storeService: StoreService,
    public authService: AuthService,
    public firebaseService: FirebaseService,
    private router: Router,
    private transactionService: TransactionService
  ) {}

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  public ngOnInit(): void {
    this.restoreAuthState();
  }

  // -------------------------------------------------------------------------------
  // NOTE Actions ------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  private restoreAuthState(): void {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const previousUid = sessionStorage.getItem(AppComponent.AUTH_UID_KEY);
        if (previousUid && previousUid !== user.uid) {
          localStorage.removeItem('type');
          this.transactionService.setWallet('');
        }
        sessionStorage.setItem(AppComponent.AUTH_UID_KEY, user.uid);

        const profile = await this.firebaseService.loadUserProfile(user.uid);

        this.authService.setUserAuthorization(user, 'authenticated');
        this.authService.setUserProfile(profile);
      } else {
        sessionStorage.removeItem(AppComponent.AUTH_UID_KEY);
        localStorage.removeItem('type');
        this.transactionService.setWallet('');
        this.authService.setUserAuthorization(null, 'unauthenticated');
        this.authService.setUserProfile(null);
      }

      this.authService.authRestoredSubject.next(true);
      
      // Apply auth guard after state change
      this.authGuard();
    });
  }

  private authGuard(): void {
    const currentUrl = this.router.url;
    const authState = this.authService.authStateSubject.value;
    const isAuthenticated = authState === 'authenticated';

    if (isAuthenticated) {
      // User is authenticated
      if (currentUrl === '/' || currentUrl.startsWith('/auth/login')) {
        console.log('Redirecting authenticated user to /home');
        this.router.navigateByUrl('/home');
      }
    } else {
      // User is not authenticated
      if (!currentUrl.startsWith('/auth') && currentUrl !== '/') {
        console.log('Redirecting unauthenticated user to /auth/login');
        this.router.navigateByUrl('/auth/login');
      }
    }
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