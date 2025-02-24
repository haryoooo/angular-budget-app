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
} from 'firebase/firestore';
import { AddState } from './transaction.service';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: environment.apiKey,
  authDomain: environment.authDomain,
  projectId: environment.projectId,
  storageBucket: environment.storageBucket,
  messagingSenderId: environment.messagingId,
  appId: environment.appId,
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor() {}

  // Fetching data from a Firestore collection
  async getCollectionData(collectionName: string) {
    const colRef = collection(db, collectionName);
    const snapshots = await getDocs(colRef);
    const dataList = snapshots.docs.map((doc) => ({
      identifier: doc.id, // Extract document ID
      ...doc.data(), // Spread document fields
    }));

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
