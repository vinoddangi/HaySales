import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  increment,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../store/firebaseConfig';
import { Transaction } from '../types';

/**
 * Fetch all transactions across all customers and root purchases for complete data views
 */
export async function fetchAllTransactionsApi(): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  // 1. Fetch customer map for associating customer names
  const customerMap = new Map<string, string>();
  try {
    const custSnap = await getDocs(collection(db, 'customers'));
    custSnap.forEach((cDoc) => {
      const cData = cDoc.data();
      const cName = ((cData.name || cData.Name || '') as string).trim();
      if (cName) customerMap.set(cDoc.id, cName);
    });
  } catch (e) {
    console.warn('Error fetching customers map in transactions API:', e);
  }

  // 2. Fetch customer transactions from subcollections
  try {
    const colGroupRef = collectionGroup(db, 'transactions');
    const querySnapshot = await getDocs(colGroupRef);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const customerId = docSnap.ref.parent.parent?.id;
      const customerName =
        (customerId ? customerMap.get(customerId) : '') ||
        data.customerName ||
        '';
      transactions.push({
        id: docSnap.id,
        customerId,
        customerName,
        ...data,
      } as Transaction);
    });
  } catch (e) {
    console.warn(
      'Error fetching customer transactions in transactions API:',
      e,
    );
  }

  // 3. Fetch purchases & expenses from root 'purchases' collection
  try {
    const purchasesSnap = await getDocs(collection(db, 'purchases'));
    purchasesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      transactions.push({
        id: docSnap.id,
        type: (data.type || 'PURCHASE') as Transaction['type'],
        ...data,
      } as Transaction);
    });
  } catch (pErr) {
    console.warn('Error fetching purchases in transactions API:', pErr);
  }

  // Sort descending by date
  transactions.sort((a, b) => {
    const getTime = (d: any) => {
      if (!d) return 0;
      if (typeof d === 'object' && 'seconds' in d && d.seconds) {
        return d.seconds * 1000;
      }
      const parsed = new Date(d).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };
    return getTime(b.date) - getTime(a.date);
  });

  return transactions;
}

/**
 * Fetch transactions for a specific customer
 */
export async function fetchCustomerTransactionsApi(
  customerId: string,
  limitCount?: number,
): Promise<Transaction[]> {
  if (!customerId) return [];

  const colRef = collection(db, 'customers', customerId, 'transactions');
  const querySnapshot = await getDocs(colRef);
  const transactions: Transaction[] = [];

  querySnapshot.forEach((docSnap) => {
    transactions.push({
      id: docSnap.id,
      ...docSnap.data(),
    } as Transaction);
  });

  transactions.sort((a, b) => {
    const getTime = (d: any) => {
      if (!d) return 0;
      if (typeof d === 'object' && 'seconds' in d && d.seconds) {
        return d.seconds * 1000;
      }
      const parsed = new Date(d).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };
    return getTime(b.date) - getTime(a.date);
  });

  return limitCount && limitCount > 0
    ? transactions.slice(0, limitCount)
    : transactions;
}

export interface AddCustomerTransactionParams {
  customerId: string;
  type: 'SALE' | 'SERVICE' | 'PAYMENT';
  item?: string;
  weightKg?: number;
  amount?: number;
  discount?: number;
  cashPaid?: number;
  paymentAmount?: number;
  date?: Date | string;
  note?: string;
}

/**
 * Add a customer transaction with atomic customer balance update
 */
