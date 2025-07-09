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
  imports: [PageLayoutComponent, NgIf, ProgressBarComponent, NgClass, NgFor, FormsModule, CommonModule],
})
export class WalletComponent implements OnInit {
  public wallet!: string;
  public selectedOption!: string;
  public activeTab: string = 'accounts';
  public loading = false;
  public checkingWallets = false;
  public showAddModal = false;
  public creatingWallet = false;
  public newWalletName = '';
  public newWalletDescription = '';
  public userProfile: any;
  public userId: any;
  
  // Track wallet stats and empty status
  public walletStats: { [key: string]: { count: number; balance: number } } = {};
  public emptyWallets: string[] = [];
  public options: Option[] = [];

  constructor(
    public router: Router,
    public stateService: TransactionService,
    public storeService: StoreService,
    public firebaseService: FirebaseService,
    public authService: AuthService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.storeService.isLoading.set(false);
    await this.checkAllWallets();

    this.wallet = this.stateService._stateWallet.value;
    this.selectedOption = this.wallet;

    this.authService.currentUser$.subscribe(state=> {
      this.userId = state?.uid;
    })

    this.authService.userProfile$.subscribe(state=> {
      this.options = state?.wallets
    })
  }

  async checkAllWallets(): Promise<void> {
    this.checkingWallets = true;
    
    try {
      for (const option of this.options) {
        const transactions = await this.stateService.getStateTransactions(option.id);
        
        if (transactions.length === 0) {
          this.emptyWallets.push(option.id);
        } else {
          // Calculate wallet stats
          const balance = transactions.reduce((sum: number, t: any) => {
            return t.type === 'income' ? sum + t.amount : sum - t.amount;
          }, 0);
          
          this.walletStats[option.id] = {
            count: transactions.length,
            balance: balance
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
    const option = this.options.find(opt => opt.id === walletId);
    if (this.isWalletEmpty(walletId)) {
      return 'This wallet is empty - it will be created when selected';
    }
    return option?.description || 'Connect to this wallet to organize your funds';
  }

  getIconSrc(optionId: string): string {
    return this.selectedOption === optionId
      ? '../../../assets/img/project/navigation/wallet-fill.png'
      : '../../../assets/img/project/navigation/wallet.png';
  }

  async submitChangeWallet(): Promise<void> {
    this.loading = true;
    
    try {
      // If wallet is empty, create it first
      if (this.isWalletEmpty(this.selectedOption)) {
        await this.firebaseService.createWallet(this.selectedOption);
        // Remove from empty wallets list
        this.emptyWallets = this.emptyWallets.filter(id => id !== this.selectedOption);
      }
      
      // Set the wallet
      // const findTitle: any = this?.options?.find((el: { id: string; })=> el.id === this.selectedOption);
      this.stateService.setWallet(this.selectedOption);
      
      // Store in localStorage
      localStorage.setItem("type", this.selectedOption);
      
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

  async createNewWallet(): Promise<void> {
    if (!this.newWalletName.trim()) return;
    
    this.creatingWallet = true;
    
    try {
      // Generate wallet ID from name
      const walletId = this.generateWalletId(this.newWalletName);
      
      // Check if wallet already exists
      const exists = this.options.some(opt => opt.id === walletId);
      if (exists) {
        alert('A wallet with this name already exists');
        return;
      }
      
      // Create new wallet option
      const newOption: Option = {
        id: walletId,
        title: this.newWalletName,
        description: this.newWalletDescription || `Connect into ${this.newWalletName} to organize your funds`
      };
      
      // Add to options
      this.options.push(newOption);

      console.log(newOption);
      
      // // Create in Firebase
      await this.firebaseService.createWallet(walletId);
      await this.firebaseService.updateUserProfile('users', this.userId, newOption); // Adds to `wallets` array
      
      // Select the new wallet
      this.selectedOption = walletId;
      
      // Hide modal
      this.hideAddWalletModal();
      
    } catch (error) {
      console.error('Error creating new wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      this.creatingWallet = false;
    }
  }

  async deleteWallet(walletId: string, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this wallet?')) {
      try {
        // Remove from options
        this.options = this.options.filter(opt => opt.id !== walletId);
        
        // Remove from empty wallets
        this.emptyWallets = this.emptyWallets.filter(id => id !== walletId);
        
        // If this was the selected wallet, select first available
        if (this.selectedOption === walletId) {
          this.selectedOption = this.options[0]?.id || '';
        }
        
        // Delete from Firebase (if it exists)
        await this.firebaseService.deleteWallet(walletId);
        
      } catch (error) {
        console.error('Error deleting wallet:', error);
      }
    }
  }

  private generateWalletId(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  navigateTo(url: string): void {
    this.router.navigateByUrl(url, { replaceUrl: true });
  }
}
