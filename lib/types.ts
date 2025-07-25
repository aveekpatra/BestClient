import { Id } from "../convex/_generated/dataModel";

// Work Type enum
export type WorkType =
  | "online-work"
  | "health-insurance"
  | "life-insurance"
  | "income-tax"
  | "p-tax"
  | "mutual-funds"
  | "others";

// Payment Status enum
export type PaymentStatus = "paid" | "partial" | "unpaid";

// Client interface
export interface Client {
  _id: Id<"clients">;
  name: string;
  dateOfBirth: string; // DD/MM/YYYY
  address: string;
  phone: string;
  email?: string;
  panNumber?: string;
  aadharNumber?: string;
  usualWorkTypes: WorkType[];
  balance: number; // In paise
  password?: string; // For income tax related work
  ptId?: string; // For P-tax related work
  createdAt: number;
  updatedAt: number;
}

// Work interface
export interface Work {
  _id: Id<"works">;
  clientId: Id<"clients">;
  transactionDate: string; // DD/MM/YYYY
  totalPrice: number; // In paise
  paidAmount: number; // In paise
  workTypes: WorkType[];
  description: string;
  paymentStatus: PaymentStatus;
  createdAt: number;
  updatedAt: number;
}

// Sort options for filtering
export type SortOption =
  | "name"
  | "balance"
  | "income"
  | "address"
  | "workType"
  | "date"
  | "amount";

// Work type display labels
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  "online-work": "Online Work",
  "health-insurance": "Health Insurance",
  "life-insurance": "Life Insurance",
  "income-tax": "Income Tax",
  "p-tax": "P-Tax",
  "mutual-funds": "Mutual Funds",
  others: "Others",
};

// Payment status display labels
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

// Form data types for creating/updating
export interface ClientFormData {
  name: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  email?: string;
  panNumber?: string;
  aadharNumber?: string;
  usualWorkTypes: WorkType[];
  balance: number;
  password?: string; // For income tax related work
  ptId?: string; // For P-tax related work
}

export interface WorkFormData {
  clientId: Id<"clients">;
  transactionDate: string;
  totalPrice: number;
  paidAmount: number;
  workTypes: WorkType[];
  description: string;
}

// Filter types
export interface ClientFilters {
  workType?: WorkType;
  balanceMin?: number;
  balanceMax?: number;
  hasEmail?: boolean;
  hasPAN?: boolean;
  hasAadhar?: boolean;
  search?: string;
}

export interface WorkFilters {
  clientId?: Id<"clients">;
  workType?: WorkType;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}
