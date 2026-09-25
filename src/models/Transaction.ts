import {
  parseOptionalIsoDate,
  parseOptionalNumber,
  parseOptionalString,
  RawRecord,
} from '../utils/rawHelpers';

// ── Transaction Type & Category Definitions ─────────────────────────────────

export type TransactionType =
  | 'SALE'
  | 'SERVICE'
  | 'PAYMENT'
  | 'OPENING_BALANCE'
  | 'PURCHASE'
  | 'EXPENSE'
  | 'DIVIDEND';

export type CustomerTransactionType = Extract<
  TransactionType,
  'SALE' | 'SERVICE' | 'PAYMENT' | 'OPENING_BALANCE'
>;

export type OperationsTransactionType = Extract<
  TransactionType,
  'PURCHASE' | 'EXPENSE' | 'DIVIDEND'
>;

export type CropType =
  'Tuvar' | 'Chana' | 'B. Kutty' | 'M. Kutty' | 'Isabgol' | 'Others';

export type ServiceType =
  'Pickup' | 'Tractor' | 'Commission' | 'Labor' | 'Transport' | 'Others';

export type ExpenseCategoryType =
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

export type CustomerCategoryType = CropType | ServiceType;
export type OperationsCategoryType = CropType | ExpenseCategoryType;
export type CategoryType =
  CropType | ServiceType | ExpenseCategoryType | string;

// ── Strict Discriminated Union Types for Data & UI Layers ────────────────────

export type CoreTransactionData = {
  id?: string;
  date?: { seconds?: number } | string | number | Date;
  amount?: number;
  cashPaid?: number;
  remainingDue?: number;
  note?: string;
};

/** Farm Crop Stock Transaction (SALE or PURCHASE) — weightKg is required */
export type FarmStockTransactionData = CoreTransactionData & {
  type: 'SALE' | 'PURCHASE';
  category: CropType;
  weightKg: number;
  rate?: number;
  customerId?: string;
  customerName?: string;
  vendorName?: string;
  discount?: number;
};

/** Service Transaction (Pickup, Tractor, Labor, Commission, Transport) — purely fee/amount based, no weight or rate in UI */
export type ServiceTransactionData = CoreTransactionData & {
  type: 'SERVICE';
  category: ServiceType;
  customerId: string;
  customerName?: string;
  discount?: number;
};

/** Customer Payment Transaction */
export type PaymentTransactionData = CoreTransactionData & {
  type: 'PAYMENT';
  category?: string;
  customerId: string;
  customerName?: string;
  paymentAmount?: number;
  discount?: number;
};

/** Opening Balance Transaction */
export type OpeningBalanceTransactionData = CoreTransactionData & {
  type: 'OPENING_BALANCE';
  category?: string;
  customerId: string;
  customerName?: string;
};

/** Operating Expense Transaction */
export type ExpenseTransactionData = CoreTransactionData & {
  type: 'EXPENSE';
  category: ExpenseCategoryType;
  targetAssetId?: string;
  vendorName?: string;
};

/** Partner Dividend Transaction */
export type DividendTransactionData = CoreTransactionData & {
  type: 'DIVIDEND';
  category?: string;
  partnerName: string;
};

/** Union of all specific transaction variants */
export type TypedTransactionData =
  | FarmStockTransactionData
  | ServiceTransactionData
  | PaymentTransactionData
  | OpeningBalanceTransactionData
  | ExpenseTransactionData
  | DividendTransactionData;

/** General Transaction Data shape holding all possible ledger attributes */
export type TransactionData = {
  id?: string;
  type?: TransactionType;
  date?: { seconds?: number } | string | number | Date;
  amount?: number;
  cashPaid?: number;
  remainingDue?: number;
  note?: string;
  category?: string;
  weightKg?: number;
  rate?: number;
  customerId?: string;
  customerName?: string;
  paymentAmount?: number;
  discount?: number;
  vendorName?: string;
  partnerName?: string;
  targetAssetId?: string;
};

export type Transaction = TransactionData;

// ── Single Unified Domain Class: TransactionModel ────────────────────────────

export class TransactionModel {
  id?: string;
  type?: TransactionType;
  category?: string;
  date?: { seconds?: number } | string | number | Date;
  amount?: number;
  cashPaid?: number;
  remainingDue?: number;
  note?: string;
  weightKg?: number;
  rate?: number;
  customerId?: string;
  customerName?: string;
  paymentAmount?: number;
  discount?: number;
  vendorName?: string;
  partnerName?: string;
  targetAssetId?: string;

