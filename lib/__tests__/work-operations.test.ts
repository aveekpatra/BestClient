import { describe, it, expect } from 'vitest';
import { validateWorkData, validateDescription, validateAmount, validatePaymentAmount } from '../validation';

describe('Work Validation', () => {
  describe('validateDescription', () => {
    it('should validate valid descriptions', () => {
      expect(validateDescription('Valid work description')).toBe(true);
      expect(validateDescription('Short')).toBe(true);
      expect(validateDescription('A'.repeat(500))).toBe(true);
    });

    it('should reject invalid descriptions', () => {
      expect(validateDescription('')).toBe(false);
      expect(validateDescription('    ')).toBe(false);
      expect(validateDescription('Hi')).toBe(false); // Too short
      expect(validateDescription('A'.repeat(501))).toBe(false); // Too long
    });
  });

  describe('validateAmount', () => {
    it('should validate valid amounts', () => {
      expect(validateAmount(0)).toBe(true);
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(10000000000)).toBe(true); // Max amount
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(-1)).toBe(false);
      expect(validateAmount(10000000001)).toBe(false); // Over max
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate valid payment amounts', () => {
      expect(validatePaymentAmount(1000, 0)).toBe(true);
      expect(validatePaymentAmount(1000, 500)).toBe(true);
      expect(validatePaymentAmount(1000, 1000)).toBe(true);
    });

    it('should reject invalid payment amounts', () => {
      expect(validatePaymentAmount(1000, -1)).toBe(false);
      expect(validatePaymentAmount(1000, 1001)).toBe(false);
    });
  });

  describe('validateWorkData', () => {
    const validWorkData = {
      transactionDate: '15/12/2024',
      totalPrice: 10000, // ₹100 in paise
      paidAmount: 5000,  // ₹50 in paise
      description: 'Income tax filing work'
    };

    it('should validate valid work data', () => {
      const result = validateWorkData(validWorkData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject invalid transaction date', () => {
      const result = validateWorkData({
        ...validWorkData,
        transactionDate: 'invalid-date'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.transactionDate).toBeDefined();
    });

    it('should reject invalid total price', () => {
      const result = validateWorkData({
        ...validWorkData,
        totalPrice: -100
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.totalPrice).toBeDefined();
    });

    it('should reject invalid paid amount', () => {
      const result = validateWorkData({
        ...validWorkData,
        paidAmount: -100
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paidAmount).toBeDefined();
    });

    it('should reject paid amount exceeding total price', () => {
      const result = validateWorkData({
        ...validWorkData,
        paidAmount: 15000 // More than totalPrice
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paidAmount).toBeDefined();
    });

    it('should reject invalid description', () => {
      const result = validateWorkData({
        ...validWorkData,
        description: 'Hi' // Too short
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBeDefined();
    });
  });
});

describe('Work Business Logic', () => {
  describe('Payment Status Determination', () => {
    // Helper function to test payment status logic
    const determinePaymentStatus = (totalPrice: number, paidAmount: number): "paid" | "partial" | "unpaid" => {
      if (paidAmount <= 0) return "unpaid";
      if (paidAmount >= totalPrice) return "paid";
      return "partial";
    };

    it('should determine unpaid status correctly', () => {
      expect(determinePaymentStatus(1000, 0)).toBe('unpaid');
      expect(determinePaymentStatus(1000, -100)).toBe('unpaid');
    });

    it('should determine paid status correctly', () => {
      expect(determinePaymentStatus(1000, 1000)).toBe('paid');
      expect(determinePaymentStatus(1000, 1100)).toBe('paid');
    });

    it('should determine partial status correctly', () => {
      expect(determinePaymentStatus(1000, 500)).toBe('partial');
      expect(determinePaymentStatus(1000, 1)).toBe('partial');
      expect(determinePaymentStatus(1000, 999)).toBe('partial');
    });
  });

  describe('Balance Calculation', () => {
    // Helper function to test balance calculation logic
    const calculateBalance = (totalPrice: number, paidAmount: number): number => {
      return totalPrice - paidAmount;
    };

    it('should calculate balance correctly', () => {
      expect(calculateBalance(1000, 0)).toBe(1000);
      expect(calculateBalance(1000, 500)).toBe(500);
      expect(calculateBalance(1000, 1000)).toBe(0);
      expect(calculateBalance(1000, 1100)).toBe(-100);
    });
  });

  describe('Client Balance Update Logic', () => {
    // Test the logic for updating client balance based on multiple works
    const calculateClientBalance = (works: Array<{totalPrice: number, paidAmount: number}>): number => {
      return works.reduce((sum, work) => {
        return sum + (work.totalPrice - work.paidAmount);
      }, 0);
    };

    it('should calculate client balance from multiple works', () => {
      const works = [
        { totalPrice: 1000, paidAmount: 500 }, // Balance: 500
        { totalPrice: 2000, paidAmount: 2000 }, // Balance: 0
        { totalPrice: 1500, paidAmount: 1000 }, // Balance: 500
      ];
      
      expect(calculateClientBalance(works)).toBe(1000); // Total balance
    });

    it('should handle empty works array', () => {
      expect(calculateClientBalance([])).toBe(0);
    });

    it('should handle overpaid works', () => {
      const works = [
        { totalPrice: 1000, paidAmount: 1200 }, // Balance: -200
        { totalPrice: 1000, paidAmount: 800 },  // Balance: 200
      ];
      
      expect(calculateClientBalance(works)).toBe(0); // Net balance
    });
  });
});