// Angular modules
import { NgClass, NgIf, NgFor, CommonModule } from '@angular/common';
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
import { FirebaseService } from '@services/firebase.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { MessageService } from 'primeng/api';
import generateIdFormat from '@helpers/generateIdFormat.helper';

// Define interfaces
interface Option {
  id: string;
  title: string;
  description: string;
}

interface Transaction {
  type: string;
  amount: number;
  id?: string | number;
  date: Date;
  description?: string;
  category?: string;
}

interface WalletStats {
  count: number;
  balance: number;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  wallets: Option[];
}

interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
  standalone: true,
  imports: [
    PageLayoutComponent,
    NgIf,
    ProgressBarComponent,
    NgClass,
    NgFor,
    FormsModule,
    CommonModule,
  ],
  providers: [MessageService],
})
export class WalletComponent implements OnInit {
  public isGuest = this.storeService.isGuest();

  get isAmountVisible(): boolean {
    return this.storeService.isAmountVisible();
  }

  getMaskedAmount(): string {
    return '••••••••';
  }

  public wallet!: string;
  public selectedOption!: string;
  public activeTab: string = 'accounts';
  public loading = false;
  public checkingWallets = false;
  public initialLoading = true;
  public showAddModal = false;
  public creatingWallet = false;
  public newWalletName = '';
  public newWalletDescription = '';
  public userProfile: UserProfile | null = null;
  public userId: string | null = null;
  public isSubmitted = false;
  public showDeleteModal = false;
  public walletToDelete: string | null = null;

  // Edit wallet properties
  public showEditModal = false;
  public editingWallet = false;
  public editWalletId = '';
  public editWalletName = '';
  public editWalletDescription = '';
  public walletToEdit: Option | null = null;

  // Track wallet stats and empty status
  public walletStats: Record<string, WalletStats> = {};
  public emptyWallets: string[] = [];
  public options: Option[] = this.isGuest
    ? [
        {
          id: 'budget-1',
          title: 'Budget 1',
          description: 'this is example wallet',
        },
      ]
    : [];

  constructor(
    public router: Router,
    public stateService: TransactionService,
    public storeService: StoreService,
    public firebaseService: FirebaseService,
    public authService: AuthService,
    public messageService: MessageService
  ) {}

  public async ngOnInit(): Promise<void> {
    this.storeService.isLoading.set(false);

    this.wallet = this.isGuest
      ? 'Budget 1'
      : this.stateService._stateWallet.value;
    this.selectedOption = this.wallet;
    console.log(this.wallet, "wallet : ");

    // For guests, data is already available
    if (this.isGuest) {
      this.initialLoading = false;
    }

    this.authService.currentUser$.subscribe((state: AuthUser | null | any) => {
      this.userId = state?.uid || null;
    });

    // Wait for user profile to load, then check wallets
    this.authService.userProfile$.subscribe(
      async (state: UserProfile | null) => {
        if (state?.wallets) {
          this.userProfile = state;
          this.options = state.wallets;
          this.initialLoading = false;
          // Only check wallets after options are loaded
          await this.checkAllWallets();
        }
      }
    );
  }

  showMessageNotification(sign: string, message: string): void {
    this.messageService.add({
      severity: sign.toLowerCase(),
      summary: sign,
      detail: message,
    });
  }

