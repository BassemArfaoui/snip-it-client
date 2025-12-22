import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator: Check if two password fields match
 */
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirm = control.get('confirm');

    if (!password || !confirm) return null;
    return password.value === confirm.value ? null : { passwordMismatch: true };
  };
}
