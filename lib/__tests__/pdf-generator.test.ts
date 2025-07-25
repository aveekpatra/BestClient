import { describe, it, expect, vi } from 'vitest';
import { generateReceiptPDF } from '../pdfGenerator';
import { Work, Client } from '../types';
import { Id } from '../../convex/_generated/dataModel';

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setDrawColor: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn().mockReturnValue('data:application/pdf;base64,mock-pdf-data'),
  })),
}));

const mockWork: Work = {
  _id: 'work1' as Id<'works'>,
  clientId: 'client1' as Id<'clients'>,
  transactionDate: '01/01/2024',
  totalPrice: 10000, // ₹100.00
  paidAmount: 5000,   // ₹50.00
  workType: 'online-work',
  description: 'Website development',
  paymentStatus: 'partial',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const mockClient: Client = {
  _id: 'client1' as Id<'clients'>,
  name: 'John Doe',
  address: '123 Main St, Mumbai',
  phone: '9876543210',
  email: 'john@example.com',
  dateOfBirth: '01/01/1990',
  usualWorkType: 'online-work',
  balance: 5000,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('PDF Receipt Generator', () => {
  it('generates single client receipt', () => {
    const works = [mockWork];
    const clients = { [mockClient._id]: mockClient };

    const result = generateReceiptPDF(works, clients);

    expect(result).toHaveProperty('dataUri');
    expect(result).toHaveProperty('filename');
    expect(result.dataUri).toContain('data:application/pdf');
    expect(result.filename).toContain('John-Doe');
    expect(result.filename).toContain('.pdf');
  });

  it('generates multi-client receipt', () => {
    const mockWork2: Work = {
      ...mockWork,
      _id: 'work2' as Id<'works'>,
      clientId: 'client2' as Id<'clients'>,
    };

    const mockClient2: Client = {
      ...mockClient,
      _id: 'client2' as Id<'clients'>,
      name: 'Jane Smith',
    };

    const works = [mockWork, mockWork2];
    const clients = {
      [mockClient._id]: mockClient,
      [mockClient2._id]: mockClient2,
    };

    const result = generateReceiptPDF(works, clients);

    expect(result).toHaveProperty('dataUri');
    expect(result).toHaveProperty('filename');
    expect(result.filename).toContain('Multi-Client');
  });

  it('includes custom business info', () => {
    const works = [mockWork];
    const clients = { [mockClient._id]: mockClient };
    const businessInfo = {
      name: 'Custom Business',
      address: 'Custom Address',
      phone: '+91-1234567890',
      email: 'custom@business.com',
    };

    const result = generateReceiptPDF(works, clients, businessInfo);

    expect(result).toHaveProperty('dataUri');
    expect(result).toHaveProperty('filename');
  });

  it('generates proper filename with date', () => {
    const works = [mockWork];
    const clients = { [mockClient._id]: mockClient };

    const result = generateReceiptPDF(works, clients);

    const today = new Date().toISOString().slice(0, 10);
    expect(result.filename).toContain(today);
  });
});