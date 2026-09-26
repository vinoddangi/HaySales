import {
  isObject,
  parseIsoDate,
  parseNumber,
  parseString,
  RawRecord,
} from '../utils/rawHelpers';

// ── Transaction Type & Category Definitions ─────────────────────────────────

export type TransactionType =
  'SALE' | 'SERVICE' | 'PAYMENT' | 'PURCHASE' | 'EXPENSE';

export type CustomerTransactionType = Extract<
  TransactionType,
  'SALE' | 'SERVICE' | 'PAYMENT'
>;

export type OperationsTransactionType = Extract<
  TransactionType,
  'PURCHASE' | 'EXPENSE'
>;

// ── Category Definitions ───────────────────────────────────────────────────

export type CropCategory =
  'Tuvar' | 'Chana' | 'B. Kutty' | 'M. Kutty' | 'Isabgol' | 'Others';

export const VALID_CROP_CATEGORIES: CropCategory[] = [
  'Tuvar',
  'Chana',
  'B. Kutty',
  'M. Kutty',
  'Isabgol',
  'Others',
];

export function isCropCategory(category?: string): category is CropCategory {
  if (!category) return false;
  const normalized = category.trim().toLowerCase();
  return VALID_CROP_CATEGORIES.some((c) => c.toLowerCase() === normalized);
}

export type ServiceCategory =
  'Pickup' | 'Tractor' | 'Commission' | 'Labor' | 'Transport' | 'Others';

export const VALID_SERVICE_CATEGORIES: ServiceCategory[] = [
  'Pickup',
  'Tractor',
  'Commission',
  'Labor',
  'Transport',
  'Others',
];

export function isServiceCategory(
  category?: string,
): category is ServiceCategory {
  if (!category) return false;
  const normalized = category.trim().toLowerCase();
  return VALID_SERVICE_CATEGORIES.some((c) => c.toLowerCase() === normalized);
}

export type ExpenseCategory =
  | 'Fuel'
  | 'Maintenance'
  | 'Depreciation'
  | 'Interest'
  | 'Labor'
  | 'Food / Drink'
  | 'Tools'
  | 'Discount'
  | 'Profit Distribution'
  | 'Others';

export const VALID_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fuel',
  'Maintenance',
  'Depreciation',
  'Interest',
  'Labor',
  'Food / Drink',
  'Tools',
  'Discount',
  'Profit Distribution',
  'Others',
];

export function isExpenseCategory(
  category?: string,
): category is ExpenseCategory {
  if (!category) return false;
  const normalized = category.trim().toLowerCase();
  return VALID_EXPENSE_CATEGORIES.some((c) => c.toLowerCase() === normalized);
}

export type CustomerCategory = CropCategory | ServiceCategory;
export type OperationsCategory = CropCategory | ExpenseCategory;
export type TransactionCategory =
  CropCategory | ServiceCategory | ExpenseCategory;

// ── Strict Discriminated Union Types for Data & UI Layers ────────────────────

/**
 * Core Transaction Data with mandatory financial and identification attributes.
 * Captured fields: id, date, amount, cashPaid, remainingDue.
 */
export type CoreTransactionData = {
  id?: string;
  date: { seconds?: number } | string | number | Date;
  amount: number;
  cashPaid: number;
  remainingDue: number;
  note?: string;
};

/** Customer Sale Transaction — weight in Kg and customerId are mandatory */
export type SaleTransactionData = CoreTransactionData & {
  type: 'SALE';
  category: CropCategory;
  weight: number;
  customerId: string;
  customerName?: string;
  discount?: number;
};

/** Operations Crop Purchase Transaction — weight in Kg is mandatory */
export type PurchaseTransactionData = CoreTransactionData & {
  type: 'PURCHASE';
  category: CropCategory;
  weight: number;
  vendorName?: string;
  discount?: number;
};

/** Crop Transaction (SALE or PURCHASE) */
export type CropTransactionData = SaleTransactionData | PurchaseTransactionData;

/** Service Transaction (Pickup, Tractor, Labor, Commission, Transport) */
export type ServiceTransactionData = CoreTransactionData & {
  type: 'SERVICE';
  category: ServiceCategory;
  customerId: string;
  customerName?: string;
  discount?: number;
};

