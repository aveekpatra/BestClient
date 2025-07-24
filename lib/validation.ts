// Validation utilities for client data

/**
 * Validates PAN number format
 * PAN format: AAAAA9999A (5 letters, 4 digits, 1 letter)
 */
export function validatePAN(pan: string): boolean {
  if (!pan) return true; // Optional field
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

/**
 * Validates Aadhar number format
 * Aadhar format: 12 digits, can have spaces or hyphens
 */
export function validateAadhar(aadhar: string): boolean {
  if (!aadhar) return true; // Optional field
  // Remove spaces and hyphens
  const cleanAadhar = aadhar.replace(/[\s-]/g, '');
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(cleanAadhar);
}

/**
 * Validates Indian phone number format
 * Supports: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX (10 digits)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false; // Required field
  // Remove spaces, hyphens, and plus signs
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  
  // Check for 10-digit number or 12-digit with country code
  const phoneRegex = /^(91)?[6-9][0-9]{9}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates date in DD/MM/YYYY format
 */
export function validateDate(date: string): boolean {
  if (!date) return false;
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = date.match(dateRegex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Basic date validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear() + 100) return false;
  
  // More specific validation for days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * Validates client name
 */
export function validateName(name: string): boolean {
  if (!name) return false;
  return name.trim().length >= 2 && name.trim().length <= 100;
}

/**
 * Validates address
 */
export function validateAddress(address: string): boolean {
  if (!address) return false;
  return address.trim().length >= 10 && address.trim().length <= 500;
}

/**
 * Comprehensive client validation
 */
export interface ClientValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateClientData(data: {
  name: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  email?: string;
  panNumber?: string;
  aadharNumber?: string;
}): ClientValidationResult {
  const errors: Record<string, string> = {};

  if (!validateName(data.name)) {
    errors.name = "Name must be between 2 and 100 characters";
  }

  if (!validateDate(data.dateOfBirth)) {
    errors.dateOfBirth = "Date must be in DD/MM/YYYY format and valid";
  }

  if (!validateAddress(data.address)) {
    errors.address = "Address must be between 10 and 500 characters";
  }

  if (!validatePhone(data.phone)) {
    errors.phone = "Phone number must be a valid Indian mobile number";
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = "Email must be a valid email address";
  }

  if (data.panNumber && !validatePAN(data.panNumber)) {
    errors.panNumber = "PAN must be in format AAAAA9999A";
  }

  if (data.aadharNumber && !validateAadhar(data.aadharNumber)) {
    errors.aadharNumber = "Aadhar must be 12 digits";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}