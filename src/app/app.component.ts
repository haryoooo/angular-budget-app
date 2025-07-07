// Angular modules
import { NgIf }             from '@angular/common';
import { Component }        from '@angular/core';
import { OnInit }           from '@angular/core';
import { Router, RouterOutlet }     from '@angular/router';

// Services
import { StoreService }     from '@services/store.service';

// Components
import { ToastComponent }   from '@blocks/toast/toast.component';
import { AuthService } from '@services/auth.service';

@Component({
  selector    : 'app-root',
  templateUrl : './app.component.html',
  styleUrls   : ['./app.component.scss'],
  standalone  : true,
  imports     : [RouterOutlet, ToastComponent, NgIf]
})
export class AppComponent implements OnInit
{
  public userProfile: any = this.authService.userProfileSubject.value;
  public userAuthorization: any = this.authService.authStateSubject.value;

  constructor
  (
    public storeService : StoreService,
    public authService : AuthService,
    private router: Router,
  )
  {
    this.authService.authState$.subscribe(state => {
      console.log(this.userAuthorization, "auth :");
      if (state === 'authenticated') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  public ngOnInit() : void {}

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