/** Customer Payment Transaction */
export type PaymentTransactionData = CoreTransactionData & {
  type: 'PAYMENT';
  customerId: string;
  customerName?: string;
  discount?: number;
};

/** Operating Expense Transaction */
export type ExpenseTransactionData = CoreTransactionData & {
  type: 'EXPENSE';
  category: ExpenseCategory;
  targetAssetId?: string;
  vendorName?: string;
  partnerName?: string;
};

/** Union of all customer transaction variants (SALE, SERVICE, PAYMENT) */
export type CustomerTransactionData =
  SaleTransactionData | ServiceTransactionData | PaymentTransactionData;

/** Union of all operations transaction variants (PURCHASE, EXPENSE) */
export type OperationsTransactionData =
  PurchaseTransactionData | ExpenseTransactionData;

/** Union of all specific transaction variants */
export type Transaction = CustomerTransactionData | OperationsTransactionData;

// ── Pure Type Guards ─────────────────────────────────────────────────────────

export function isSaleTransaction(tx: unknown): tx is SaleTransactionData {
  return (
    isObject(tx) && tx.type === 'SALE' && typeof tx.customerId === 'string'
  );
}

export function isPurchaseTransaction(
  tx: unknown,
): tx is PurchaseTransactionData {
  return (
    isObject(tx) && tx.type === 'PURCHASE' && typeof tx.weight === 'number'
  );
}

export function isCropTransaction(tx: unknown): tx is CropTransactionData {
  return (
    isObject(tx) &&
    (tx.type === 'SALE' || tx.type === 'PURCHASE') &&
    isCropCategory(tx.category as string) &&
    typeof tx.weight === 'number' &&
    Number(tx.weight) > 0
  );
}

export function isServiceTransaction(
  tx: unknown,
): tx is ServiceTransactionData {
  return (
    isObject(tx) && tx.type === 'SERVICE' && typeof tx.customerId === 'string'
  );
}

export function isPaymentTransaction(
  tx: unknown,
): tx is PaymentTransactionData {
  return (
    isObject(tx) && tx.type === 'PAYMENT' && typeof tx.customerId === 'string'
  );
}

export function isExpenseTransaction(
  tx: unknown,
): tx is ExpenseTransactionData {
  return isObject(tx) && tx.type === 'EXPENSE';
}

export function isDepreciationExpense(
  tx: unknown,
): tx is ExpenseTransactionData & { category: 'Depreciation' } {
  return isExpenseTransaction(tx) && tx.category === 'Depreciation';
}

export function isInterestExpense(
  tx: unknown,
): tx is ExpenseTransactionData & { category: 'Interest' } {
  return isExpenseTransaction(tx) && tx.category === 'Interest';
}

export function isProfitDistributionExpense(
  tx: unknown,
): tx is ExpenseTransactionData & { category: 'Profit Distribution' } {
  return isExpenseTransaction(tx) && tx.category === 'Profit Distribution';
}

export function isCustomerTransaction(
  tx: unknown,
): tx is CustomerTransactionData {
  return (
    isSaleTransaction(tx) ||
    isServiceTransaction(tx) ||
    isPaymentTransaction(tx)
  );
}

export function isOperationsTransaction(
  tx: unknown,
): tx is OperationsTransactionData {
  return isPurchaseTransaction(tx) || isExpenseTransaction(tx);
}

// ── Pure Calculation Helpers ─────────────────────────────────────────────────

/**
 * Upfront rate calculation: rate = amount / weight (strictly ₹/Kg).
 * ONLY calculated when the transaction is for a valid CropCategory (SALE or PURCHASE).
 * Returns undefined if transaction is not a valid crop transaction.
 */
export function getRate(tx: Partial<Transaction>): number | undefined {
  if (
    (tx.type === 'SALE' || tx.type === 'PURCHASE') &&
    isCropCategory(tx.category)
  ) {
    const w = Number((tx as Partial<CropTransactionData>).weight);
    const a = Number(tx.amount);
    if (w > 0 && a > 0) {
      return Number((a / w).toFixed(2));
    }
  }
  return undefined;
}

// ── Serialization & Deserialization Pure Functions ──────────────────────────