export async function addCustomerTransactionApi(
  data: AddCustomerTransactionParams,
): Promise<void> {
  const batch = writeBatch(db);
  const customerRef = doc(db, 'customers', data.customerId);
  const transactionColRef = collection(
    db,
    'customers',
    data.customerId,
    'transactions',
  );
  const newTxRef = doc(transactionColRef);

  let balanceChange = 0;
  const txData: any = {
    type: data.type,
    date: data.date ? new Date(data.date) : new Date(),
  };

  if (data.note) {
    txData.note = data.note;
  }

  if (data.type === 'SALE' || data.type === 'SERVICE') {
    const finalPrice = Math.max(0, (data.amount || 0) - (data.discount || 0));
    balanceChange = Math.max(0, finalPrice - (data.cashPaid || 0));

    txData.item = data.item;
    if (data.type === 'SALE') {
      txData.weightKg = data.weightKg;
    }
    txData.amount = data.amount;
    txData.discount = data.discount;
    txData.cashPaid = data.cashPaid;
    txData.remainingDue = balanceChange;
  } else if (data.type === 'PAYMENT') {
    balanceChange = -(data.paymentAmount || 0);
    txData.paymentAmount = data.paymentAmount;
  }

  batch.set(newTxRef, txData);

  if (balanceChange !== 0) {
    batch.set(
      customerRef,
      { outstandingAmount: increment(balanceChange) },
      { merge: true },
    );
  }

  await batch.commit();
}

/**
 * Update an existing customer transaction and recalculate balance
 */
export async function updateCustomerTransactionApi(
  customerId: string,
  transactionId: string,
  data: Partial<Transaction>,
): Promise<void> {
  const txRef = doc(db, 'customers', customerId, 'transactions', transactionId);
  const updateData: any = {};
  if (data.item !== undefined) updateData.item = data.item;
  if (data.weightKg !== undefined)
    updateData.weightKg = Number(data.weightKg) || 0;
  if (data.amount !== undefined) updateData.amount = Number(data.amount) || 0;
  if (data.discount !== undefined)
    updateData.discount = Number(data.discount) || 0;
  if (data.cashPaid !== undefined)
    updateData.cashPaid = Number(data.cashPaid) || 0;
  if (data.paymentAmount !== undefined)
    updateData.paymentAmount = Number(data.paymentAmount) || 0;
  if (data.date !== undefined) updateData.date = new Date(data.date as any);
  if (data.note !== undefined) updateData.note = data.note;

  if (data.type === 'SALE' || data.type === 'SERVICE') {
    const finalPrice = Math.max(
      0,
      (updateData.amount ?? 0) - (updateData.discount ?? 0),
    );
    updateData.remainingDue = Math.max(
      0,
      finalPrice - (updateData.cashPaid ?? 0),
    );
  }

  await updateDoc(txRef, updateData);

  // Re-aggregate and update customer running balance
  const txSnap = await getDocs(
    collection(db, 'customers', customerId, 'transactions'),
  );
  let balance = 0;
  txSnap.forEach((d) => {
    const t = d.data();
    if (t.type === 'PAYMENT') {
      balance -= Number(t.paymentAmount) || 0;
    } else {
      const credit =
        t.remainingDue !== undefined
          ? Number(t.remainingDue) || 0
          : (Number(t.amount) || 0) - (Number(t.cashPaid) || 0);
      balance += credit;
    }
  });

  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    outstandingAmount: Math.max(0, balance),
  });
}

/**
 * Delete a customer transaction and recalculate balance
 */
export async function deleteCustomerTransactionApi(
  customerId: string,
  transactionId: string,
): Promise<void> {
  const txRef = doc(db, 'customers', customerId, 'transactions', transactionId);
  await deleteDoc(txRef);

  // Re-aggregate customer balance
  const txSnap = await getDocs(
    collection(db, 'customers', customerId, 'transactions'),
  );
  let balance = 0;
  txSnap.forEach((d) => {
    const t = d.data();
    if (t.type === 'PAYMENT') {
      balance -= Number(t.paymentAmount) || 0;
    } else {
      const credit =
        t.remainingDue !== undefined
          ? Number(t.remainingDue) || 0
          : (Number(t.amount) || 0) - (Number(t.cashPaid) || 0);
      balance += credit;
    }
  });

  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    outstandingAmount: Math.max(0, balance),
  });
}
