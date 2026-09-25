import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '../services/dbBridge';
import { db } from '../store/firebaseConfig';
import {
  OperationsCategoryType,
  Transaction,
  TransactionModel,
} from '../types';
import { parseTransactionDate } from '../utils/formatters';

/**
 * Fetch all purchases and expenses from root collection
 */
export async function fetchPurchasesApi(): Promise<Transaction[]> {
  const querySnapshot = await getDocs(collection(db, 'purchases'));
  const purchases: Transaction[] = [];

  querySnapshot.forEach((docSnap) => {
    purchases.push(TransactionModel.fromRaw(docSnap.data(), docSnap.id));
  });

  // Also fetch from root 'expenses' if present
  try {
    const expensesSnap = await getDocs(collection(db, 'expenses'));
    expensesSnap.forEach((docSnap) => {
      if (!purchases.some((p) => p.id === docSnap.id)) {
        purchases.push(
          TransactionModel.fromRaw(
            { ...docSnap.data(), type: 'EXPENSE' },
            docSnap.id,
          ),
        );
      }
    });
  } catch {
    // Ignore if not present
  }

  purchases.sort((a, b) => {
    const timeA = parseTransactionDate(a.date)?.getTime() || 0;
    const timeB = parseTransactionDate(b.date)?.getTime() || 0;
    return timeB - timeA;
  });

  return purchases;
}

export type AddPurchaseParams = Partial<Transaction> & {
  type: 'PURCHASE' | 'EXPENSE' | 'DIVIDEND';
  amount: number;
};

/**
 * Add a new purchase or expense transaction
 */
export async function addPurchaseApi(data: AddPurchaseParams): Promise<void> {
  const purchasesCol = collection(db, 'purchases');
  const amount = Number(data.amount) || 0;
  const cashPaid = Number(data.cashPaid) || 0;
  const remainingDue = Math.max(0, amount - cashPaid);

  const category = (data.category || 'Others') as OperationsCategoryType;
  const txData: any = {
    type: data.type,
    category,
    amount,
    cashPaid,
    remainingDue,
    date: data.date ? new Date(data.date as any) : new Date(),
  };

  if (data.type === 'PURCHASE') {
    txData.weightKg = Number(data.weightKg) || 0;
    if (txData.weightKg > 0) {
      txData.rate = txData.amount / txData.weightKg;
    }
  }

  if (data.vendorName) txData.vendorName = data.vendorName;
  if (data.note) txData.note = data.note;

  await addDoc(purchasesCol, txData);
}

/**
 * Update an existing purchase or expense transaction
 */
export async function updatePurchaseApi(
  id: string,
  data: Partial<Transaction>,
): Promise<void> {
  const pRef = doc(db, 'purchases', id);
  const updateData: any = {};
  if (data.category !== undefined) {
    updateData.category = data.category;
  }
  if (data.weightKg !== undefined)
    updateData.weightKg = Number(data.weightKg) || 0;
  if (data.amount !== undefined) updateData.amount = Number(data.amount) || 0;
  if (data.cashPaid !== undefined)
    updateData.cashPaid = Number(data.cashPaid) || 0;
  if (data.vendorName !== undefined) updateData.vendorName = data.vendorName;
  if (data.note !== undefined) updateData.note = data.note;
  if (data.date !== undefined) updateData.date = new Date(data.date as any);

  if (
    data.type === 'PURCHASE' &&
    updateData.weightKg > 0 &&
    updateData.amount > 0
  ) {
    updateData.rate = updateData.amount / updateData.weightKg;
  }

  await updateDoc(pRef, updateData);
}

/**
 * Delete a purchase or expense transaction
 */
export async function deletePurchaseApi(id: string): Promise<void> {
  const pRef = doc(db, 'purchases', id);
  await deleteDoc(pRef);
}
