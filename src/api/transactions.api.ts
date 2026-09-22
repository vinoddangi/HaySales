import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  increment,
  updateDoc,
  writeBatch,
} from '../services/dbBridge';
import { db } from '../store/firebaseConfig';
import { Transaction } from '../types';
import { parseTransactionDate } from '../utils/formatters';
import { parseTransaction } from '../utils/parsers';

/**
 * Fetch all transactions across all customers and root purchases for complete data views
 */
export async function fetchAllTransactionsApi(): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  // 1. Fetch customer map for associating customer names
  const customerMap = new Map<string, string>();
  let customerDocIds: string[] = [];
  try {
    const custSnap = await getDocs(collection(db, 'customers'));
    custSnap.forEach((cDoc) => {
      customerDocIds.push(cDoc.id);
      const cData = cDoc.data();
      const cName = ((cData.name || cData.Name || '') as string).trim();
      if (cName) customerMap.set(cDoc.id, cName);
    });
  } catch (e) {
    console.warn('Error fetching customers map in transactions API:', e);
  }

  // 2. Fetch customer transactions from subcollections
  let customerTxCount = 0;
  try {
    const colGroupRef = collectionGroup(db, 'transactions');
    const querySnapshot = await getDocs(colGroupRef);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const customerId = docSnap.ref.parent?.parent?.id || data.customerId;
      const customerName =
        (customerId ? customerMap.get(customerId) : '') ||
        data.customerName ||
        '';

      transactions.push(
        parseTransaction(data, docSnap.id, customerId, customerName),
      );
      customerTxCount++;
    });
  } catch (e) {
    console.warn(
      'Error fetching collectionGroup transactions in transactions API:',
      e,
    );
  }

  // Fallback: If collectionGroup returned 0 transactions but customers exist, fetch each customer's transactions
  if (customerTxCount === 0 && customerDocIds.length > 0) {
    try {
      for (const custId of customerDocIds) {
        const subSnap = await getDocs(
          collection(db, 'customers', custId, 'transactions'),
        );
        subSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const customerName =
            customerMap.get(custId) || data.customerName || '';
          transactions.push(
            parseTransaction(data, docSnap.id, custId, customerName),
          );
        });
      }
    } catch (fallbackErr) {
      console.warn(
        'Error fetching customer transactions via fallback:',
        fallbackErr,
      );
    }
  }

  // 3. Fetch purchases & expenses from root 'purchases' collection
  try {
    const purchasesSnap = await getDocs(collection(db, 'purchases'));
    purchasesSnap.forEach((docSnap) => {
      transactions.push(parseTransaction(docSnap.data(), docSnap.id));
    });
  } catch (pErr) {
    console.warn('Error fetching purchases in transactions API:', pErr);
  }

  // 4. Fetch expenses from root 'expenses' collection if present
  try {
    const expensesSnap = await getDocs(collection(db, 'expenses'));
    expensesSnap.forEach((docSnap) => {
      if (!transactions.some((t) => t.id === docSnap.id)) {
        transactions.push(
          parseTransaction({ ...docSnap.data(), type: 'EXPENSE' }, docSnap.id),
        );
      }
    });
  } catch {
    // Ignore if not present
  }

  // 5. Fetch services from root 'services' collection if present
  try {
    const servicesSnap = await getDocs(collection(db, 'services'));
    servicesSnap.forEach((docSnap) => {
      if (!transactions.some((t) => t.id === docSnap.id)) {
        transactions.push(
          parseTransaction({ ...docSnap.data(), type: 'SERVICE' }, docSnap.id),
        );
      }
    });
  } catch {
    // Ignore if not present
  }

  // Sort descending by date
  transactions.sort((a, b) => {
    const timeA = parseTransactionDate(a.date)?.getTime() || 0;
    const timeB = parseTransactionDate(b.date)?.getTime() || 0;
    return timeB - timeA;
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
    transactions.push(parseTransaction(docSnap.data(), docSnap.id, customerId));
  });

  transactions.sort((a, b) => {
    const timeA = parseTransactionDate(a.date)?.getTime() || 0;
    const timeB = parseTransactionDate(b.date)?.getTime() || 0;
    return timeB - timeA;
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
    const cashPaid = data.paymentAmount || 0;
    const discount = data.discount || 0;
    balanceChange = -(cashPaid + discount);
    txData.paymentAmount = cashPaid;
    txData.discount = discount;
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
    const t = parseTransaction(d.data(), d.id);
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
    const t = parseTransaction(d.data(), d.id);
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
