// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { StoreService } from '@services/store.service';
import { map, filter, take } from 'rxjs';

export const authGuards = () => {
  const authService = inject(AuthService);
  const guestStates = inject(StoreService);
  const router = inject(Router);

  return authService.authRestored$.pipe(
    filter(restored => restored === true),
    take(1),
    map(() => {
      const authState = authService.authStateSubject.value;
      const isAuthenticated = authState === 'authenticated';
      const isGuest = guestStates.isGuest();
      
      if (isAuthenticated || isGuest) {
        return true;
      }
      
      router.navigate(['/auth/login']);
      return false;
    })
  );
};
