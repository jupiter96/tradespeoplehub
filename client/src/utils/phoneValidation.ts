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
 * Validate phone number (without country code)
 * Valid formats:
 * - Mobile: 07XXXXXXXXX (11 digits starting with 07)
 * - Landline: 01X, 02X, 03X, etc. (9-11 digits)
 */
export const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; error?: string } => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all spaces and non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Phone numbers should be 9, 10, or 11 digits (without country code)
  if (digitsOnly.length < 9 || digitsOnly.length > 11) {
    return { isValid: false, error: 'Phone number must be 9, 10, or 11 digits' };
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
    if (digitsOnly.length < 9 || digitsOnly.length > 11) {
      return { isValid: false, error: 'Landline number must be 9, 10, or 11 digits' };
    }
    return { isValid: true };
  }

  // If it doesn't match common UK patterns, still accept if it's 9-11 digits
  return { isValid: true };
};

/**
 * Format phone number: limit to 10-11 digits, remove excess digits from front if over 11
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  // Remove all spaces and non-digit characters
  let digitsOnly = phoneNumber.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return '';
  }

  // If more than 11 digits, remove first 2 digits and keep last 11
  if (digitsOnly.length > 11) {
    digitsOnly = digitsOnly.slice(-11);
  }

  // Limit to 11 digits maximum
  if (digitsOnly.length > 11) {
    digitsOnly = digitsOnly.slice(0, 11);
  }

  return digitsOnly;
};

/**
 * Normalize phone number for backend (add country code and remove spaces)
 * Removes existing country code from phone number before adding the specified country code
 */
export const normalizePhoneForBackend = (phoneNumber: string, countryCode: string = '+44'): string => {
  console.log('[normalizePhoneForBackend] Step 1: Input - phoneNumber:', phoneNumber, 'countryCode:', countryCode);
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    console.log('[normalizePhoneForBackend] Step 2: Invalid input, returning empty string');
    return '';
  }

  // Remove all spaces and non-digit characters
  let normalized = phoneNumber.replace(/\D/g, '');
  console.log('[normalizePhoneForBackend] Step 3: After removing non-digits:', normalized);

  if (normalized.length === 0) {
    console.log('[normalizePhoneForBackend] Step 4: Empty after cleaning, returning empty string');
    return '';
  }

  // Remove country code from countryCode string (e.g., "+44" -> "44")
  const codeDigits = countryCode.replace(/\D/g, '');
  console.log('[normalizePhoneForBackend] Step 5: Country code digits:', codeDigits);

  // Remove existing country code from the beginning of the phone number
  // Check for common country codes: 44, 1, etc.
  if (normalized.startsWith(codeDigits) && normalized.length > codeDigits.length) {
    // If phone number already starts with the country code, remove it
    normalized = normalized.substring(codeDigits.length);
    console.log('[normalizePhoneForBackend] Step 6: Removed existing country code, phone number:', normalized);
  } else {
    // Check for other common country codes and remove them
    // UK: 44, 0044
    if (normalized.startsWith('44') && normalized.length > 9) {
      normalized = normalized.substring(2);
      console.log('[normalizePhoneForBackend] Step 6: Removed UK country code 44, phone number:', normalized);
    }
    // US/Canada: 1, 001
    else if (normalized.startsWith('1') && normalized.length > 9 && !normalized.startsWith('11') && !normalized.startsWith('12') && !normalized.startsWith('13') && !normalized.startsWith('14') && !normalized.startsWith('15') && !normalized.startsWith('16') && !normalized.startsWith('17') && !normalized.startsWith('18') && !normalized.startsWith('19')) {
      normalized = normalized.substring(1);
      console.log('[normalizePhoneForBackend] Step 6: Removed US/Canada country code 1, phone number:', normalized);
    }
    // Other 2-digit country codes (20-99)
    else if (normalized.length > 12 && /^[2-9]\d/.test(normalized)) {
      const firstTwo = normalized.substring(0, 2);
      // Check if it's a valid 2-digit country code (20-99)
      if (parseInt(firstTwo) >= 20 && parseInt(firstTwo) <= 99) {
        normalized = normalized.substring(2);
        console.log('[normalizePhoneForBackend] Step 6: Removed 2-digit country code', firstTwo, 'phone number:', normalized);
      }
    }
    // Other 3-digit country codes (100-999)
    else if (normalized.length > 13 && /^[1-9]\d{2}/.test(normalized)) {
      const firstThree = normalized.substring(0, 3);
      // Check if it's a valid 3-digit country code (100-999)
      if (parseInt(firstThree) >= 100 && parseInt(firstThree) <= 999) {
        normalized = normalized.substring(3);
        console.log('[normalizePhoneForBackend] Step 6: Removed 3-digit country code', firstThree, 'phone number:', normalized);
      }
    }
  }

  // Combine country code and phone number
  const result = codeDigits + normalized;
  console.log('[normalizePhoneForBackend] Step 7: Final result:', result);
  return result;
};
