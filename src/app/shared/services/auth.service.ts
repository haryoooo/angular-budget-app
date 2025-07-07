// firebase.service.ts
import { Injectable } from '@angular/core';
import {
  getAuth,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { FirebaseService } from './firebase.service';

const auth = getAuth();

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseService: any;
  getUserDocument: any;
  
  constructor(firebaseService: FirebaseService) {}
  
 // Auth state subjects
  public authStateSubject = new BehaviorSubject<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public userProfileSubject = new BehaviorSubject<any>(null);
    
 // Public observables
  public authState$ = this.authStateSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public userProfile$ = this.userProfileSubject.asObservable();

  public getUserProfile(){
    this.userProfileSubject.value;
  }

  public setUserAuthorization(user: any, authorized: 'authenticated' | 'unauthenticated'){
    console.log(user);
    
    this.currentUserSubject.next(user)
    this.authStateSubject.next(authorized);
  }

  public setUserProfile(value: any){
    console.log(value);

    this.userProfileSubject.next(value)
  }
}
