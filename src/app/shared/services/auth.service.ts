// firebase.service.ts
import { Injectable } from '@angular/core';
import { User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseService: any;
  getUserDocument: any;

  constructor(firebaseService: FirebaseService) {}

  // Auth state subjects
  public authStateSubject = new BehaviorSubject<
    'loading' | 'authenticated' | 'unauthenticated'
  >('loading');
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public userProfileSubject = new BehaviorSubject<any>(null);
  public authRestoredSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public authState$ = this.authStateSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public userProfile$ = this.userProfileSubject.asObservable();
  public authRestored$ = this.authRestoredSubject.asObservable();

  public getUserProfile() {
    return this.userProfileSubject.value;
  }

  public setUserAuthorization(
    user: any,
    authorized: 'authenticated' | 'unauthenticated'
  ) {
    this.currentUserSubject.next(user);
    this.authStateSubject.next(authorized);
  }

  public setUserProfile(value: any) {
    this.userProfileSubject.next(value);
  }
}
