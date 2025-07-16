// Angular modules
import { NgClass } from '@angular/common';
import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

// External modules
import { TranslateModule } from '@ngx-translate/core';

// Internal modules
import { environment } from '@env/environment';

// Services
import { AppService } from '@services/app.service';
import { StoreService } from '@services/store.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { passwordMatchValidator } from '@helpers/passwordMatchValidator.helper';
import { FirebaseService } from '@services/firebase.service';
import { AuthService } from '@services/auth.service';
import { TransactionService } from '@services/transaction.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    RouterLink,
    TranslateModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class LoginComponent {
  public appName: string = environment.appName;
  public formGroup!: FormGroup<{
    fullname: FormControl<string>;
    username: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;
  public showPassword: boolean = false;
  public currentPath: string = '';

  constructor(
    private router: Router,
    private storeService: StoreService,
    private appService: AppService,
    public firebaseService: FirebaseService,
    public authService: AuthService,
    public messageService: MessageService,
    public transactionService: TransactionService
  ) {
    this.initFormGroup(),
      this.router.events.subscribe(() => {
        this.currentPath = this.router.url; // same as pathname
      });
  }

  // -------------------------------------------------------------------------------
  // NOTE Init ---------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  ngOnInit() {}

  private initFormGroup(): void {
    this.formGroup = new FormGroup(
      {
        fullname: new FormControl<string>(
          {
            value: '',
            disabled: false,
          },
          {
            validators: [
              Validators.required,
              Validators.minLength(6),
              Validators.pattern(/^[a-zA-Z]+(\s[a-zA-Z]+)*$/),
            ],
            nonNullable: true,
          }
        ),
        username: new FormControl<string>(
          {
            value: '',
            disabled: false,
          },
          {
            validators: [Validators.required, Validators.pattern(/^[^\s]*$/)],
            nonNullable: true,
          }
        ),
        email: new FormControl<string>(
          {
            value: '',
            disabled: false,
          },
          {
            validators: [Validators.required, Validators.email],
            nonNullable: true,
          }
        ),
        password: new FormControl<string>(
          {
            value: '',
            disabled: false,
          },
          {
            validators: [
              Validators.required,
              Validators.pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
              ),
            ],
            nonNullable: true,
          }
        ),
        confirmPassword: new FormControl<string>(
          {
            value: '',
            disabled: false,
          },
          { validators: [Validators.required], nonNullable: true }
        ),
      },
      { validators: passwordMatchValidator() }
    );
  }

  // -------------------------------------------------------------------------------
  // NOTE Actions ------------------------------------------------------------------
  // -------------------------------------------------------------------------------
  public showMessageNotification(sign: string, message: string): void {
    this.messageService.add({
      severity: sign.toLowerCase(),
      summary: sign,
      detail: message,
    });
  }

  public async onClickSubmit(): Promise<void> {
    if (this.currentPath === '/auth/login') {
      const email = this.formGroup.controls.email.getRawValue();
      const password = this.formGroup.controls.password.getRawValue();

      if (
        !email ||
        !password ||
        this.formGroup.controls.email.invalid ||
        this.formGroup.controls.password.invalid
      ) {
        this.markFormGroupTouched();
        return;
      }

      await this.login(email, password);
    } else {
      // Registration flow
      if (this.formGroup.valid) {
        await this.authenticate(); // Register
      } else {
        this.markFormGroupTouched();
      }
    }
  }

  // Main login method
  public async login(email: string, password: string) {
    try {
      localStorage.clear();
      this.storeService.isLoading.set(true);

      const users: any = await this.firebaseService.loginUser(email, password);

      if (users?.user?.accessToken) {
        this.showMessageNotification('Success', 'Login Success');
        this.storeService.isLoading.set(false);
        this.storeService.isGuest.set(false);

        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      console.log(error, 'error :');
      this.storeService.isLoading.set(false);

      if(error.message === "Firebase: Error (auth/invalid-credential)."){
        this.showMessageNotification('Error', 'Incorrect email or password.');
        return
      }

      this.showMessageNotification('Error', JSON.stringify(error?.code));
    }
  }

  public onClickGuest(): void {
    this.storeService.isGuest.set(true);
    this.firebaseService.createUserWallet('budget-1')
    
    // The TransactionService will automatically handle wallet changes
    // based on the guest state, so we don't need to manually set the wallet
    setTimeout(() => { 
      this.router.navigate(['/home']);
    }, 500); // Reduced timeout for better UX
  }

  public onClickTogglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  public onClickForgotPassword(): void {
    // Navigate to forgot password page
    this.router.navigate(['/forgot-password']);
  }

  public onClickSignUp(): void {
    // Navigate to sign up page
    this.router.navigate(['/auth/signup']);
  }

  public onClickLogin(): void {
    // Navigate to sign up page
    this.router.navigate(['/auth/login']);
  }

  // -------------------------------------------------------------------------------
  // NOTE Requests -----------------------------------------------------------------
  // -------------------------------------------------------------------------------

  private async authenticate(): Promise<void> {
    this.storeService.isLoading.set(true);

    const fullname = this.formGroup.controls.fullname.getRawValue();
    const username = this.formGroup.controls.username.getRawValue();
    const email = this.formGroup.controls.email.getRawValue();
    const password = this.formGroup.controls.password.getRawValue();
    const confirmPassword = this.formGroup.controls.confirmPassword.getRawValue();

    const success = await this.appService.authenticate(email, password);

    const payload = {
      fullname,
      username,
      email,
      password,
      confirmPassword,
    };

    // Signup Phase
    if (fullname?.length > 0) {
      try {
        const users: any = await this.firebaseService.createUser(payload);
        if (users?.accessToken) {
          this.showMessageNotification(
            'Success',
            'Your account has been created'
          );
          this.storeService.isLoading.set(false);

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 500);
          return;
        }
      } catch (error: any) {
        this.storeService.isLoading.set(false);
        this.showMessageNotification('Error', JSON.stringify(error?.code));
        return;
      }
    }

    if (!success) return;

    this.storeService.isLoading.set(false);

    // NOTE Redirect to home
    this.router.navigate(['/home']);
}

  // -------------------------------------------------------------------------------
  // NOTE Helpers ------------------------------------------------------------------
  // -------------------------------------------------------------------------------

  private markFormGroupTouched(): void {
    Object.keys(this.formGroup.controls).forEach((key) => {
      this.formGroup.get(key)?.markAsTouched();
    });
  }

  // Getters for template usage
  public get fullname() {
    return this.formGroup.get('fullname');
  }

  public get username() {
    return this.formGroup.get('username');
  }

  public get email() {
    return this.formGroup.get('email');
  }

  public get password() {
    return this.formGroup.get('password');
  }

  public get confirmPassword() {
    return this.formGroup.get('confirmPassword');
  }

  public get isLoading() {
    return this.storeService.isLoading();
  }
}
