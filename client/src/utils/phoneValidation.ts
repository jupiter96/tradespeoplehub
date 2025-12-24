/**
 * Remove country code from phone number
 * Removes +44, 44, 0044, +1, 1, etc. from the beginning of phone number
 */
export const removeCountryCode = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  let cleaned = phone.trim();

  // Remove common country code patterns
  // UK: +44, 44, 0044
  cleaned = cleaned.replace(/^(\+44|44|0044)\s*/i, '');
  
  // US/Canada: +1, 1, 001
  cleaned = cleaned.replace(/^(\+1|1|001)\s*/i, '');
  
  // Other common patterns: +XX, XX, 00XX
  cleaned = cleaned.replace(/^(\+\d{1,3}|\d{1,3}|00\d{1,3})\s*/i, (match) => {
    // Only remove if it looks like a country code (1-3 digits)
    const digits = match.replace(/[^\d]/g, '');
    if (digits.length >= 1 && digits.length <= 3) {
      return '';
    }
    return match;
  });

  return cleaned.trim();
};

/**
 * Validate UK phone number format
 * Valid formats:
 * - Mobile: 07XXXXXXXXX (11 digits starting with 07)
 * - Landline: 01X, 02X, 03X, etc. (10-11 digits)
 */
export const validateUKPhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove country code first
  const phoneWithoutCode = removeCountryCode(phone);
  
  // Remove all spaces and non-digit characters
  const digitsOnly = phoneWithoutCode.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // UK phone numbers should be 10 or 11 digits (without country code)
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { isValid: false, error: 'Phone number must be 10 or 11 digits' };
  }

  // Mobile numbers start with 07 and should be 11 digits
  if (digitsOnly.startsWith('07')) {
    if (digitsOnly.length !== 11) {
      return { isValid: false, error: 'Mobile number must be 11 digits (starting with 07)' };
    }
    return { isValid: true };
  }

  // Landline numbers start with 01, 02, 03, etc.
  if (digitsOnly.startsWith('01') || digitsOnly.startsWith('02') || digitsOnly.startsWith('03')) {
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      return { isValid: false, error: 'Landline number must be 10 or 11 digits' };
    }
    return { isValid: true };
  }

  // If it doesn't match common UK patterns, still accept if it's 10-11 digits
  // (for international numbers or other formats)
  return { isValid: true };
};

/**
 * Normalize phone number for backend (remove country code and spaces)
 */
export const normalizePhoneForBackend = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove country code
  let normalized = removeCountryCode(phone);
  
  // Remove all spaces and non-digit characters
  normalized = normalized.replace(/\D/g, '');

  return normalized;
};

