import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '../services/dbBridge';
import { db } from '../store/firebaseConfig';
import { Transaction } from '../types';
import { parseTransactionDate } from '../utils/formatters';
import { parseTransaction } from '../utils/parsers';

/**
 * Fetch all purchases and expenses from root collection
 */
export async function fetchPurchasesApi(): Promise<Transaction[]> {
  const querySnapshot = await getDocs(collection(db, 'purchases'));
  const purchases: Transaction[] = [];

  querySnapshot.forEach((docSnap) => {
    purchases.push(parseTransaction(docSnap.data(), docSnap.id));
  });

  // Also fetch from root 'expenses' if present
  try {
    const expensesSnap = await getDocs(collection(db, 'expenses'));
    expensesSnap.forEach((docSnap) => {
      if (!purchases.some((p) => p.id === docSnap.id)) {
        purchases.push(
          parseTransaction({ ...docSnap.data(), type: 'EXPENSE' }, docSnap.id),
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

export interface AddPurchaseParams {
  type: 'PURCHASE' | 'EXPENSE';
  category: 'Purchase' | 'Expense';
  item?: string;
  expenseCategory?: string;
  weightKg?: number;
  amount: number;
  cashPaid?: number;
  vendorName?: string;
  note?: string;
  date?: Date | string;
}

/**
 * Add a new purchase or expense transaction
 */
export async function addPurchaseApi(data: AddPurchaseParams): Promise<void> {
  const purchasesCol = collection(db, 'purchases');
  const amount = Number(data.amount) || 0;
  const cashPaid = Number(data.cashPaid) || 0;
  const remainingDue = Math.max(0, amount - cashPaid);

  const txData: any = {
    type: data.type,
    category: data.category,
    amount,
    cashPaid,
    remainingDue,
    date: data.date ? new Date(data.date) : new Date(),
  };

  if (data.type === 'PURCHASE') {
    txData.item = data.item;
    txData.weightKg = Number(data.weightKg) || 0;
    if (txData.weightKg > 0) {
      txData.purchaseRate = txData.amount / txData.weightKg;
    }
  } else if (data.type === 'EXPENSE') {
    txData.expenseCategory = data.expenseCategory || 'Others';
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
  if (data.item !== undefined) updateData.item = data.item;
  if (data.expenseCategory !== undefined)
    updateData.expenseCategory = data.expenseCategory;
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
    updateData.purchaseRate = updateData.amount / updateData.weightKg;
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
