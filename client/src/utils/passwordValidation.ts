/**
 * Password validation utility
 * Password must include:
 * - At least 6 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  hints: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const hints: string[] = [];

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      hints: [],
    };
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
    hints.push('Add an uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
    hints.push('Add a lowercase letter (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number');
    hints.push('Add a number (0-9)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    hints,
  };
}

export function getPasswordHint(password: string): string {
  if (!password) {
    return 'Password must include uppercase, lowercase, and numbers';
  }

  const validation = validatePassword(password);
  
  if (validation.isValid) {
    return 'Password is strong';
  }

  return validation.hints.join(', ') || 'Password must include uppercase, lowercase, and numbers';
}

