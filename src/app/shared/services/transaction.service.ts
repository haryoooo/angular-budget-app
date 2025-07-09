import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';

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
  public wallet = localStorage.getItem("type");
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
  private _stateTransactions = new BehaviorSubject<any>(this.transactions);
  public _stateWallet = new BehaviorSubject<any>(this.wallet);

  // Expose observables to allow components to subscribe to state changes
  stateAdd$ = this._stateAdd.asObservable();
  stateTransactions$ = this._stateTransactions.asObservable();
  stateOptions$ = this._stateOptions.asObservable();
  stateWallet$ = this._stateWallet.asObservable();

  constructor(private firebaseService: FirebaseService) {}

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

  setLatestTransactions(updatedState: AddState): any {
    this.firebaseService.addData(this._stateWallet.value, updatedState);
  }

  updateTransaction(id: string, newData: AddState){
    this.firebaseService.updateData(this._stateWallet.value, id, newData);
  }

  deleteTransaction(id: string){
    this.firebaseService.deleteData(this._stateWallet.value, id);
  }
}
