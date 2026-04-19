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
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
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

  async replaceUserWallets(
    collectionName: string,
    docId: string,
    wallets: Option[]
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        wallets: wallets,
      });
    } catch (e) {
      console.error('Error replacing user wallets: ', e);
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
        [arrayField]: arrayUnion(payload),
      });
    } catch (e) {
      console.error('Error updating document: ', e);
    }
  }

  // USER-SPECIFIC COLLECTION METHODS

  // Get user-specific collection reference (top-level under user, e.g. legacy "transactions")
  private getUserCollection(collectionName: string) {
    const userId = this.getCurrentUserId();
    return collection(db, 'users', userId, collectionName);
  }

  /** Wallet document: users/{uid}/wallets/{walletId} */
  private walletDocRef(walletId: string): DocumentReference {
    const userId = this.getCurrentUserId();
    return doc(db, 'users', userId, 'wallets', walletId);
  }

  /** Transactions for a wallet: users/{uid}/wallets/{walletId}/transactions */
  private walletTransactionsCollection(walletId: string): CollectionReference {
    const userId = this.getCurrentUserId();
    return collection(db, 'users', userId, 'wallets', walletId, 'transactions');
  }

  /** Legacy path before nesting: users/{uid}/{walletId}/... */
  private legacyWalletTransactionsCollection(walletId: string): CollectionReference {
    const userId = this.getCurrentUserId();
    return collection(db, 'users', userId, walletId);
  }

  private mapTransactionDocs(snapshots: QuerySnapshot): any[] {
    return snapshots.docs.map((d) => {
      const data: any = d.data();
      return {
        identifier: d.id,
        ...data,
        date: formatFirestoreDate(data.date),
      };
    });
  }

  /**
   * Reads transactions for a wallet: prefers users/{uid}/wallets/{walletId}/transactions,
   * falls back to legacy flat users/{uid}/{walletId}/ for existing data.
   */
  async getUserCollectionData(walletId: string) {
    try {
      const nestedRef = this.walletTransactionsCollection(walletId);
      const nestedSnap = await getDocs(nestedRef);
      const nested = this.mapTransactionDocs(nestedSnap);
      if (nested.length > 0) {
        return nested;
      }

      const legacyRef = this.legacyWalletTransactionsCollection(walletId);
      const legacySnap = await getDocs(legacyRef);
      return this.mapTransactionDocs(legacySnap);
    } catch (error) {
      console.error('Error fetching user collection data:', error);
      throw error;
    }
  }

  private async deleteAllDocumentsInCollection(
    colRef: CollectionReference
  ): Promise<void> {
    const snapshot = await getDocs(colRef);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  }

  // Add transaction under users/{uid}/wallets/{walletId}/transactions
  async addUserData(walletId: string, payload: AddState) {
    try {
      const colRef = this.walletTransactionsCollection(walletId);
      const docRef = await addDoc(colRef, {
        ...payload,
        userId: this.getCurrentUserId(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      throw e;
    }
  }

  async updateUserData(walletId: string, docId: string, payload: AddState) {
    try {
      const userId = this.getCurrentUserId();
      const nestedRef = doc(
        db,
        'users',
        userId,
        'wallets',
        walletId,
        'transactions',
        docId
      );
      const legacyRef = doc(db, 'users', userId, walletId, docId);
      const [nestedSnap, legacySnap] = await Promise.all([
        getDoc(nestedRef),
        getDoc(legacyRef),
      ]);

      const updatePayload = {
        ...payload,
        updatedAt: serverTimestamp(),
      };

      if (nestedSnap.exists()) {
        await setDoc(nestedRef, updatePayload, { merge: true });
      } else if (legacySnap.exists()) {
        await setDoc(legacyRef, updatePayload, { merge: true });
      } else {
        await setDoc(nestedRef, updatePayload, { merge: true });
      }
    } catch (e) {
      console.error('Error updating document: ', e);
      throw e;
    }
  }

  async deleteUserData(walletId: string, docId: string) {
    try {
      const userId = this.getCurrentUserId();
      const nestedRef = doc(
        db,
        'users',
        userId,
        'wallets',
        walletId,
        'transactions',
        docId
      );
      const legacyRef = doc(db, 'users', userId, walletId, docId);
      const [nestedSnap, legacySnap] = await Promise.all([
        getDoc(nestedRef),
        getDoc(legacyRef),
      ]);
      if (nestedSnap.exists()) {
        await deleteDoc(nestedRef);
      }
      if (legacySnap.exists()) {
        await deleteDoc(legacyRef);
      }
    } catch (e) {
      console.error('Error deleting document:', e);
      throw e;
    }
  }

  // Query user transactions by month
  async getUserTransactionsByMonth(
    month: number,
    year: number = new Date().getFullYear()
  ) {
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
  async getUserTransactionsByType(
    type: 'income' | 'expense',
    limitCount?: number
  ) {
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

  /**
   * Creates wallet metadata at users/{uid}/wallets/{walletId} using a deterministic id
   * (same slug as in the user profile). Avoids random addDoc IDs that broke deletes.
   */
  async createUserWallet(walletId: string, displayName?: string): Promise<void> {
    try {
      await setDoc(this.walletDocRef(walletId), {
        slug: walletId,
        name: displayName ?? walletId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        balance: 0,
        currency: 'IDR',
        userId: this.getCurrentUserId(),
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async checkUserWalletExists(walletId: string): Promise<boolean> {
    try {
      const primary = await getDoc(this.walletDocRef(walletId));
      if (primary.exists()) {
        return true;
      }
      const colRef = collection(db, 'users', this.getCurrentUserId(), 'wallets');
      const snapshot = await getDocs(
        query(colRef, where('name', '==', walletId))
      );
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking wallet existence:', error);
      return false;
    }
  }

  /** Deletes wallet metadata and all transactions (nested + legacy flat collection). */
  async deleteUserWallet(walletId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();

      await this.deleteAllDocumentsInCollection(
        this.walletTransactionsCollection(walletId)
      );
      await this.deleteAllDocumentsInCollection(
        this.legacyWalletTransactionsCollection(walletId)
      );

      await deleteDoc(this.walletDocRef(walletId)).catch(() => undefined);

      const walletsCol = collection(db, 'users', userId, 'wallets');
      const orphanSnap = await getDocs(
        query(walletsCol, where('name', '==', walletId))
      );
      await Promise.all(
        orphanSnap.docs.map((d) => deleteDoc(d.ref))
      );
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
        deleteDoc(
          doc(db, 'users', this.getCurrentUserId(), collectionName, docSnap.id)
        )
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
    console.warn(
      'getCollectionData is deprecated. Use getUserCollectionData instead.'
    );
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
