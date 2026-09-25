import { BadgeSentiment } from '../components/common/Badge';
import { Customer, Transaction } from '../types';
import {
  formatRupee,
  formatWeight,
  getTransactionFinancials,
  parseTransactionDate,
} from './formatters';
import { parseNumber, parseOptionalString, parseString } from './rawHelpers';

export interface SanitizedDateInfo {
  date: Date;
  isoDate: string;
  formattedDate: string;
  day: string;
  month: string;
  year: number;
}

export interface SanitizedBadgeInfo {
  sentiment: BadgeSentiment;
  label: string;
}

export interface SanitizedTransactionData {
  id: string;
  type: Transaction['type'];
  typeLabel: string;

  // Party Information
  displayName: string;
  customerId?: string;
  customerName?: string;
  vendorName?: string;

  // Item & Description
  category: string;
  displaySubtitle: string;
  note: string;

  // Weights & Financials
  weightKg: number;
  formattedWeight: string;
  amount: number;
  effectiveAmount: number;
  formattedAmount: string;
  cashPaid: number;
  remainingDue: number;
  paymentAmount: number;
  avgRate: number;
  formattedRate: string;

  // Status Flags
  isSale: boolean;
  isService: boolean;
  isPayment: boolean;
  isPurchase: boolean;
  isExpense: boolean;
  isOpening: boolean;
  isFullCash: boolean;
  isPartialCash: boolean;
  isFullCredit: boolean;

  // UI & Styling Helpers
  badgeSentiment: BadgeSentiment;
  badgeLabel: string;
  amountColorClass: string;

  // Date Information
  date: Date;
  isoDate: string;
  formattedDate: string;
  day: string;
  month: string;
  year: number;
}

export interface SanitizedCustomerData {
  id: string;
  name: string;
  mobile: string;
  village: string;
  creditLimit: number;
  outstandingAmount: number;
  formattedOutstanding: string;
  formattedCreditLimit: string;
  hasOutstanding: boolean;
  isCreditExceeded: boolean;
}

/* =========================================================================
   Small Single-Purpose Utility Functions
   ========================================================================= */

/**
 * Extracts and sanitizes the primary party name (Customer / Vendor / Payee).
 */
export function extractPartyDisplayName(raw: any): string {
  if (!raw || typeof raw !== 'object') return 'Unknown';

  const type = raw.type || 'SALE';
  const customerName = parseOptionalString(raw.customerName);
  const vendorName = parseOptionalString(raw.vendorName);
  const category = parseOptionalString(raw.category);

  if (type === 'SALE' || type === 'SERVICE' || type === 'PAYMENT') {
    return customerName || 'Customer';
  }
  if (type === 'PURCHASE') {
    return vendorName || 'Stock Procurement';
  }
  if (type === 'EXPENSE') {
    return vendorName || category || 'Expense Payee';
  }
  return customerName || vendorName || 'Party';
}

/**
 * Safely parses and structures date values for UI display.
 */
export function sanitizeTransactionDate(dateVal: any): SanitizedDateInfo {
  const date = parseTransactionDate(dateVal) || new Date();
  const isoDate = date.toISOString();
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  return { date, isoDate, formattedDate, day, month, year };
}

/**
 * Calculates effective unit rate per kg safely without NaN or division by zero.
 */
export function calculateTransactionRate(
  amount: number,
  weightKg?: number,
  fallbackRate?: number,
): number {
  if (weightKg && weightKg > 0) {
    return amount / weightKg;
  }
  return parseNumber(fallbackRate, 0);
}

/**
 * Formats a unit rate into standard currency string (e.g. ₹40.00/kg).
 */
export function formatTransactionRate(rate: number): string {
  const safeRate = isNaN(rate) ? 0 : rate;
  return `₹${safeRate.toFixed(2)}/kg`;
}

/**
 * Builds the descriptive secondary subtitle line for transactions in lists and cards.
 */
export function buildTransactionSubtitle(
  raw: any,
  computedAvgRate?: number,
): string {
  if (!raw || typeof raw !== 'object') return 'No details';

  const type = raw.type || 'SALE';
  const category = parseString(raw.category, '');
  const note = parseString(raw.note, '');
  const weightKg = parseNumber(raw.weightKg, 0);
  const rate =
    computedAvgRate !== undefined
      ? computedAvgRate
      : calculateTransactionRate(Number(raw.amount) || 0, weightKg, raw.rate);

  if (type === 'SALE') {
    return `${category} • ${formatWeight(weightKg)} @ ${formatTransactionRate(rate)}`;
  }
  if (type === 'SERVICE') {
    return `Service: ${category}${note ? ` • ${note}` : ''}`;
  }
  if (type === 'PAYMENT') {
    return 'Payment Received & Dues Settled';
  }
  if (type === 'PURCHASE') {
    return `${category} • ${formatWeight(weightKg)} @ ${formatTransactionRate(rate)}`;
  }
  if (type === 'EXPENSE') {
    return `${category}${note ? ` • ${note}` : ''}`;
  }
  return `${category}${note ? ` • ${note}` : ''}`;
}

