import {
  CustomerTransactionData,
  parseCustomerTransactionFromRaw,
  PaymentTransactionData,
  SaleTransactionData,
  serializeTransactionToRaw,
  ServiceTransactionData,
} from '../models';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from '../services/dbBridge';
import { RawRecord } from '../utils';

export async function fetchCustomerTransactions(
  customerId?: string,
): Promise<CustomerTransactionData[]> {
  const snapshot = await getDocs<Record<string, unknown>>(
    collection('customer_transactions'),
  );
  const items = snapshot.docs.map((d) =>
    parseCustomerTransactionFromRaw(d.data() || {}, d.id),
  );

  return customerId ? items.filter((t) => t.customerId === customerId) : items;
}

export async function fetchCustomerTransactionById(
  id: string,
): Promise<CustomerTransactionData | null> {
  const snapshot = await getDoc<Record<string, unknown>>(
    doc('customer_transactions', id),
  );
  if (!snapshot.exists()) return null;
  return parseCustomerTransactionFromRaw(snapshot.data() || {}, id);
}

/** Add a Customer Sale transaction (requires weight and customerId) */
export async function addSaleTransaction(
  data: SaleTransactionData,
): Promise<SaleTransactionData> {
  return addCustomerTransaction({ ...data, type: 'SALE' });
}

/** Add a Customer Service transaction (Pickup, Tractor, Labor, etc.) */
export async function addServiceTransaction(
  data: ServiceTransactionData,
): Promise<ServiceTransactionData> {
  return addCustomerTransaction({ ...data, type: 'SERVICE' });
}

/** Add a Customer Payment transaction */
export async function addPaymentTransaction(
  data: PaymentTransactionData,
): Promise<PaymentTransactionData> {
  return addCustomerTransaction({ ...data, type: 'PAYMENT' });
}

/**
 * Pure Database CRUD: Persists customer transaction to customer_transactions table.
 */
export async function addCustomerTransaction<T extends CustomerTransactionData>(
  data: T,
): Promise<T> {
  const generatedId = data.id || crypto.randomUUID();
  const txRecord: T = {
    ...data,
    id: generatedId,
  };

  await setDoc(doc('customer_transactions', generatedId), {
    ...serializeTransactionToRaw(txRecord),
    id: generatedId,
  });

  return txRecord;
}

/**
 * Pure Database CRUD: Updates customer transaction in customer_transactions table.
 */
export async function updateCustomerTransaction(
  id: string,
  data: Partial<CustomerTransactionData>,
): Promise<CustomerTransactionData> {
  const existingDoc = await getDoc<Record<string, unknown>>(
    doc('customer_transactions', id),
  );
  const existingData = parseCustomerTransactionFromRaw(
    existingDoc.data() || {},
    id,
  );
  const mergedRaw: RawRecord = {
    ...serializeTransactionToRaw(existingData),
    ...data,
    id,
  };
  const merged = parseCustomerTransactionFromRaw(mergedRaw, id);

  await updateDoc(
    doc('customer_transactions', id),
    serializeTransactionToRaw(merged),
  );
  return merged;
}

/**
 * Pure Database CRUD: Deletes customer transaction from customer_transactions table.
 */
export async function deleteCustomerTransaction(id: string): Promise<void> {
  await deleteDoc(doc('customer_transactions', id));
}
