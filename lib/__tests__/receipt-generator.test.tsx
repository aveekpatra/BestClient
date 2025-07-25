import { describe, it, expect } from 'vitest';

// Simple test to verify the component exists and can be imported
describe('ReceiptGenerator', () => {
  it('should be importable', async () => {
    const ReceiptGenerator = await import('../../components/ReceiptGenerator');
    expect(ReceiptGenerator.default).toBeDefined();
  });

  it('should export generateReceiptPDF function', async () => {
    const { generateReceiptPDF } = await import('../../lib/pdfGenerator');
    expect(generateReceiptPDF).toBeDefined();
    expect(typeof generateReceiptPDF).toBe('function');
  });
});