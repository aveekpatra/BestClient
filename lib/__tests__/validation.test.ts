import { describe, it, expect } from 'vitest'
import {
  validatePAN,
  validateAadhar,
  validatePhone,
  validateEmail,
  validateDate,
  validateName,
  validateAddress,
  validateClientData
} from '../validation'

describe('validatePAN', () => {
  it('should validate correct PAN format', () => {
    expect(validatePAN('ABCDE1234F')).toBe(true)
    expect(validatePAN('XYZAB9876C')).toBe(true)
  })

  it('should reject incorrect PAN format', () => {
    expect(validatePAN('ABC123456')).toBe(false)
    expect(validatePAN('ABCDE12345')).toBe(false)
    expect(validatePAN('12345ABCDE')).toBe(false)
    expect(validatePAN('abcde1234f')).toBe(false)
  })

  it('should accept empty PAN (optional field)', () => {
    expect(validatePAN('')).toBe(true)
  })
})

describe('validateAadhar', () => {
  it('should validate correct Aadhar format', () => {
    expect(validateAadhar('123456789012')).toBe(true)
    expect(validateAadhar('1234 5678 9012')).toBe(true)
    expect(validateAadhar('1234-5678-9012')).toBe(true)
  })

  it('should reject incorrect Aadhar format', () => {
    expect(validateAadhar('12345678901')).toBe(false) // 11 digits
    expect(validateAadhar('1234567890123')).toBe(false) // 13 digits
    expect(validateAadhar('abcd5678901')).toBe(false) // contains letters
  })

  it('should accept empty Aadhar (optional field)', () => {
    expect(validateAadhar('')).toBe(true)
  })
})

describe('validatePhone', () => {
  it('should validate correct Indian phone numbers', () => {
    expect(validatePhone('9876543210')).toBe(true)
    expect(validatePhone('8123456789')).toBe(true)
    expect(validatePhone('919876543210')).toBe(true)
    expect(validatePhone('+919876543210')).toBe(true)
    expect(validatePhone('91 9876543210')).toBe(true)
    expect(validatePhone('98765-43210')).toBe(true)
  })

  it('should reject incorrect phone numbers', () => {
    expect(validatePhone('123456789')).toBe(false) // 9 digits
    expect(validatePhone('12345678901')).toBe(false) // 11 digits
    expect(validatePhone('5123456789')).toBe(false) // starts with 5
    expect(validatePhone('abcdefghij')).toBe(false) // letters
    expect(validatePhone('')).toBe(false) // empty (required field)
  })
})

describe('validateEmail', () => {
  it('should validate correct email format', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co.in')).toBe(true)
    expect(validateEmail('test+tag@example.org')).toBe(true)
  })

  it('should reject incorrect email format', () => {
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('test@.com')).toBe(false)
  })

  it('should accept empty email (optional field)', () => {
    expect(validateEmail('')).toBe(true)
  })
})

describe('validateDate', () => {
  it('should validate correct DD/MM/YYYY format', () => {
    expect(validateDate('15/08/1990')).toBe(true)
    expect(validateDate('01/01/2000')).toBe(true)
    expect(validateDate('31/12/1985')).toBe(true)
  })

  it('should reject incorrect date format', () => {
    expect(validateDate('1990/08/15')).toBe(false) // wrong format
    expect(validateDate('15-08-1990')).toBe(false) // wrong separator
    expect(validateDate('32/01/2000')).toBe(false) // invalid day
    expect(validateDate('15/13/2000')).toBe(false) // invalid month
    expect(validateDate('29/02/2021')).toBe(false) // invalid leap year
    expect(validateDate('')).toBe(false) // empty
  })

  it('should handle leap years correctly', () => {
    expect(validateDate('29/02/2020')).toBe(true) // valid leap year
    expect(validateDate('29/02/2021')).toBe(false) // invalid leap year
  })
})

describe('validateName', () => {
  it('should validate correct names', () => {
    expect(validateName('John Doe')).toBe(true)
    expect(validateName('A B')).toBe(true) // minimum 2 chars
    expect(validateName('Very Long Name That Is Still Valid')).toBe(true)
  })

  it('should reject incorrect names', () => {
    expect(validateName('')).toBe(false)
    expect(validateName('A')).toBe(false) // too short
    expect(validateName('   ')).toBe(false) // only spaces
    expect(validateName('A'.repeat(101))).toBe(false) // too long
  })
})

describe('validateAddress', () => {
  it('should validate correct addresses', () => {
    expect(validateAddress('123 Main Street, City')).toBe(true)
    expect(validateAddress('A'.repeat(10))).toBe(true) // minimum length
    expect(validateAddress('A'.repeat(500))).toBe(true) // maximum length
  })

  it('should reject incorrect addresses', () => {
    expect(validateAddress('')).toBe(false)
    expect(validateAddress('Short')).toBe(false) // too short
    expect(validateAddress('   ')).toBe(false) // only spaces
    expect(validateAddress('A'.repeat(501))).toBe(false) // too long
  })
})

describe('validateClientData', () => {
  const validClientData = {
    name: 'John Doe',
    dateOfBirth: '15/08/1990',
    address: '123 Main Street, Mumbai',
    phone: '9876543210',
    email: 'john@example.com',
    panNumber: 'ABCDE1234F',
    aadharNumber: '123456789012'
  }

  it('should validate correct client data', () => {
    const result = validateClientData(validClientData)
    expect(result.isValid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should validate client data without optional fields', () => {
    const minimalData = {
      name: 'John Doe',
      dateOfBirth: '15/08/1990',
      address: '123 Main Street, Mumbai',
      phone: '9876543210'
    }
    const result = validateClientData(minimalData)
    expect(result.isValid).toBe(true)
  })

  it('should return errors for invalid data', () => {
    const invalidData = {
      name: 'A', // too short
      dateOfBirth: '1990/08/15', // wrong format
      address: 'Short', // too short
      phone: '123', // invalid
      email: 'invalid-email', // invalid format
      panNumber: 'INVALID', // wrong format
      aadharNumber: '123' // too short
    }
    
    const result = validateClientData(invalidData)
    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBeDefined()
    expect(result.errors.dateOfBirth).toBeDefined()
    expect(result.errors.address).toBeDefined()
    expect(result.errors.phone).toBeDefined()
    expect(result.errors.email).toBeDefined()
    expect(result.errors.panNumber).toBeDefined()
    expect(result.errors.aadharNumber).toBeDefined()
  })

  it('should not return errors for valid optional fields', () => {
    const dataWithValidOptionals = {
      ...validClientData,
      email: undefined,
      panNumber: undefined,
      aadharNumber: undefined
    }
    
    const result = validateClientData(dataWithValidOptionals)
    expect(result.isValid).toBe(true)
    expect(result.errors.email).toBeUndefined()
    expect(result.errors.panNumber).toBeUndefined()
    expect(result.errors.aadharNumber).toBeUndefined()
  })
})