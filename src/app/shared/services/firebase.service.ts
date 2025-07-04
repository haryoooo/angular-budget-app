// firebase.service.ts
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
} from 'firebase/firestore';
import { AddState } from './transaction.service';
import moment from 'moment';
import formatFirestoreDate from '@helpers/formatFirestoreDate.helper';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';


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
  constructor() {}

  // Client-side user creation
  async createUser (payload: any){
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      const user = userCredential.user;
      
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        provider: 'email',
        disabled: false,
        ...payload
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Fetching data from a Firestore collection
  async getCollectionData(collectionName: string) {
    const colRef = collection(db, collectionName);
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
  }

  async addData(collectionName: string, payload: AddState) {
    try {
      const docRef = await addDoc(collection(db, collectionName), payload);
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  async updateData(collectionName: string, docId: string, payload: AddState) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, payload, { merge: false });
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  async deleteData(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      console.log('Document deleted with ID:', docId);
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  }
}