/**
 * Maps transaction type to user-friendly label.
 */
export function getTransactionTypeLabel(type?: string): string {
  switch (type) {
    case 'PAYMENT':
      return 'Payment';
    case 'SERVICE':
      return 'Service';
    case 'SALE':
      return 'Sale';
    case 'PURCHASE':
      return 'Purchase';
    case 'EXPENSE':
      return 'Expense';
    case 'OPENING_BALANCE':
      return 'Opening Due';
    default:
      return 'Transaction';
  }
}

/**
 * Returns badge sentiment and label based on transaction payment & category state.
 */
export function getTransactionBadge(raw: any): SanitizedBadgeInfo {
  if (!raw || typeof raw !== 'object') {
    return { sentiment: 'neutral', label: 'Sale' };
  }

  const type = raw.type || 'SALE';
  const category = parseString(raw.category, '');
  const { cash, credit } = getTransactionFinancials(raw);

  const isSaleOrService = type === 'SALE' || type === 'SERVICE';
  const isFullCash = isSaleOrService && credit === 0 && cash > 0;
  const isPartialCash = isSaleOrService && cash > 0 && credit > 0;
  const isFullCredit = isSaleOrService && cash === 0 && credit > 0;

  if (type === 'PAYMENT') {
    return { sentiment: 'positive', label: 'Payment' };
  }
  if (isFullCash) {
    return { sentiment: 'cash', label: 'Cash' };
  }
  if (isPartialCash) {
    return { sentiment: 'credit', label: 'Part-Cash' };
  }
  if (isFullCredit) {
    return { sentiment: 'credit', label: 'Credit' };
  }
  if (type === 'SERVICE') {
    return { sentiment: 'service', label: 'Service' };
  }
  if (type === 'PURCHASE') {
    return { sentiment: 'purchase', label: category };
  }
  if (type === 'EXPENSE') {
    return { sentiment: 'expense', label: category };
  }
  return { sentiment: 'neutral', label: getTransactionTypeLabel(type) };
}

/**
 * Returns appropriate Tailwind color class for amounts based on transaction type and payment nature.
 */
export function getTransactionAmountColor(rawOrType?: string | any): string {
  if (typeof rawOrType === 'object' && rawOrType !== null) {
    const type = rawOrType.type || 'SALE';
    const { cash, credit } = getTransactionFinancials(rawOrType);
    const isSaleOrService = type === 'SALE' || type === 'SERVICE';
    const isFullCash = isSaleOrService && credit === 0 && cash > 0;
    const isFullCredit = isSaleOrService && cash === 0 && credit > 0;
    const isPartialCash = isSaleOrService && cash > 0 && credit > 0;

    if (type === 'PAYMENT') return 'text-emerald-600 dark:text-emerald-400';
    if (isFullCash) return 'text-emerald-600 dark:text-emerald-400';
    if (isFullCredit || isPartialCash)
      return 'text-purple-600 dark:text-purple-400';
    if (type === 'SERVICE') return 'text-sky-600 dark:text-sky-400';
    if (type === 'PURCHASE') return 'text-amber-600 dark:text-amber-400';
    if (type === 'EXPENSE') return 'text-rose-600 dark:text-rose-400';
    return 'text-m3-on-surface';
  }

  switch (rawOrType) {
    case 'PAYMENT':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'PURCHASE':
      return 'text-amber-600 dark:text-amber-400';
    case 'EXPENSE':
      return 'text-rose-600 dark:text-rose-400';
    case 'SERVICE':
      return 'text-sky-600 dark:text-sky-400';
    default:
      return 'text-m3-on-surface';
  }
}

/* =========================================================================
   Aggregated Sanitizers
   ========================================================================= */

/**
 * Sanitizes any raw or typed transaction into safe, structured presentation data for TSX.
 */
