 import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

// 👇 Custom validator to compare password and confirmPassword
export function passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
}