  async checkAllWallets(): Promise<void> {
    this.checkingWallets = true;

    try {
      for (const option of this.options) {
        const transactions: Transaction[] =
          await this.stateService.getStateTransactions(option.id, this.isGuest);

        if (transactions?.length === 0) {
          this.emptyWallets.push(option.id);
        } else {
          // Calculate wallet stats
          const balance = transactions.reduce(
            (sum: number, transaction: Transaction) => {
              return transaction.type === 'income'
                ? sum + transaction.amount
                : sum - transaction.amount;
            },
            0
          );

          this.walletStats[option.id] = {
            count: transactions.length,
            balance: balance,
          };
        }
      }
    } catch (error) {
      console.error('Error checking wallets:', error);
    } finally {
      this.checkingWallets = false;
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  selectOption(optionId: string): void {
    this.selectedOption = optionId;
  }

  isWalletEmpty(walletId: string): boolean {
    return this.emptyWallets.includes(walletId);
  }

  getWalletDescription(walletId: string): string {
    const option = this.options.find((opt: Option) => opt.id === walletId);
    if (this.isWalletEmpty(walletId)) {
      return 'This wallet is empty - it will be created when selected';
    }
    return (
      option?.description || 'Connect to this wallet to organize your funds'
    );
  }

  getIconSrc(optionId: string): string {
    return this.selectedOption === optionId
      ? '../../../assets/img/project/navigation/wallet-fill.png'
      : '../../../assets/img/project/navigation/wallet.png';
  }

  async submitChangeWallet(): Promise<void> {
    const id = generateIdFormat(this.selectedOption);
    this.loading = true;

    try {
      // If wallet is empty, create it first
      if (this.isWalletEmpty(this.selectedOption)) {
        await this.firebaseService.createUserWallet(id);
        // Remove from empty wallets list
        this.emptyWallets = this.emptyWallets.filter(
          (id: string) => id !== this.selectedOption
        );
      }

      const setWalletId: any = this.options?.find(el=> generateIdFormat(el?.title) === id)?.title;
      
      // Set the wallet
      this.stateService.setWallet(setWalletId);

      // Store in localStorage
      localStorage.setItem('type', setWalletId);

      setTimeout(() => {
        this.router.navigate(['home']);
        this.loading = false;
      }, 1000);
    } catch (error) {
      console.error('Error changing wallet:', error);
      this.loading = false;
    }
  }

  showAddWalletModal(): void {
    this.showAddModal = true;
    this.newWalletName = '';
    this.newWalletDescription = '';
  }

  hideAddWalletModal(): void {
    this.showAddModal = false;
    this.newWalletName = '';
    this.newWalletDescription = '';
  }

  showDeleteWalletModal(walletId: string, event: Event): void {
    event.stopPropagation();
    this.walletToDelete = walletId;
    this.showDeleteModal = true;
  }

  closeModal(): void {
    this.showDeleteModal = false;
    this.walletToDelete = null;
  }

  confirmDelete(): void {
    if (!this.walletToDelete) return;
    this.isSubmitted = true;

    setTimeout(() => {
      this.deleteWallet(this.walletToDelete!, new Event('manual'));
      this.showDeleteModal = false;
      this.isSubmitted = false;
      this.walletToDelete = null;
    }, 1000);
  }

  // Edit wallet methods
  showEditWalletModal(walletId: string, event: Event): void {
    event.stopPropagation();
    
    // Find the wallet to edit
    this.walletToEdit = this.options.find(opt => opt.id === walletId) || null;
    
    if (this.walletToEdit) {
      this.editWalletId = walletId;
      this.editWalletName = this.walletToEdit.title;
      this.editWalletDescription = this.walletToEdit.description || '';
      this.showEditModal = true;
    }
  }

  hideEditWalletModal(): void {
    this.showEditModal = false;
    this.editWalletId = '';
    this.editWalletName = '';
    this.editWalletDescription = '';
    this.walletToEdit = null;
  }

  async updateWallet(): Promise<void> {
    if (!this.editWalletName.trim() || !this.editWalletId) return;

    this.editingWallet = true;
    
    try {
      // Update the wallet in the options array
      const walletIndex = this.options.findIndex(opt => opt.id === this.editWalletId);
      const currentWalletSameAsEdited = this.editWalletId === localStorage.getItem("type")
      if (walletIndex !== -1) {
        this.options[walletIndex] = {
          ...this.options[walletIndex],
          id: generateIdFormat(this.editWalletName),
          title: this.editWalletName,
          description: this.editWalletDescription || `Connect into ${this.editWalletName} to organize your funds`
        };

        if(currentWalletSameAsEdited){
          localStorage.removeItem("type")
        }

        // Update in Firebase
        if (this.userId) {
          await this.firebaseService.replaceUserWallets(
            'users',
            this.userId,
            this.options
          );
        }

        // ✅ Manually update userProfile$ so the component reacts
        const previousProfile = this.authService.userProfileSubject.value;
        
        this.authService.userProfileSubject.next({
          ...previousProfile,
          wallets: [...this.options]
        } as UserProfile);

        // Hide modal
        this.hideEditWalletModal();

        // Show success message
        this.showMessageNotification('Success', 'Wallet updated successfully');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      this.showMessageNotification('Error', 'Failed to update wallet. Please try again.');
    } finally {
      this.editingWallet = false;
    }
  }

  async createNewWallet(): Promise<void> {
    if (!this.newWalletName.trim()) return;

    this.creatingWallet = true;

    try {
      // Generate wallet ID from name
      const walletId = generateIdFormat(this.newWalletName);

      // Check if wallet already exists
      const exists = this.options.some((opt: Option) => opt.id === walletId);
      if (exists) {
        alert('A wallet with this name already exists');
        return;
      }

      // Create new wallet option
      const newOption: Option = {
        id: walletId,
        title: this.newWalletName,
        description:
          this.newWalletDescription ||
          `Connect into ${this.newWalletName} to organize your funds`,
      };

      // Create in Firebase
      await this.firebaseService.createUserWallet(walletId);

      if (this.userId) {
        await this.firebaseService.updateUserProfile(
          'users',
          this.userId,
          newOption
        ); // Adds to `wallets` array
      }

      // ✅ Manually update userProfile$ so the component reacts
      const previousProfile = this.authService.userProfileSubject.value;
      const updatedWallets = [...(previousProfile?.wallets || []), newOption];

      this.authService.userProfileSubject.next({
        ...previousProfile,
        wallets: updatedWallets,
      } as UserProfile);

      // Select the new wallet
      this.selectedOption = walletId;

      // Hide modal
      this.hideAddWalletModal();

      // Refresh wallet stats
      await this.checkAllWallets();
    } catch (error) {
      console.error('Error creating new wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      this.creatingWallet = false;
    }
  }

  async deleteWallet(walletId: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    try {
      // Remove from options
      this.options = this.options.filter((opt: Option) => opt.id !== walletId);

      // Remove from empty wallets
      this.emptyWallets = this.emptyWallets.filter(
        (id: string) => id !== walletId
      );

      // If this was the selected wallet, select first available
      if (this.selectedOption === walletId) {
        this.selectedOption = this.options[0]?.id || '';
      }

      // Replace wallet from users
      await this.firebaseService.replaceUserWallets(
        'users',
        this.userId!,
        this.options
      );

      // ✅ Manually update userProfileSubject to reflect the deletion
      const previousProfile = this.authService.userProfileSubject.value;
      const updatedWallets = [...this.options];

      this.authService.userProfileSubject.next({
        ...previousProfile,
        wallets: updatedWallets,
      } as UserProfile);

      this.stateService._stateWallet.next('');
      localStorage.removeItem('type');

      // Delete from Firebase
      await this.firebaseService.deleteUserWallet(walletId);

      this.showMessageNotification('Success', 'Success delete wallet');
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  }

  navigateTo(url: string): void {
    this.router.navigateByUrl(url, { replaceUrl: true });
  }
}
