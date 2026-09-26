import {
  addCustomerTransaction,
  addExpenseTransaction,
  deleteCustomerTransaction,
  deleteOperationTransaction,
  updateCustomerTransaction,
} from '../api';
import {
  CustomerTransactionData,
  ExpenseTransactionData,
  isPaymentTransaction,
} from '../models';
import { getNumberProp, getStringProp } from '../utils';

/**
 * Extracts a linked operating expense transaction (e.g. discount expense for double-entry)
 * from a customer transaction if one is required, otherwise returns undefined.
 *
 * Rule:
 * - When a customer PAYMENT has a discount > 0, double-entry bookkeeping requires
 *   an EXPENSE transaction under category 'Discount' in operation_transactions.
 * - For all other transactions (SALE, SERVICE, or PAYMENT with 0 discount),
 *   it returns undefined (single-entry).
 */
export function extractLinkedExpenseEntry(
  tx: CustomerTransactionData | Partial<CustomerTransactionData>,
  txIdFallback?: string,
): ExpenseTransactionData | undefined {
  const isPayment = isPaymentTransaction(tx) || tx.type === 'PAYMENT';
  const discountVal = getNumberProp(tx, 'discount', 0);
  const transactionId = tx.id || txIdFallback;

  if (isPayment && discountVal > 0 && transactionId) {
    const customerName = getStringProp(tx, 'customerName', '');
    return {
      id: `otx_disc_${transactionId}`,
      type: 'EXPENSE',
      category: 'Discount',
      date: tx.date || new Date().toISOString(),
      amount: discountVal,
      cashPaid: discountVal,
      remainingDue: 0,
      note: `Discount on Payment #${transactionId}${customerName ? ` (${customerName})` : ''}`,
    };
  }

  return undefined;
}

/**
 * Evaluates whether a transaction requires double-entry bookkeeping across tables.
 */
export function requiresDoubleEntry(
  tx: CustomerTransactionData | Partial<CustomerTransactionData>,
): boolean {
  return extractLinkedExpenseEntry(tx) !== undefined;
}

/**
 * Business Layer: Orchestrates persisting a customer transaction and managing
 * secondary double-entry operating expenses if needed.
 */
export async function createCustomerTransaction(
  data: CustomerTransactionData,
): Promise<CustomerTransactionData> {
  const model = await addCustomerTransaction(data);

  const linkedExpense = extractLinkedExpenseEntry(data, model.id);
  if (linkedExpense) {
    await addExpenseTransaction(linkedExpense);
  }

  return model;
}

/**
 * Business Layer: Orchestrates updating a customer transaction and synchronizing
 * the linked double-entry discount expense in operation_transactions.
 */
export async function updateCustomerTransactionWithDoubleEntry(
  id: string,
  data: Partial<CustomerTransactionData>,
): Promise<CustomerTransactionData> {
  const updatedModel = await updateCustomerTransaction(id, data);

  const linkedExpense = extractLinkedExpenseEntry(updatedModel, id);
  const linkedDiscId = `otx_disc_${id}`;

  if (linkedExpense) {
    await addExpenseTransaction(linkedExpense);
  } else {
    await deleteOperationTransaction(linkedDiscId);
  }

  return updatedModel;
}

/**
 * Business Layer: Orchestrates deleting a customer transaction and removing
 * any linked double-entry discount expense.
 */
export async function deleteCustomerTransactionWithDoubleEntry(
  id: string,
): Promise<void> {
  await deleteCustomerTransaction(id);
  const linkedDiscId = `otx_disc_${id}`;
  await deleteOperationTransaction(linkedDiscId);
}
