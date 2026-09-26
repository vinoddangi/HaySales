import {
  ExpenseTransactionData,
  OperationsTransactionData,
  parseOperationsTransactionFromRaw,
  PurchaseTransactionData,
  serializeTransactionToRaw,
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

export async function fetchOperationTransactions(): Promise<
  OperationsTransactionData[]
> {
  const snapshot = await getDocs<Record<string, unknown>>(
    collection('operation_transactions'),
  );
  return snapshot.docs.map((d) =>
    parseOperationsTransactionFromRaw(d.data() || {}, d.id),
  );
}

export async function fetchOperationTransactionById(
  id: string,
): Promise<OperationsTransactionData | null> {
  const snapshot = await getDoc<Record<string, unknown>>(
    doc('operation_transactions', id),
  );
  if (!snapshot.exists()) return null;
  return parseOperationsTransactionFromRaw(snapshot.data() || {}, id);
}

/** Add a Crop Purchase transaction (requires weight and category) */
export async function addPurchaseTransaction(
  data: PurchaseTransactionData,
): Promise<PurchaseTransactionData> {
  return addOperationTransaction({ ...data, type: 'PURCHASE' });
}

/** Add an Operating Expense transaction */
export async function addExpenseTransaction(
  data: ExpenseTransactionData,
): Promise<ExpenseTransactionData> {
  return addOperationTransaction({ ...data, type: 'EXPENSE' });
}

/**
 * Polymorphic entrypoint to persist any operations transaction to DB.
 */
export async function addOperationTransaction<
  T extends OperationsTransactionData,
>(data: T): Promise<T> {
  const generatedId = data.id || crypto.randomUUID();
  const txRecord: T = {
    ...data,
    id: generatedId,
  };

  await setDoc(doc('operation_transactions', generatedId), {
    ...serializeTransactionToRaw(txRecord),
    id: generatedId,
  });

  return txRecord;
}

export async function updateOperationTransaction(
  id: string,
  data: Partial<OperationsTransactionData>,
): Promise<OperationsTransactionData> {
  const existingDoc = await getDoc<Record<string, unknown>>(
    doc('operation_transactions', id),
  );
  const existingData = parseOperationsTransactionFromRaw(
    existingDoc.data() || {},
    id,
  );
  const mergedRaw: RawRecord = {
    ...serializeTransactionToRaw(existingData),
    ...data,
    id,
  };
  const merged = parseOperationsTransactionFromRaw(mergedRaw, id);

  await updateDoc(
    doc('operation_transactions', id),
    serializeTransactionToRaw(merged),
  );
  return merged;
}

export async function deleteOperationTransaction(id: string): Promise<void> {
  await deleteDoc(doc('operation_transactions', id));
}
