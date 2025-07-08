// guards/guest.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { map, filter, take } from 'rxjs';

export const guestGuards = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authRestored$.pipe(
    filter(restored => restored === true),
    take(1),
    map(() => {
      const authState = authService.authStateSubject.value;
      const isAuthenticated = authState === 'authenticated';
      
      if (!isAuthenticated) {
        return true; // Allow access to auth pages
      }
      
      router.navigate(['/home']);
      return false; // Redirect authenticated users away from auth pages
    })
  );
};