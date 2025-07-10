import { Injectable } from '@angular/core';
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
  desc: string;
  amount: number;
  date: any;
  type: string;
  identifier?: string;
}

export const initialState: AddState = {
  desc: '',
  amount: 0,
  date: new Date(),
  type: 'expense',
  identifier: "",
};

@Injectable({
  providedIn: 'root', // This makes the service available application-wide
})
export class TransactionService {
  private isGuest = this.storeService.isGuest();
  public wallet = this.isGuest ? 'budget-1' : localStorage.getItem("type") ;
  public transactions = [];
  private initialState: AddState = {
    type: 'expense', // default value
    date: new Date(), // default value, current date
    desc: '',
    amount: 0,
    identifier: "",
  };

  // Initial states with appropriate data types
  private _stateOptions = new BehaviorSubject<OptionsDropdown>(initialStateDropdown);
  private _stateAdd = new BehaviorSubject<AddState>(initialState);
  public _stateTransactions = new BehaviorSubject<any>(this.transactions);
  public _stateWallet = new BehaviorSubject<any>(this.wallet);

  // Expose observables to allow components to subscribe to state changes
  stateAdd$ = this._stateAdd.asObservable();
  stateTransactions$ = this._stateTransactions.asObservable();
  stateOptions$ = this._stateOptions.asObservable();
  stateWallet$ = this._stateWallet.asObservable();

  constructor(private firebaseService: FirebaseService, private storeService: StoreService) {}

  setStateAdd(updatedValues: Partial<AddState>): void {
    const currentState = this._stateAdd.value;
    const newState = { ...currentState, ...updatedValues };
    this._stateAdd.next(newState);
  }

  setStateDropdown(updatedValues: OptionsDropdown): void {
    this._stateOptions.next(updatedValues);
  }
  
  setWallet(values: string): void {
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

  async getStateTransactions(optionValues: string) {
    try {
      const transaction = await this.firebaseService.getCollectionData(optionValues);
      
      // If wallet is empty, create it
      if (transaction.length === 0) {
        const walletExists = await this.firebaseService.checkWalletExists(optionValues);
        
        if (!walletExists) {
          console.log(`Creating new wallet: ${optionValues}`);
          await this.firebaseService.createWallet(optionValues);
          // Return empty array for new wallet
          return [];
        }
      }
      
      return transaction;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async setLatestTransactions(newData: AddState): Promise<void> {
    try {
      await this.firebaseService.addData(this._stateWallet.value, newData);
      const updatedList = await this.firebaseService.getCollectionData(this._stateWallet.value);
      this._stateTransactions.next(updatedList);
    } catch (err) {
      console.error('Failed to add transaction', err);
    }
  }

  async updateTransaction(id: string, newData: AddState): Promise<void> {
    try {
      await this.firebaseService.updateData(this._stateWallet.value, id, newData);
      const updatedList = await this.firebaseService.getCollectionData(this._stateWallet.value);
      this._stateTransactions.next(updatedList);
    } catch (err) {
      console.error('Failed to update transaction', err);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await this.firebaseService.deleteData(this._stateWallet.value, id);
      const updatedList = await this.firebaseService.getCollectionData(this._stateWallet.value);
      this._stateTransactions.next(updatedList);
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  }
}