  constructor(data: TransactionData = {}) {
    this.id = data.id;
    this.type = data.type;
    this.category = data.category;
    this.date = data.date;
    this.amount = data.amount;
    this.cashPaid = data.cashPaid;
    this.remainingDue = data.remainingDue;
    this.note = data.note;
    this.weightKg = data.weightKg;
    this.rate = data.rate;
    this.customerId = data.customerId;
    this.customerName = data.customerName;
    this.paymentAmount = data.paymentAmount;
    this.discount = data.discount;
    this.vendorName = data.vendorName;
    this.partnerName = data.partnerName;
    this.targetAssetId = data.targetAssetId;
  }

  static from(data: TransactionData): TransactionModel {
    return data instanceof TransactionModel ? data : new TransactionModel(data);
  }

  // ── Instance type checks & narrowing guards ───────────────────────────────

  isFarmStock(): this is this & FarmStockTransactionData {
    return (
      (this.type === 'SALE' || this.type === 'PURCHASE') &&
      this.weightKg !== undefined &&
      this.weightKg > 0
    );
  }

  isSale(): this is this & { type: 'SALE' } {
    return this.type === 'SALE';
  }

  isPurchase(): this is this & { type: 'PURCHASE' } {
    return this.type === 'PURCHASE';
  }

  isService(): this is this & { type: 'SERVICE' } {
    return this.type === 'SERVICE';
  }

  isPayment(): this is this & { type: 'PAYMENT' } {
    return this.type === 'PAYMENT';
  }

  isOpeningBalance(): this is this & { type: 'OPENING_BALANCE' } {
    return this.type === 'OPENING_BALANCE';
  }

  isExpense(): this is this & { type: 'EXPENSE' } {
    return this.type === 'EXPENSE';
  }

  isDividend(): boolean {
    return (
      this.type === 'DIVIDEND' ||
      (this.type === 'EXPENSE' && this.category === 'Profit Distribution')
    );
  }

  isCustomerTransaction(): boolean {
    return (
      this.type === 'SALE' ||
      this.type === 'SERVICE' ||
      this.type === 'PAYMENT' ||
      this.type === 'OPENING_BALANCE'
    );
  }

  isOperationsTransaction(): boolean {
    return (
      this.type === 'PURCHASE' ||
      this.type === 'EXPENSE' ||
      this.type === 'DIVIDEND'
    );
  }

  isPickupService(): boolean {
    return this.type === 'SERVICE' && this.category === 'Pickup';
  }

  isFuel(): boolean {
    return this.type === 'EXPENSE' && this.category === 'Fuel';
  }

  isDiscount(): boolean {
    return this.type === 'EXPENSE' && this.category === 'Discount';
  }

  isDepreciation(): boolean {
    return this.type === 'EXPENSE' && this.category === 'Depreciation';
  }

  isCapitalInterest(): boolean {
    return this.type === 'EXPENSE' && this.category === 'Interest';
  }

  isGeneralOperatingExpense(): boolean {
    return (
      this.type === 'EXPENSE' &&
      this.category !== 'Fuel' &&
      this.category !== 'Depreciation' &&
      this.category !== 'Interest' &&
      this.category !== 'Profit Distribution'
    );
  }

  // ── Calculation helpers ───────────────────────────────────────────────────

  getEffectiveAmount(): number {
    if (this.isPayment()) {
      return Number(this.paymentAmount) || Number(this.amount) || 0;
    }
    return Number(this.amount) || 0;
  }

  // ── Static type checks (work on any object: plain data or class instance) ──

  static isSale(tx: { type?: string }): boolean {
    return tx.type === 'SALE';
  }

  static isPurchase(tx: { type?: string }): boolean {
    return tx.type === 'PURCHASE';
  }

  static isService(tx: { type?: string }): boolean {
    return tx.type === 'SERVICE';
  }

  static isPayment(tx: { type?: string }): boolean {
    return tx.type === 'PAYMENT';
  }

  static isOpeningBalance(tx: { type?: string }): boolean {
    return tx.type === 'OPENING_BALANCE';
  }

  static isExpense(tx: { type?: string }): boolean {
    return tx.type === 'EXPENSE';
  }

  static isDividend(tx: { type?: string; category?: string }): boolean {
    return (
      tx.type === 'DIVIDEND' ||
      (tx.type === 'EXPENSE' && tx.category === 'Profit Distribution')
    );
  }

