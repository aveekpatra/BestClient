import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format amount in paise to Indian Rupee format
 * @param amountInPaise Amount in paise (1 rupee = 100 paise)
 * @returns Formatted string like "₹1,234.56"
 */
export function formatCurrency(amountInPaise: number): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert rupees to paise
 * @param rupees Amount in rupees
 * @returns Amount in paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 * @param paise Amount in paise
 * @returns Amount in rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format date to DD/MM/YYYY format
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse DD/MM/YYYY format to Date object
 * @param dateString Date in DD/MM/YYYY format
 * @returns Date object
 */
export function parseDate(dateString: string): Date {
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get current date in DD/MM/YYYY format
 * @returns Current date string
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Format phone number for display
 * @param phone Raw phone number
 * @returns Formatted phone number
 */
export function formatPhone(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Handle 10-digit numbers
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  // Handle 12-digit numbers (with country code)
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const number = cleaned.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }

  return phone; // Return as-is if format is unexpected
}

/**
 * Format PAN number for display
 * @param pan PAN number
 * @returns Formatted PAN number
 */
export function formatPAN(pan: string): string {
  if (!pan) return "";
  return pan.toUpperCase();
}

/**
 * Format Aadhar number for display
 * @param aadhar Aadhar number
 * @returns Formatted Aadhar number
 */
export function formatAadhar(aadhar: string): string {
  if (!aadhar) return "";
  const cleaned = aadhar.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  return aadhar;
}

/**
 * Get work type display label
 * @param workType Work type enum value
 * @returns Display label
 */
export function getWorkTypeLabel(workType: string): string {
  const labels: Record<string, string> = {
    "online-work": "Online Work",
    "health-insurance": "Health Insurance",
    "life-insurance": "Life Insurance",
    "income-tax": "Income Tax",
    "p-tax": "P-Tax",
    "mutual-funds": "Mutual Funds",
    others: "Others",
  };
  return labels[workType] || workType;
}

/**
 * Get payment status display label and color
 * @param status Payment status
 * @returns Object with label and color class
 */
export function getPaymentStatusInfo(status: string): {
  label: string;
  colorClass: string;
} {
  const statusInfo: Record<string, { label: string; colorClass: string }> = {
    paid: { label: "Paid", colorClass: "text-green-600 bg-green-50" },
    partial: { label: "Partial", colorClass: "text-yellow-600 bg-yellow-50" },
    unpaid: { label: "Unpaid", colorClass: "text-red-600 bg-red-50" },
  };
  return (
    statusInfo[status] || {
      label: status,
      colorClass: "text-gray-600 bg-gray-50",
    }
  );
}

/**
 * Calculate payment status based on total and paid amounts
 * @param totalPrice Total price in paise
 * @param paidAmount Paid amount in paise
 * @returns Payment status
 */
export function calculatePaymentStatus(
  totalPrice: number,
  paidAmount: number,
): "paid" | "partial" | "unpaid" {
  if (paidAmount >= totalPrice) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
}

/**
 * Debounce function for search inputs
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce(
  func: (value: string) => void,
  wait: number,
): (value: string) => void {
  let timeout: NodeJS.Timeout;
  return (value: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(value), wait);
  };
}

/**
 * Generate a random ID for temporary use
 * @returns Random string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Truncate text to specified length
 * @param text Text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Check if a value is empty (null, undefined, empty string, or whitespace)
 * @param value Value to check
 * @returns True if empty
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
