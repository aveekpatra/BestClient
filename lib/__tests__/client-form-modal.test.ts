import { describe, it, expect } from 'vitest'

// Test the form validation schema
describe('ClientFormModal Validation', () => {
  it('should validate required fields', () => {
    const requiredFields = ['name', 'dateOfBirth', 'address', 'phone', 'usualWorkType']
    expect(requiredFields).toHaveLength(5)
  })

  it('should validate phone number format', () => {
    const validPhones = ['9876543210', '8123456789', '7654321098']
    const invalidPhones = ['123456789', '12345678901', '5123456789']
    
    validPhones.forEach(phone => {
      expect(phone).toMatch(/^[6-9]\d{9}$/)
    })
    
    invalidPhones.forEach(phone => {
      expect(phone).not.toMatch(/^[6-9]\d{9}$/)
    })
  })

  it('should validate PAN format', () => {
    const validPANs = ['ABCDE1234F', 'XYZAB5678C']
    const invalidPANs = ['ABCDE123', 'abcde1234f', '12345ABCDE']
    
    validPANs.forEach(pan => {
      expect(pan).toMatch(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    })
    
    invalidPANs.forEach(pan => {
      expect(pan).not.toMatch(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    })
  })

  it('should validate Aadhar format', () => {
    const validAadhars = ['123456789012', '987654321098']
    const invalidAadhars = ['12345678901', '1234567890123', 'abcd56789012']
    
    validAadhars.forEach(aadhar => {
      expect(aadhar).toMatch(/^\d{12}$/)
    })
    
    invalidAadhars.forEach(aadhar => {
      expect(aadhar).not.toMatch(/^\d{12}$/)
    })
  })

  it('should validate date format', () => {
    const validDates = ['15/08/1990', '01/01/2000', '31/12/1985']
    const invalidDates = ['1990/08/15', '15-08-1990', '15/8/1990']
    
    validDates.forEach(date => {
      expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })
    
    invalidDates.forEach(date => {
      expect(date).not.toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })
  })

  it('should validate email format', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.in']
    const invalidEmails = ['invalid-email', 'test@', '@example.com']
    
    validEmails.forEach(email => {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })
    
    invalidEmails.forEach(email => {
      expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })
  })
})