  static isCustomerTransaction(tx: { type?: string }): boolean {
    return (
      tx.type === 'SALE' ||
      tx.type === 'SERVICE' ||
      tx.type === 'PAYMENT' ||
      tx.type === 'OPENING_BALANCE'
    );
  }

  static isOperationsTransaction(tx: { type?: string }): boolean {
    return (
      tx.type === 'PURCHASE' || tx.type === 'EXPENSE' || tx.type === 'DIVIDEND'
    );
  }

  static isPickupService(tx: { type?: string; category?: string }): boolean {
    return tx.type === 'SERVICE' && tx.category === 'Pickup';
  }

  static isFuel(tx: { type?: string; category?: string }): boolean {
    return tx.type === 'EXPENSE' && tx.category === 'Fuel';
  }

  static isDiscount(tx: { type?: string; category?: string }): boolean {
    return tx.type === 'EXPENSE' && tx.category === 'Discount';
  }

  static isDepreciation(tx: { type?: string; category?: string }): boolean {
    return tx.type === 'EXPENSE' && tx.category === 'Depreciation';
  }

  static isCapitalInterest(tx: { type?: string; category?: string }): boolean {
    return tx.type === 'EXPENSE' && tx.category === 'Interest';
  }

  static isGeneralOperatingExpense(tx: {
    type?: string;
    category?: string;
  }): boolean {
    return (
      tx.type === 'EXPENSE' &&
      tx.category !== 'Fuel' &&
      tx.category !== 'Depreciation' &&
      tx.category !== 'Interest' &&
      tx.category !== 'Profit Distribution'
    );
  }

  // ── Serialization & Deserialization ───────────────────────────────────────

  /**
   * Parse raw DB or CSV records into a single TransactionModel instance
   */
  static fromRaw(
    raw: RawRecord,
    id?: string,
    customerId?: string,
    customerName?: string,
  ): TransactionModel {
    const data: TransactionData = {
      id: parseOptionalString(id) || parseOptionalString(raw?.id),
      type: parseOptionalString(raw?.type) as TransactionType | undefined,
      category: parseOptionalString(raw?.category),
      date: parseOptionalIsoDate(raw?.date),
      amount: parseOptionalNumber(raw?.amount),
      cashPaid: parseOptionalNumber(raw?.cashPaid),
      remainingDue: parseOptionalNumber(raw?.remainingDue),
      note: parseOptionalString(raw?.note),
      weightKg: parseOptionalNumber(raw?.weightKg),
      rate: parseOptionalNumber(raw?.rate),
      customerId:
        parseOptionalString(customerId) || parseOptionalString(raw?.customerId),
      customerName:
        parseOptionalString(customerName) ||
        parseOptionalString(raw?.customerName),
      discount: parseOptionalNumber(raw?.discount),
      paymentAmount: parseOptionalNumber(raw?.paymentAmount),
      vendorName: parseOptionalString(raw?.vendorName),
      targetAssetId: parseOptionalString(raw?.targetAssetId),
      partnerName: parseOptionalString(raw?.partnerName),
    };

    return new TransactionModel(data);
  }

  /**
   * Convert instance to raw JSON record for Firestore or DB storage.
   */
  toRaw(): Record<string, unknown> {
    const raw: Record<string, unknown> = {};
    if (this.id) raw.id = this.id;
    if (this.type) raw.type = this.type;
    if (this.date) raw.date = this.date;
    if (this.category !== undefined) raw.category = this.category;
    if (this.amount !== undefined) raw.amount = this.amount;
    if (this.cashPaid !== undefined) raw.cashPaid = this.cashPaid;
    if (this.remainingDue !== undefined) raw.remainingDue = this.remainingDue;
    if (this.note) raw.note = this.note;
    if (this.weightKg !== undefined) raw.weightKg = this.weightKg;
    if (this.rate !== undefined) raw.rate = this.rate;
    if (this.customerId) raw.customerId = this.customerId;
    if (this.customerName) raw.customerName = this.customerName;
    if (this.discount !== undefined) raw.discount = this.discount;
    if (this.paymentAmount !== undefined)
      raw.paymentAmount = this.paymentAmount;
    if (this.vendorName) raw.vendorName = this.vendorName;
    if (this.targetAssetId) raw.targetAssetId = this.targetAssetId;
    if (this.partnerName) raw.partnerName = this.partnerName;
    return raw;
  }
}
