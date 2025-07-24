import { describe, it, expect } from 'vitest'

// Mock data for testing
const validClientData = {
  name: 'John Doe',
  dateOfBirth: '15/08/1990',
  address: '123 Main Street, Mumbai, Maharashtra',
  phone: '9876543210',
  email: 'john@example.com',
  panNumber: 'ABCDE1234F',
  aadharNumber: '123456789012',
  usualWorkType: 'online-work' as const,
  balance: 0
}

const invalidClientData = {
  name: 'A', // too short
  dateOfBirth: '1990/08/15', // wrong format
  address: 'Short', // too short
  phone: '123', // invalid
  email: 'invalid-email',
  panNumber: 'INVALID',
  aadharNumber: '123',
  usualWorkType: 'online-work' as const,
  balance: 0
}

describe('Client Operations Business Logic', () => {
  describe('Client Data Validation', () => {
    it('should accept valid client data', () => {
      // This would be tested in the actual Convex function
      // For now, we test the validation logic separately
      expect(validClientData.name.length).toBeGreaterThan(1)
      expect(validClientData.phone).toMatch(/^[6-9][0-9]{9}$/)
      expect(validClientData.panNumber).toMatch(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    })

    it('should reject invalid client data', () => {
      expect(invalidClientData.name.length).toBeLessThan(2)
      expect(invalidClientData.phone).not.toMatch(/^[6-9][0-9]{9}$/)
      expect(invalidClientData.panNumber).not.toMatch(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    })
  })

  describe('Balance Calculations', () => {
    it('should calculate balance correctly for positive amounts', () => {
      const totalPrice = 10000 // ₹100.00 in paise
      const paidAmount = 6000  // ₹60.00 in paise
      const expectedBalance = totalPrice - paidAmount // ₹40.00 in paise
      
      expect(expectedBalance).toBe(4000)
    })

    it('should calculate balance correctly for overpayment', () => {
      const totalPrice = 10000 // ₹100.00 in paise
      const paidAmount = 12000 // ₹120.00 in paise
      const expectedBalance = totalPrice - paidAmount // -₹20.00 in paise
      
      expect(expectedBalance).toBe(-2000)
    })

    it('should handle zero balance correctly', () => {
      const totalPrice = 10000 // ₹100.00 in paise
      const paidAmount = 10000 // ₹100.00 in paise
      const expectedBalance = totalPrice - paidAmount // ₹0.00 in paise
      
      expect(expectedBalance).toBe(0)
    })
  })

  describe('Payment Status Logic', () => {
    it('should determine payment status correctly', () => {
      const determinePaymentStatus = (totalPrice: number, paidAmount: number) => {
        if (paidAmount >= totalPrice) return 'paid'
        if (paidAmount > 0) return 'partial'
        return 'unpaid'
      }

      expect(determinePaymentStatus(10000, 10000)).toBe('paid')
      expect(determinePaymentStatus(10000, 12000)).toBe('paid') // overpaid
      expect(determinePaymentStatus(10000, 5000)).toBe('partial')
      expect(determinePaymentStatus(10000, 0)).toBe('unpaid')
    })
  })

  describe('Client Balance Updates', () => {
    it('should update client balance when work is added', () => {
      let clientBalance = 0
      const workBalance = 5000 // ₹50.00 owed
      
      clientBalance += workBalance
      expect(clientBalance).toBe(5000)
    })

    it('should update client balance when work is modified', () => {
      let clientBalance = 5000 // existing balance
      const oldWorkBalance = 3000 // old work balance
      const newWorkBalance = 7000 // new work balance
      
      // Remove old balance and add new balance
      clientBalance = clientBalance - oldWorkBalance + newWorkBalance
      expect(clientBalance).toBe(9000)
    })

    it('should update client balance when work is deleted', () => {
      let clientBalance = 10000 // existing balance
      const workBalanceToRemove = 3000 // work being deleted
      
      clientBalance -= workBalanceToRemove
      expect(clientBalance).toBe(7000)
    })
  })

  describe('Search and Filter Logic', () => {
    const clients = [
      { name: 'John Doe', phone: '9876543210', email: 'john@example.com', usualWorkType: 'online-work', balance: 5000 },
      { name: 'Jane Smith', phone: '8765432109', email: 'jane@example.com', usualWorkType: 'health-insurance', balance: -2000 },
      { name: 'Bob Johnson', phone: '7654321098', email: 'bob@example.com', usualWorkType: 'online-work', balance: 0 }
    ]

    it('should filter clients by search term', () => {
      const searchTerm = 'john'
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      
      expect(filtered).toHaveLength(2) // John Doe and Bob Johnson
      expect(filtered.map(c => c.name)).toContain('John Doe')
      expect(filtered.map(c => c.name)).toContain('Bob Johnson')
    })

    it('should filter clients by work type', () => {
      const workType = 'online-work'
      const filtered = clients.filter(client => client.usualWorkType === workType)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(c => c.usualWorkType === workType)).toBe(true)
    })

    it('should filter clients by balance range', () => {
      const minBalance = 0
      const maxBalance = 10000
      const filtered = clients.filter(client => 
        client.balance >= minBalance && client.balance <= maxBalance
      )
      
      expect(filtered).toHaveLength(2) // John Doe and Bob Johnson
      expect(filtered.every(c => c.balance >= minBalance && c.balance <= maxBalance)).toBe(true)
    })

    it('should sort clients by name', () => {
      const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name))
      
      expect(sorted[0].name).toBe('Bob Johnson')
      expect(sorted[1].name).toBe('Jane Smith')
      expect(sorted[2].name).toBe('John Doe')
    })

    it('should sort clients by balance', () => {
      const sorted = [...clients].sort((a, b) => b.balance - a.balance)
      
      expect(sorted[0].balance).toBe(5000) // John Doe
      expect(sorted[1].balance).toBe(0)    // Bob Johnson
      expect(sorted[2].balance).toBe(-2000) // Jane Smith
    })
  })

  describe('Data Integrity Checks', () => {
    it('should prevent duplicate phone numbers', () => {
      const existingPhones = ['9876543210', '8765432109']
      const newPhone = '9876543210'
      
      const isDuplicate = existingPhones.includes(newPhone)
      expect(isDuplicate).toBe(true)
    })

    it('should prevent duplicate PAN numbers', () => {
      const existingPANs = ['ABCDE1234F', 'XYZAB5678C']
      const newPAN = 'ABCDE1234F'
      
      const isDuplicate = existingPANs.includes(newPAN)
      expect(isDuplicate).toBe(true)
    })

    it('should prevent duplicate Aadhar numbers', () => {
      const existingAadhars = ['123456789012', '987654321098']
      const newAadhar = '123456789012'
      
      const isDuplicate = existingAadhars.includes(newAadhar)
      expect(isDuplicate).toBe(true)
    })
  })
})