export function parseCustomerTransactionFromRaw(
  raw: RawRecord,
  id?: string,
  customerId?: string,
  customerName?: string,
): CustomerTransactionData {
  const finalId = parseString(id) || parseString(raw?.id);
  const rawType = parseString(raw?.type) as TransactionType | undefined;
  const date = parseIsoDate(raw?.date) || new Date().toISOString();
  const amount = parseNumber(raw?.amount) || parseNumber(raw?.paymentAmount, 0);
  const cashPaid = parseNumber(raw?.cashPaid, 0);
  const remainingDue = parseNumber(raw?.remainingDue, 0);
  const note = parseString(raw?.note) || parseString(raw?.notes);
  const custId = parseString(customerId) || parseString(raw?.customerId) || '';
  const custName = parseString(customerName) || parseString(raw?.customerName);
  const discount = parseNumber(raw?.discount);

  const core: CoreTransactionData = {
    id: finalId,
    date,
    amount,
    cashPaid,
    remainingDue,
    ...(note ? { note } : {}),
  };

  if (rawType === 'SERVICE') {
    return {
      ...core,
      type: 'SERVICE',
      category: (parseString(raw?.category) as ServiceCategory) || 'Pickup',
      customerId: custId,
      ...(custName ? { customerName: custName } : {}),
      ...(discount !== undefined ? { discount } : {}),
    };
  }

  if (rawType === 'PAYMENT') {
    return {
      ...core,
      type: 'PAYMENT',
      customerId: custId,
      ...(custName ? { customerName: custName } : {}),
      ...(discount !== undefined ? { discount } : {}),
    };
  }

  // Default: SALE
  const weight = parseNumber(raw?.weight) || parseNumber(raw?.weightKg) || 0;
  return {
    ...core,
    type: 'SALE',
    category: (parseString(raw?.category) as CropCategory) || 'Wheat',
    weight,
    customerId: custId,
    ...(custName ? { customerName: custName } : {}),
    ...(discount !== undefined ? { discount } : {}),
  };
}

export function parseOperationsTransactionFromRaw(
  raw: RawRecord,
  id?: string,
): OperationsTransactionData {
  const finalId = parseString(id) || parseString(raw?.id);
  const rawType = parseString(raw?.type) as TransactionType | undefined;
  const date = parseIsoDate(raw?.date) || new Date().toISOString();
  const amount = parseNumber(raw?.amount, 0);
  const cashPaid = parseNumber(raw?.cashPaid, 0);
  const remainingDue = parseNumber(raw?.remainingDue, 0);
  const note = parseString(raw?.note) || parseString(raw?.notes);
  const vendorName = parseString(raw?.vendorName);

  const core: CoreTransactionData = {
    id: finalId,
    date,
    amount,
    cashPaid,
    remainingDue,
    ...(note ? { note } : {}),
  };

  if (rawType === 'EXPENSE' || rawType === ('DIVIDEND' as string)) {
    const targetAssetId = parseString(raw?.targetAssetId);
    const partnerName = parseString(raw?.partnerName);
    const category =
      rawType === ('DIVIDEND' as string)
        ? 'Profit Distribution'
        : (parseString(raw?.category) as ExpenseCategory) || 'Others';

    return {
      ...core,
      type: 'EXPENSE',
      category,
      ...(targetAssetId ? { targetAssetId } : {}),
      ...(vendorName ? { vendorName } : {}),
      ...(partnerName ? { partnerName } : {}),
    };
  }

  // Default: PURCHASE
  const weight = parseNumber(raw?.weight) || parseNumber(raw?.weightKg) || 0;
  const discount = parseNumber(raw?.discount);
  return {
    ...core,
    type: 'PURCHASE',
    category: (parseString(raw?.category) as CropCategory) || 'Wheat',
    weight,
    ...(vendorName ? { vendorName } : {}),
    ...(discount !== undefined ? { discount } : {}),
  };
}

export function parseTransactionFromRaw(
  raw: RawRecord,
  id?: string,
  customerId?: string,
  customerName?: string,
): Transaction {
  const rawType = parseString(raw?.type);
  if (
    rawType === 'PURCHASE' ||
    rawType === 'EXPENSE' ||
    rawType === 'DIVIDEND'
  ) {
    return parseOperationsTransactionFromRaw(raw, id);
  }
  return parseCustomerTransactionFromRaw(raw, id, customerId, customerName);
}

export function serializeTransactionToRaw(
  tx: Transaction,
): Record<string, unknown> {
  return Object.assign({}, tx);
}