export function sanitizeTransactionDisplay(
  raw: Transaction | any,
): SanitizedTransactionData {
  if (!raw || typeof raw !== 'object') {
    const dateInfo = sanitizeTransactionDate(null);
    return {
      id: '',
      type: 'SALE',
      typeLabel: 'Sale',
      displayName: 'Unknown',
      category: '',
      displaySubtitle: 'No transaction data',
      note: '',
      weightKg: 0,
      formattedWeight: '0 kg',
      amount: 0,
      effectiveAmount: 0,
      formattedAmount: formatRupee(0),
      cashPaid: 0,
      remainingDue: 0,
      paymentAmount: 0,
      avgRate: 0,
      formattedRate: '₹0.00/kg',
      isSale: true,
      isService: false,
      isPayment: false,
      isPurchase: false,
      isExpense: false,
      isOpening: false,
      isFullCash: false,
      isPartialCash: false,
      isFullCredit: false,
      badgeSentiment: 'neutral',
      badgeLabel: 'Sale',
      amountColorClass: 'text-m3-on-surface',
      ...dateInfo,
    };
  }

  const id = parseString(raw.id, '');
  const type: Transaction['type'] = raw.type || 'SALE';
  const customerId = parseOptionalString(raw.customerId);
  const customerName = parseOptionalString(raw.customerName);
  const vendorName = parseOptionalString(raw.vendorName);
  const category = parseString(raw.category, '');
  const note = parseString(raw.note, '');

  const isSale = type === 'SALE';
  const isService = type === 'SERVICE';
  const isPayment = type === 'PAYMENT';
  const isPurchase = type === 'PURCHASE';
  const isExpense = type === 'EXPENSE';
  const isOpening = type === 'OPENING_BALANCE';

  // Date Sanitization
  const dateInfo = sanitizeTransactionDate(raw.date);

  // Financials Sanitization
  const { amount, cash, credit, paymentVal } = getTransactionFinancials(raw);
  const effectiveAmount = isPayment ? paymentVal : amount;
  const weightKg = parseNumber(raw.weightKg, 0);

  const isFullCash = (isSale || isService) && credit === 0 && cash > 0;
  const isPartialCash = (isSale || isService) && cash > 0 && credit > 0;
  const isFullCredit = (isSale || isService) && cash === 0 && credit > 0;

  const avgRate = calculateTransactionRate(effectiveAmount, weightKg, raw.rate);

  // Display Name & Subtitle
  const displayName = extractPartyDisplayName(raw);
  const displaySubtitle = buildTransactionSubtitle(raw, avgRate);

  // Type & Badges
  const typeLabel = getTransactionTypeLabel(type);
  const badgeInfo = getTransactionBadge(raw);
  const amountColorClass = getTransactionAmountColor(raw);

  return {
    id,
    type,
    typeLabel,
    displayName,
    customerId,
    customerName,
    vendorName,
    category,
    displaySubtitle,
    note,
    weightKg,
    formattedWeight: formatWeight(weightKg),
    amount,
    effectiveAmount,
    formattedAmount: formatRupee(effectiveAmount),
    cashPaid: cash,
    remainingDue: credit,
    paymentAmount: paymentVal,
    avgRate,
    formattedRate: formatTransactionRate(avgRate),
    isSale,
    isService,
    isPayment,
    isPurchase,
    isExpense,
    isOpening,
    isFullCash,
    isPartialCash,
    isFullCredit,
    badgeSentiment: badgeInfo.sentiment,
    badgeLabel: badgeInfo.label,
    amountColorClass,
    ...dateInfo,
  };
}

/**
 * Bulk sanitizer for arrays of transaction records.
 */
export function sanitizeTransactionsList(
  list: (Transaction | any)[],
): SanitizedTransactionData[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeTransactionDisplay);
}

/**
 * Sanitizes customer entity into clean presentation metrics.
 */
export function sanitizeCustomerData(
  raw: Customer | any,
): SanitizedCustomerData {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: 'Unknown Customer',
      mobile: '',
      village: '',
      creditLimit: 35000,
      outstandingAmount: 0,
      formattedOutstanding: formatRupee(0),
      formattedCreditLimit: formatRupee(35000),
      hasOutstanding: false,
      isCreditExceeded: false,
    };
  }

  const id = parseString(raw.id, '');
  const name = parseString(raw.name, 'Customer');
  const mobile = parseString(raw.mobile, '');
  const village = parseString(raw.village, '');
  const creditLimit = parseNumber(raw.creditLimit, 35000);
  const outstandingAmount = parseNumber(raw.outstandingAmount, 0);

  return {
    id,
    name,
    mobile,
    village,
    creditLimit,
    outstandingAmount,
    formattedOutstanding: formatRupee(outstandingAmount),
    formattedCreditLimit: formatRupee(creditLimit),
    hasOutstanding: outstandingAmount > 0,
    isCreditExceeded: outstandingAmount > creditLimit,
  };
}

/**
 * Bulk sanitizer for arrays of customer records.
 */
export function sanitizeCustomersList(
  list: (Customer | any)[],
): SanitizedCustomerData[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeCustomerData);
}
