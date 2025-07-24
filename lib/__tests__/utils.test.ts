import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  rupeesToPaise,
  paiseToRupees,
  formatDate,
  parseDate,
  getCurrentDate,
  formatPhone,
  formatPAN,
  formatAadhar,
  getWorkTypeLabel,
  getPaymentStatusInfo,
  calculatePaymentStatus,
  truncateText,
  isEmpty
} from '../utils'

describe('Currency Utils', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(10000)).toBe('₹100.00')
    expect(formatCurrency(12345)).toBe('₹123.45')
    expect(formatCurrency(0)).toBe('₹0.00')
    expect(formatCurrency(-5000)).toBe('-₹50.00')
  })

  it('should convert rupees to paise', () => {
    expect(rupeesToPaise(100)).toBe(10000)
    expect(rupeesToPaise(123.45)).toBe(12345)
    expect(rupeesToPaise(0)).toBe(0)
  })

  it('should convert paise to rupees', () => {
    expect(paiseToRupees(10000)).toBe(100)
    expect(paiseToRupees(12345)).toBe(123.45)
    expect(paiseToRupees(0)).toBe(0)
  })
})

describe('Date Utils', () => {
  it('should format date correctly', () => {
    const date = new Date(2023, 7, 15) // August 15, 2023
    expect(formatDate(date)).toBe('15/08/2023')
  })

  it('should parse date correctly', () => {
    const parsed = parseDate('15/08/2023')
    expect(parsed.getDate()).toBe(15)
    expect(parsed.getMonth()).toBe(7) // 0-indexed
    expect(parsed.getFullYear()).toBe(2023)
  })

  it('should get current date in correct format', () => {
    const currentDate = getCurrentDate()
    expect(currentDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})

describe('Formatting Utils', () => {
  it('should format phone numbers correctly', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210')
    expect(formatPhone('919876543210')).toBe('+91 98765 43210')
    expect(formatPhone('+919876543210')).toBe('+91 98765 43210')
  })

  it('should format PAN correctly', () => {
    expect(formatPAN('abcde1234f')).toBe('ABCDE1234F')
    expect(formatPAN('ABCDE1234F')).toBe('ABCDE1234F')
    expect(formatPAN('')).toBe('')
  })

  it('should format Aadhar correctly', () => {
    expect(formatAadhar('123456789012')).toBe('1234 5678 9012')
    expect(formatAadhar('1234 5678 9012')).toBe('1234 5678 9012')
    expect(formatAadhar('')).toBe('')
  })
})

describe('Label Utils', () => {
  it('should get work type labels correctly', () => {
    expect(getWorkTypeLabel('online-work')).toBe('Online Work')
    expect(getWorkTypeLabel('health-insurance')).toBe('Health Insurance')
    expect(getWorkTypeLabel('life-insurance')).toBe('Life Insurance')
    expect(getWorkTypeLabel('income-tax')).toBe('Income Tax')
    expect(getWorkTypeLabel('mutual-funds')).toBe('Mutual Funds')
    expect(getWorkTypeLabel('others')).toBe('Others')
  })

  it('should get payment status info correctly', () => {
    const paidInfo = getPaymentStatusInfo('paid')
    expect(paidInfo.label).toBe('Paid')
    expect(paidInfo.colorClass).toContain('green')

    const partialInfo = getPaymentStatusInfo('partial')
    expect(partialInfo.label).toBe('Partial')
    expect(partialInfo.colorClass).toContain('yellow')

    const unpaidInfo = getPaymentStatusInfo('unpaid')
    expect(unpaidInfo.label).toBe('Unpaid')
    expect(unpaidInfo.colorClass).toContain('red')
  })
})

describe('Payment Status Calculation', () => {
  it('should calculate payment status correctly', () => {
    expect(calculatePaymentStatus(10000, 10000)).toBe('paid')
    expect(calculatePaymentStatus(10000, 12000)).toBe('paid') // overpaid
    expect(calculatePaymentStatus(10000, 5000)).toBe('partial')
    expect(calculatePaymentStatus(10000, 0)).toBe('unpaid')
  })
})

describe('Text Utils', () => {
  it('should truncate text correctly', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...')
    expect(truncateText('Hello', 10)).toBe('Hello')
    expect(truncateText('', 5)).toBe('')
  })

  it('should check if values are empty', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
    
    expect(isEmpty('hello')).toBe(false)
    expect(isEmpty([1, 2, 3])).toBe(false)
    expect(isEmpty({ key: 'value' })).toBe(false)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
  })
})