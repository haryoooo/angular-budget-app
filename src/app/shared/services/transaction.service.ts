import { effect, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { StoreService } from './store.service';

export interface OptionsDropdown {
  name: string;
  code: string;
}

export const initialStateDropdown = {
  name: 'Expense',
  code: 'exp',
};

export interface AddState {
  formattedDate?: string;
  month: number;
  desc: string;
  amount: number;
  date: any;
  type: string;
  identifier?: string;
  createdAt?: string;
}

export const initialState: AddState = {
  desc: '',
  amount: 0,
  date: new Date(),
  month: 0, 
  type: 'expense',
  identifier: "",
};

@Injectable({
  providedIn: 'root', // This makes the service available application-wide
})
export class TransactionService {
  public wallet: string = '';
  public transactions = [];
  private initialState: AddState = {
    type: 'expense', // default value
    date: new Date(), // default value, current date
    desc: '',
    amount: 0,
    month: 0,
    identifier: "",
  };

  // Initial states with appropriate data types
  private _stateOptions = new BehaviorSubject<OptionsDropdown>(initialStateDropdown);
  private _stateAdd = new BehaviorSubject<AddState>(initialState);
  public _stateTransactions = new BehaviorSubject<any>(this.transactions);
  public _stateWallet = new BehaviorSubject<any>(this.wallet);
  private guestTransactions: AddState[] = [];


  // Expose observables to allow components to subscribe to state changes
  stateAdd$ = this._stateAdd.asObservable();
  stateTransactions$ = this._stateTransactions.asObservable();
  stateOptions$ = this._stateOptions.asObservable();
  stateWallet$ = this._stateWallet.asObservable();

  constructor(private firebaseService: FirebaseService, private storeService: StoreService) {
    // Initialize wallet based on current guest state
    this.initializeWallet();
    
    // React to guest state changes using effect
    effect(() => {
      const isGuest = this.storeService.isGuest();
      const newWallet = isGuest ? 'budget-1' : localStorage.getItem("type");
      
      if (newWallet && newWallet !== this.wallet) {
        this.wallet = newWallet;
        this.setWallet(newWallet);
      }
    });
  }

  private initializeWallet(): void {
    const isGuest = this.storeService.isGuest();
    this.wallet = isGuest ? 'budget-1' : localStorage.getItem("type") || '';
    if (this.wallet) {
      this.setWallet(this.wallet);
    }
  }

  setStateAdd(updatedValues: Partial<AddState>): void {
    const currentState = this._stateAdd.value;
    const newState = { ...currentState, ...updatedValues };
    this._stateAdd.next(newState);
  }

  setStateDropdown(updatedValues: OptionsDropdown): void {
    this._stateOptions.next(updatedValues);
  }
  
  setWallet(values: string): void {
    this.wallet = values;
    this._stateWallet.next(values);
  }

  resetStateAdd(): void {
    this._stateAdd.next(this.initialState);
  }

  getStateDropdown(): OptionsDropdown {
    return this._stateOptions.value;
  }

  getStateAdd(): AddState {
    return this._stateAdd.value;
  }

  async getStateTransactions(optionValues: string, isGuest: boolean): Promise<AddState[]> {
    if (isGuest) {
      this._stateTransactions.next([...this.guestTransactions]);
      return [...this.guestTransactions];
    }

    try {
      const transaction = await this.firebaseService.getCollectionData(optionValues);

      if (transaction.length === 0) {
        const walletExists = await this.firebaseService.checkUserWalletExists(optionValues);
        if (!walletExists) {
          await this.firebaseService.createUserWallet(optionValues);
          return [];
        }
      }

      this._stateTransactions.next(transaction);
      return transaction;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }


  async setLatestTransactions(newData: AddState, isGuest: boolean): Promise<void> {
    if (isGuest) {
      const id = Date.now().toString();
      const guestTransaction = {
        ...newData,
        identifier: id,
        createdAt: new Date().toISOString(), // ✅ Ensure consistent sorting
      };
      this.guestTransactions.push(guestTransaction);
      this._stateTransactions.next([...this.guestTransactions]);
      return;
    }

    try {
      await this.firebaseService.addData(this._stateWallet.value, newData);
      const updatedList = await this.firebaseService.getCollectionData(this._stateWallet.value);
      this._stateTransactions.next(updatedList);
    } catch (err) {
      console.error('Failed to add transaction', err);
    }
  }

  async updateTransaction(id: string, newData: AddState, isGuest: boolean): Promise<void> {
    if (isGuest) {
      const index = this.guestTransactions.findIndex(tx => tx.identifier === id);
      if (index !== -1) {
        this.guestTransactions[index] = {
          ...newData,
          identifier: id,
          createdAt: new Date().toISOString(), // ✅ force update sort value
        };
        this._stateTransactions.next([...this.guestTransactions]); // trigger reactive update
      }
      return;
    }

    try {
      await this.firebaseService.updateData(this._stateWallet.value, id, newData);
      const updatedList = await this.firebaseService.getCollectionData(this._stateWallet.value);
      this._stateTransactions.next(updatedList);
    } catch (err) {
      console.error('Failed to update transaction', err);
    }
  }

  async deleteTransaction(id: string, isGuest: boolean): Promise<void> {
    if (isGuest) {
      this.guestTransactions = this.guestTransactions.filter(tx => tx.identifier !== id);
      this._stateTransactions.next([...this.guestTransactions]);
      return;
    }

    try {
      await this.firebaseService.deleteData(this._stateWallet.value, id);
      const updatedList = await this.firebaseService.getCollectionData(this._stateWallet.value);
      this._stateTransactions.next(updatedList);
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  }
}
