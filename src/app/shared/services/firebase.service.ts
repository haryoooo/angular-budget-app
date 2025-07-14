// firebase.service.ts - Updated for user-specific collections
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { AddState } from './transaction.service';
import formatFirestoreDate from '@helpers/formatFirestoreDate.helper';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import moment from 'moment';

interface Option {
  id: string;
  title: string;
  description: string;
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: environment.apiKey,
  authDomain: environment.authDomain,
  projectId: environment.projectId,
  storageBucket: environment.storageBucket,
  messagingSenderId: environment.messagingSenderId,
  appId: environment.appId,
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private currentUser: User | null = null;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });
  }

  // Get current user ID
  private getCurrentUserId(): string {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    return this.currentUser.uid;
  }

  // Client-side user creation
  async createUser(payload: any) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password
      );
      const user = userCredential.user;

      delete payload.confirmPassword;
      delete payload.password;

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        provider: 'email',
        disabled: false,
        ...payload,
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Client-side user login
  async loginUser(email: string, password: string) {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      return {
        success: true,
        user,
      };
    } catch (error) {
      throw error;
    }
  }

  async logoutUser() {
    try {
      await signOut(auth); // Firebase handles token/session cleanup
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async loadUserProfile(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const dataUser: any = userDoc.data();
        return dataUser;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async updateUserProfile(
    collectionName: string,
    docId: string,
    payload: AddState | Option,
    arrayField = 'wallets' // default to 'wallets' array
  ) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [arrayField]: arrayUnion(payload)
      });
    } catch (e) {
      console.error('Error updating document: ', e);
    }
  }

  // USER-SPECIFIC COLLECTION METHODS

  // Get user-specific collection reference
  private getUserCollection(collectionName: string) {
    const userId = this.getCurrentUserId();
    return collection(db, 'users', userId, collectionName);
  }

  // Fetching data from a user-specific Firestore collection
  async getUserCollectionData(collectionName: string) {
    try {
      const colRef = this.getUserCollection(collectionName);
      const snapshots = await getDocs(colRef);
      const dataList = snapshots.docs.map((doc) => {
        const data: any = doc.data();

        return {
          identifier: doc.id, // Extract document ID
          ...data, // Spread other document fields
          date: formatFirestoreDate(data.date), // Format Firestore timestamp
        };
      });

      return dataList;
    } catch (error) {
      console.error('Error fetching user collection data:', error);
      throw error;
    }
  }

  // Add data to user-specific collection
  async addUserData(collectionName: string, payload: AddState) {
    try {
      const colRef = this.getUserCollection(collectionName);
      const docRef = await addDoc(colRef, {
        ...payload,
        userId: this.getCurrentUserId(), // Add userId for extra security
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Document written with ID: ', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      throw e;
    }
  }

  // Update data in user-specific collection
  async updateUserData(collectionName: string, docId: string, payload: AddState) {
    try {
      const userId = this.getCurrentUserId();
      const docRef = doc(db, 'users', userId, collectionName, docId);
      await setDoc(docRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log('Document updated with ID: ', docId);
    } catch (e) {
      console.error('Error updating document: ', e);
      throw e;
    }
  }

  // Delete data from user-specific collection
  async deleteUserData(collectionName: string, docId: string) {
    try {
      const userId = this.getCurrentUserId();
      const docRef = doc(db, 'users', userId, collectionName, docId);
      await deleteDoc(docRef);
      console.log('Document deleted with ID:', docId);
    } catch (e) {
      console.error('Error deleting document:', e);
      throw e;
    }
  }

  // Query user transactions by month
  async getUserTransactionsByMonth(month: number, year: number = new Date().getFullYear()) {
    try {
      const colRef = this.getUserCollection('transactions');
      const q = query(
        colRef,
        where('month', '==', month),
        where('year', '==', year),
        orderBy('createdAt', 'desc')
      );
      
      const snapshots = await getDocs(q);
      const dataList = snapshots.docs.map((doc) => {
        const data: any = doc.data();
        return {
          identifier: doc.id,
          ...data,
          date: formatFirestoreDate(data.date),
        };
      });

      return dataList;
    } catch (error) {
      console.error('Error fetching user transactions by month:', error);
      throw error;
    }
  }

  // Query user transactions by type
  async getUserTransactionsByType(type: 'income' | 'expense', limitCount?: number) {
    try {
      const colRef = this.getUserCollection('transactions');
      let q = query(
        colRef,
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshots = await getDocs(q);
      const dataList = snapshots.docs.map((doc) => {
        const data: any = doc.data();
        return {
          identifier: doc.id,
          ...data,
          date: formatFirestoreDate(data.date),
        };
      });

      return dataList;
    } catch (error) {
      console.error('Error fetching user transactions by type:', error);
      throw error;
    }
  }

  // Create user-specific wallet
  async createUserWallet(walletName: string): Promise<void> {
    try {
      const colRef = this.getUserCollection('wallets');
      const initialDoc = {
        name: walletName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        balance: 0,
        currency: 'IDR', // Default currency
        userId: this.getCurrentUserId(),
      };

      await addDoc(colRef, initialDoc);
      console.log(`Wallet ${walletName} created successfully`);
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  // Check if user wallet exists
  async checkUserWalletExists(walletName: string): Promise<boolean> {
    try {
      const colRef = this.getUserCollection('wallets');
      console.log(colRef);
      
      const q = query(colRef, where('name', '==', walletName));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking wallet existence:', error);
      return false;
    }
  }

  // Delete user wallet
  async deleteUserWallet(walletId: string): Promise<void> {
    try {
      await this.deleteUserData('wallets', walletId);
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  // Empty user collection
  async emptyUserCollection(collectionName: string): Promise<void> {
    try {
      const colRef = this.getUserCollection(collectionName);
      const snapshot = await getDocs(colRef);

      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, 'users', this.getCurrentUserId(), collectionName, docSnap.id))
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error emptying user collection:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const userId = this.getCurrentUserId();
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Get current month transactions
      const monthlyQuery = query(
        transactionsRef,
        where('month', '==', currentMonth),
        where('year', '==', currentYear)
      );
      
      const monthlySnapshot = await getDocs(monthlyQuery);
      
      let totalIncome = 0;
      let totalExpense = 0;
      let transactionCount = 0;
      
      monthlySnapshot?.docs?.forEach((doc) => {
        const data = doc.data();
        transactionCount++;
        
        if (data['type'] === 'income') {
          totalIncome += data['amount'] || 0;
        } else if (data['type'] === 'expense') {
          totalExpense += data['amount'] || 0;
        }
      });
      
      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount,
        month: currentMonth,
        year: currentYear,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // LEGACY METHODS (for backward compatibility)
  // Keep these for any existing code that might still use them
  async getCollectionData(collectionName: string) {
    console.warn('getCollectionData is deprecated. Use getUserCollectionData instead.');
    return this.getUserCollectionData(collectionName);
  }

  async addData(collectionName: string, payload: AddState) {
    console.warn('addData is deprecated. Use addUserData instead.');
    return this.addUserData(collectionName, payload);
  }

  async updateData(collectionName: string, docId: string, payload: AddState) {
    console.warn('updateData is deprecated. Use updateUserData instead.');
    return this.updateUserData(collectionName, docId, payload);
  }

  async deleteData(collectionName: string, docId: string) {
    console.warn('deleteData is deprecated. Use deleteUserData instead.');
    return this.deleteUserData(collectionName, docId);
  }
}