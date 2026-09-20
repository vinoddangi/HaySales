import { ExpenseCategoryType, Transaction } from '../../types';
import {
  parseIsoDate,
  parseNumber,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
} from './utils';

/**
 * Standard Transaction Entity Parser
 * Normalizes all transaction records (Sales, Payments, Services, Purchases, Expenses) from DB.
 */
export function parseTransaction(
  raw: any,
  id?: string,
  customerId?: string,
  customerName?: string,
): Transaction {
  const docId = parseString(id || raw?.id);
  const type: Transaction['type'] = raw?.type || 'SALE';
  const custId = customerId || parseOptionalString(raw?.customerId);
  const custName = customerName || parseOptionalString(raw?.customerName);

  return {
    id: docId,
    customerId: custId,
    customerName: custName,
    type,
    category: raw?.category,
    expenseCategory: raw?.expenseCategory as ExpenseCategoryType | undefined,
    date: parseIsoDate(raw?.date),
    item: parseString(raw?.item, type === 'SERVICE' ? 'Pickup' : 'Others'),
    weightKg: parseOptionalNumber(raw?.weightKg),
    amount: parseNumber(raw?.amount, 0),
    discount: parseOptionalNumber(raw?.discount),
    cashPaid: parseOptionalNumber(raw?.cashPaid),
    remainingDue: parseOptionalNumber(raw?.remainingDue),
    paymentAmount: parseOptionalNumber(raw?.paymentAmount),
    rate: parseOptionalNumber(raw?.rate),
    purchaseRate: parseOptionalNumber(raw?.purchaseRate),
    vendorName: parseOptionalString(raw?.vendorName),
    note: parseString(raw?.note, ''),
  };
}
