import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import customersCsvRaw from '../mock/csv/customers.csv?raw';
import expensesCsvRaw from '../mock/csv/expenses.csv?raw';
import paymentsCsvRaw from '../mock/csv/payments.csv?raw';
import purchasesCsvRaw from '../mock/csv/purchases.csv?raw';
import salesCsvRaw from '../mock/csv/sales.csv?raw';
import servicesCsvRaw from '../mock/csv/services.csv?raw';
import { db } from '../store/firebaseConfig';
import { Customer, Transaction } from '../types';
import {
  convertToCsv,
  CsvColumn,
  parseCsv,
  triggerCsvDownload,
} from '../utils/csvExport';

export type BackupCsvType =
  | 'customers'
  | 'transactions'
  | 'purchases'
  | 'monthly_rollout'
  // Legacy types for compatibility:
  | 'sales'
  | 'payments'
  | 'services'
  | 'expenses';

export interface CsvExportResult {
  fileName: string;
  type: BackupCsvType;
  recordCount: number;
  csvContent: string;
}

export interface RestoreCsvResult {
  type: BackupCsvType;
  totalParsed: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

import { parseTransactionDate } from '../utils/formatters';

function formatDateForCsv(dateVal: unknown): string {
  if (!dateVal) return '';
  const parsed = parseTransactionDate(dateVal as any);
  if (parsed) {
    return parsed.toISOString();
  }
  return String(dateVal);
}

// 1. Columns definition for Customers (/customers collection)
export const customerCsvColumns: CsvColumn<Customer>[] = [
  { header: 'CustomerID', accessor: (c) => c.id },
  { header: 'CustomerName', accessor: (c) => c.name },
  { header: 'Mobile', accessor: (c) => c.mobile || '' },
  { header: 'Village', accessor: (c) => c.village || '' },
  { header: 'CreditLimit', accessor: (c) => c.creditLimit || 35000 },
  { header: 'OutstandingAmount', accessor: (c) => c.outstandingAmount || 0 },
];

// 2. Columns definition for Customer Transactions (/customers/{id}/transactions subcollections)
export const transactionCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'TransactionID', accessor: (t) => t.id || '' },
  { header: 'CustomerID', accessor: (t) => t.customerId || '' },
  { header: 'CustomerName', accessor: (t) => t.customerName || '' },
  { header: 'Type', accessor: (t) => t.type || 'SALE' },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  {
    header: 'Item',
    accessor: (t) => t.item || (t.type === 'SERVICE' ? 'Pickup' : 'Others'),
  },
  {
    header: 'Category',
    accessor: (t) => t.category || (t.type === 'SERVICE' ? 'Services' : ''),
  },
  { header: 'WeightKg', accessor: (t) => t.weightKg || 0 },
  { header: 'Rate', accessor: (t) => t.rate || 0 },
  { header: 'Amount', accessor: (t) => t.amount || t.paymentAmount || 0 },
  { header: 'CashPaid', accessor: (t) => t.cashPaid || 0 },
  { header: 'RemainingDue', accessor: (t) => t.remainingDue || 0 },
  { header: 'Discount', accessor: (t) => t.discount || 0 },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

// 3. Columns definition for Purchases & Farm Expenses (/purchases collection)
export const purchasesCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'PurchaseID', accessor: (t) => t.id || '' },
  { header: 'Type', accessor: (t) => t.type || 'PURCHASE' },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  {
    header: 'Category',
    accessor: (t) =>
      t.category ||
      t.expenseCategory ||
      (t.type === 'EXPENSE' ? 'Others' : 'Purchase'),
  },
  { header: 'ExpenseCategory', accessor: (t) => t.expenseCategory || '' },
  { header: 'Item', accessor: (t) => t.item || 'Others' },
  { header: 'WeightKg', accessor: (t) => t.weightKg || 0 },
  { header: 'PurchaseRate', accessor: (t) => t.purchaseRate || t.rate || 0 },
  { header: 'Amount', accessor: (t) => t.amount || 0 },
  { header: 'VendorName', accessor: (t) => t.vendorName || '' },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

// Legacy column definitions kept for backwards compatibility
export const salesCsvColumns: CsvColumn<Transaction>[] = transactionCsvColumns;
export const paymentsCsvColumns: CsvColumn<Transaction>[] =
  transactionCsvColumns;
export const servicesCsvColumns: CsvColumn<Transaction>[] =
  transactionCsvColumns;
export const expensesCsvColumns: CsvColumn<Transaction>[] = purchasesCsvColumns;

/**
 * Exports all live data from Firestore as formatted CSV datasets (1:1 exact match to Firestore tables)
 */
export async function exportAllDataAsCsv(): Promise<
  Record<
    'customers' | 'transactions' | 'purchases' | 'monthly_rollout',
    CsvExportResult
  >
> {
  const timestamp = new Date().toISOString().split('T')[0];

  // 1. Fetch Customers & Customer Transactions (/customers & /customers/{id}/transactions)
  const custSnap = await getDocs(collection(db, 'customers'));
  const customers: Customer[] = [];
  const transactions: Transaction[] = [];

  for (const docSnap of custSnap.docs) {
    const cData = docSnap.data();
    const cust: Customer = {
      id: docSnap.id,
      name: cData.name || '',
      mobile: cData.mobile || '',
      village: cData.village || '',
      creditLimit: cData.creditLimit,
      outstandingAmount: cData.outstandingAmount || 0,
    };
    customers.push(cust);

    // Fetch customer transactions subcollection
    const txSnap = await getDocs(
      collection(db, 'customers', docSnap.id, 'transactions'),
    );
    txSnap.forEach((tDoc) => {
      const data = tDoc.data();
      const rawType = (data.type || data.category || 'SALE')
        .toString()
        .toUpperCase();
      let type: Transaction['type'] = 'SALE';
      if (rawType.includes('SERVICE')) type = 'SERVICE';
      else if (rawType.includes('PAYMENT')) type = 'PAYMENT';
      else if (rawType.includes('OPENING')) type = 'OPENING_BALANCE';
      else if (rawType.includes('EXPENSE')) type = 'EXPENSE';
      else if (rawType.includes('PURCHASE')) type = 'PURCHASE';

      const t = {
        id: tDoc.id,
        customerId: docSnap.id,
        customerName: cust.name,
        ...data,
        type,
      } as Transaction;
      transactions.push(t);
    });
  }

  // 2. Fetch All Purchases & Expenses (/purchases collection)
  const purchasesSnap = await getDocs(collection(db, 'purchases'));
  const purchases: Transaction[] = [];

  purchasesSnap.forEach((pDoc) => {
    const data = pDoc.data();
    const rawType = (data.type || data.category || 'PURCHASE')
      .toString()
      .toUpperCase();
    const type: Transaction['type'] = rawType.includes('EXPENSE')
      ? 'EXPENSE'
      : 'PURCHASE';
    const p = { id: pDoc.id, ...data, type } as Transaction;
    purchases.push(p);
  });

  // Convert exact database tables to CSV
  const customersCsv = convertToCsv(customers, customerCsvColumns);
  const transactionsCsv = convertToCsv(transactions, transactionCsvColumns);
  const purchasesCsv = convertToCsv(purchases, purchasesCsvColumns);

  return {
    customers: {
      fileName: `customers_${timestamp}.csv`,
      type: 'customers',
      recordCount: customers.length,
      csvContent: customersCsv,
    },
    transactions: {
      fileName: `transactions_${timestamp}.csv`,
      type: 'transactions',
      recordCount: transactions.length,
      csvContent: transactionsCsv,
    },
    purchases: {
      fileName: `purchases_${timestamp}.csv`,
      type: 'purchases',
      recordCount: purchases.length,
      csvContent: purchasesCsv,
    },
    monthly_rollout: {
      fileName: `monthly_rollout_${timestamp}.csv`,
      type: 'monthly_rollout',
      recordCount: 8,
      csvContent: convertToCsv(
        [
          { month: '2026-01', period: '2026_01', status: 'LOCKED' },
          { month: '2026-02', period: '2026_02', status: 'LOCKED' },
          { month: '2026-03', period: '2026_03', status: 'LOCKED' },
          { month: '2026-04', period: '2026_04', status: 'LOCKED' },
          { month: '2026-05', period: '2026_05', status: 'LOCKED' },
          { month: '2026-06', period: '2026_06', status: 'LOCKED' },
          { month: '2026-07', period: '2026_07', status: 'LOCKED' },
          { month: '2026-08', period: '2026_08', status: 'LOCKED' },
        ],
        [
          { header: 'Month', accessor: (m) => m.month },
          { header: 'PeriodKey', accessor: (m) => m.period },
          { header: 'LockStatus', accessor: (m) => m.status },
        ],
      ),
    },
  };
}

/**
 * Fetches all live entities from Firestore for syncing to Mock Store
 */
export async function fetchLiveEntitiesForMock(): Promise<{
  customers: Customer[];
  transactions: Transaction[];
  purchases: Transaction[];
}> {
  const custSnap = await getDocs(collection(db, 'customers'));
  const customers: Customer[] = [];
  const transactions: Transaction[] = [];

  for (const docSnap of custSnap.docs) {
    const cData = docSnap.data();
    const cust: Customer = {
      id: docSnap.id,
      name: cData.name || '',
      mobile: cData.mobile || '',
      village: cData.village || '',
      creditLimit: cData.creditLimit,
      outstandingAmount: cData.outstandingAmount || 0,
    };
    customers.push(cust);

    const txSnap = await getDocs(
      collection(db, 'customers', docSnap.id, 'transactions'),
    );
    txSnap.forEach((tDoc) => {
      transactions.push({
        id: tDoc.id,
        customerId: docSnap.id,
        customerName: cust.name,
        ...tDoc.data(),
      } as Transaction);
    });
  }

  const purchasesSnap = await getDocs(collection(db, 'purchases'));
  const purchases: Transaction[] = [];
  purchasesSnap.forEach((pDoc) => {
    purchases.push({ id: pDoc.id, ...pDoc.data() } as Transaction);
  });

  return { customers, transactions, purchases };
}

/**
 * Downloads all CSV backups directly in browser
 */
export async function downloadAllCsvBackups(): Promise<number> {
  const exports = await exportAllDataAsCsv();
  let totalCount = 0;

  for (const item of Object.values(exports)) {
    if (item.csvContent) {
      triggerCsvDownload(item.csvContent, item.fileName);
      totalCount += item.recordCount;
    }
  }

  return totalCount;
}

/**
 * Downloads a single dataset as CSV
 */
export async function downloadSingleDatasetCsv(
  type: 'customers' | 'transactions' | 'purchases' | 'monthly_rollout',
): Promise<CsvExportResult> {
  const allExports = await exportAllDataAsCsv();
  const target = allExports[type];
  if (target && target.csvContent) {
    triggerCsvDownload(target.csvContent, target.fileName);
  }
  return target;
}

/**
 * Restores dataset from an uploaded CSV string into Firestore
 */
export async function restoreFromCsvApi(
  type: BackupCsvType,
  csvText: string,
): Promise<RestoreCsvResult> {
  const parsedRows = parseCsv(csvText);
  if (parsedRows.length < 2) {
    throw new Error('CSV file is empty or missing data rows.');
  }

  const headers = parsedRows[0].map((h) => h.toLowerCase());
  const dataRows = parsedRows.slice(1);
  const errors: string[] = [];
  let successCount = 0;

  const BATCH_SIZE = 400;

  if (type === 'customers') {
    const idIdx = headers.indexOf('customerid');
    const nameIdx = headers.indexOf('customername');
    const mobIdx = headers.indexOf('mobile');
    const vilIdx = headers.indexOf('village');
    const limitIdx = headers.indexOf('creditlimit');
    const outIdx = headers.indexOf('outstandingamount');

    if (nameIdx === -1) {
      throw new Error('CSV missing required header: CustomerName');
    }

    let batch = writeBatch(db);
    let batchCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const name = row[nameIdx];
      if (!name) continue;

      const docId = idIdx !== -1 && row[idIdx] ? row[idIdx] : String(i + 1);
      const custRef = doc(db, 'customers', docId);

      const customerData: Partial<Customer> = {
        name,
        mobile: mobIdx !== -1 ? row[mobIdx] : '',
        village: vilIdx !== -1 ? row[vilIdx] : '',
        creditLimit: limitIdx !== -1 ? Number(row[limitIdx]) || 35000 : 35000,
        outstandingAmount: outIdx !== -1 ? Number(row[outIdx]) || 0 : 0,
      };

      batch.set(custRef, customerData, { merge: true });
      batchCount++;
      successCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  } else if (type === 'purchases' || type === 'expenses') {
    const idIdx =
      headers.indexOf(type === 'purchases' ? 'purchaseid' : 'expenseid') !== -1
        ? headers.indexOf(type === 'purchases' ? 'purchaseid' : 'expenseid')
        : headers.indexOf('id');
    const typeIdx = headers.indexOf('type');
    const dateIdx = headers.indexOf('date');
    const itemIdx = headers.indexOf('item');
    const amtIdx = headers.indexOf('amount');
    const wtIdx = headers.indexOf('weightkg');
    const rateIdx =
      headers.indexOf('purchaserate') !== -1
        ? headers.indexOf('purchaserate')
        : headers.indexOf('rate');
    const catIdx = headers.indexOf('category');
    const expCatIdx = headers.indexOf('expensecategory');
    const vendorIdx = headers.indexOf('vendorname');
    const noteIdx =
      headers.indexOf('notes') !== -1
        ? headers.indexOf('notes')
        : headers.indexOf('note');

    let batch = writeBatch(db);
    let batchCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rawType =
        typeIdx !== -1 && row[typeIdx] ? row[typeIdx].toUpperCase() : '';
      const docId =
        idIdx !== -1 && row[idIdx] ? row[idIdx] : `${type}_${Date.now()}_${i}`;

      const isExpense =
        type === 'expenses' ||
        rawType.includes('EXPENSE') ||
        docId.startsWith('expense_');
      const resolvedType: Transaction['type'] = isExpense
        ? 'EXPENSE'
        : 'PURCHASE';
      const amount = amtIdx !== -1 ? Number(row[amtIdx]) || 0 : 0;
      const pRef = doc(db, 'purchases', docId);

      const record: Record<string, unknown> = {
        type: resolvedType,
        date:
          dateIdx !== -1 && row[dateIdx]
            ? row[dateIdx]
            : new Date().toISOString(),
        item: itemIdx !== -1 && row[itemIdx] ? row[itemIdx] : 'Others',
        amount,
        note: noteIdx !== -1 ? row[noteIdx] : '',
      };

      if (!isExpense) {
        record.category =
          catIdx !== -1 && row[catIdx] ? row[catIdx] : 'Purchase';
        record.weightKg = wtIdx !== -1 ? Number(row[wtIdx]) || 0 : 0;
        record.purchaseRate = rateIdx !== -1 ? Number(row[rateIdx]) || 0 : 0;
        record.vendorName = vendorIdx !== -1 ? row[vendorIdx] : '';
      } else {
        record.expenseCategory =
          expCatIdx !== -1 && row[expCatIdx]
            ? row[expCatIdx]
            : catIdx !== -1 && row[catIdx]
              ? row[catIdx]
              : 'Others';
      }

      batch.set(pRef, record, { merge: true });
      batchCount++;
      successCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  } else {
    // Customer Transactions: transactions (or legacy sales / payments / services)
    const custIdIdx = headers.indexOf('customerid');
    const idIdx =
      headers.indexOf('transactionid') !== -1
        ? headers.indexOf('transactionid')
        : headers.indexOf('paymentid') !== -1
          ? headers.indexOf('paymentid')
          : headers.indexOf('serviceid') !== -1
            ? headers.indexOf('serviceid')
            : headers.indexOf('id');
    const typeIdx = headers.indexOf('type');
    const dateIdx = headers.indexOf('date');
    const amtIdx =
      headers.indexOf('amount') !== -1
        ? headers.indexOf('amount')
        : headers.indexOf('amountpaid') !== -1
          ? headers.indexOf('amountpaid')
          : headers.indexOf('totalamount');
    const wtIdx = headers.indexOf('weightkg');
    const rateIdx = headers.indexOf('rate');
    const cashIdx = headers.indexOf('cashpaid');
    const dueIdx = headers.indexOf('remainingdue');
    const discIdx = headers.indexOf('discount');
    const itemIdx = headers.indexOf('item');
    const catIdx = headers.indexOf('category');
    const noteIdx =
      headers.indexOf('notes') !== -1
        ? headers.indexOf('notes')
        : headers.indexOf('note');

    let batch = writeBatch(db);
    let batchCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const custId =
        custIdIdx !== -1 && row[custIdIdx]
          ? row[custIdIdx]
          : type === 'services'
            ? '307'
            : '1';
      const docId =
        idIdx !== -1 && row[idIdx] ? row[idIdx] : `tx_${Date.now()}_${i}`;
      const txRef = doc(db, 'customers', custId, 'transactions', docId);

      const parsedAmount = amtIdx !== -1 ? Number(row[amtIdx]) || 0 : 0;
      const rawType =
        typeIdx !== -1 && row[typeIdx] ? row[typeIdx].toUpperCase() : '';

      let txType: Transaction['type'] = 'SALE';
      if (rawType.includes('SERVICE') || type === 'services')
        txType = 'SERVICE';
      else if (rawType.includes('PAYMENT') || type === 'payments')
        txType = 'PAYMENT';
      else if (rawType.includes('OPENING')) txType = 'OPENING_BALANCE';
      else if (rawType.includes('EXPENSE')) txType = 'EXPENSE';
      else if (rawType.includes('PURCHASE')) txType = 'PURCHASE';

      const txRecord: Record<string, unknown> = {
        type: txType,
        date:
          dateIdx !== -1 && row[dateIdx]
            ? row[dateIdx]
            : new Date().toISOString(),
        amount: parsedAmount,
        note: noteIdx !== -1 ? row[noteIdx] : '',
      };

      if (txType === 'SALE') {
        txRecord.item =
          itemIdx !== -1 && row[itemIdx] ? row[itemIdx] : 'Others';
        txRecord.weightKg = wtIdx !== -1 ? Number(row[wtIdx]) || 0 : 0;
        txRecord.rate = rateIdx !== -1 ? Number(row[rateIdx]) || 0 : 0;
        txRecord.cashPaid = cashIdx !== -1 ? Number(row[cashIdx]) || 0 : 0;
        txRecord.remainingDue =
          dueIdx !== -1
            ? Number(row[dueIdx]) || 0
            : Math.max(0, parsedAmount - (Number(txRecord.cashPaid) || 0));
        txRecord.discount = discIdx !== -1 ? Number(row[discIdx]) || 0 : 0;
      } else if (txType === 'SERVICE') {
        txRecord.item =
          itemIdx !== -1 && row[itemIdx] ? row[itemIdx] : 'Pickup';
        txRecord.category =
          catIdx !== -1 && row[catIdx] ? row[catIdx] : 'Services';
        txRecord.cashPaid =
          cashIdx !== -1 ? Number(row[cashIdx]) || parsedAmount : parsedAmount;
      } else if (txType === 'PAYMENT') {
        txRecord.paymentAmount = parsedAmount;
      }

      batch.set(txRef, txRecord, { merge: true });
      batchCount++;
      successCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  }

  return {
    type,
    totalParsed: dataRows.length,
    successCount,
    failedCount: dataRows.length - successCount,
    errors,
  };
}

/**
 * Restores all 6 bundled CSV datasets into live Firestore in one operation
 */
export async function restoreAllBundledCsvsToFirestoreApi(): Promise<{
  totalRestored: number;
  breakdown: Record<BackupCsvType, number>;
}> {
  const custRes = await restoreFromCsvApi('customers', customersCsvRaw);
  const salesRes = await restoreFromCsvApi('sales', salesCsvRaw);
  const paymentsRes = await restoreFromCsvApi('payments', paymentsCsvRaw);
  const servicesRes = await restoreFromCsvApi('services', servicesCsvRaw);
  const purchasesRes = await restoreFromCsvApi('purchases', purchasesCsvRaw);
  const expensesRes = await restoreFromCsvApi('expenses', expensesCsvRaw);

  const total =
    custRes.successCount +
    salesRes.successCount +
    paymentsRes.successCount +
    servicesRes.successCount +
    purchasesRes.successCount +
    expensesRes.successCount;

  return {
    totalRestored: total,
    breakdown: {
      customers: custRes.successCount,
      transactions:
        salesRes.successCount +
        paymentsRes.successCount +
        servicesRes.successCount,
      sales: salesRes.successCount,
      payments: paymentsRes.successCount,
      services: servicesRes.successCount,
      purchases: purchasesRes.successCount,
      expenses: expensesRes.successCount,
      monthly_rollout: 8,
    },
  };
}

/**
 * Clears all customer, transaction, purchase, and yearly archive documents from Firestore
 */
export async function clearAllFirestoreDataApi(): Promise<void> {
  const BATCH_SIZE = 400;
  const currentYear = new Date().getFullYear();
  const archiveYears = [2023, 2024, 2025, 2026, currentYear - 1, currentYear];

  // 1. Delete all customers, active transactions & historical yearly subcollections
  const custSnap = await getDocs(collection(db, 'customers'));
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const docSnap of custSnap.docs) {
    // A. Active transactions subcollection
    const txSnap = await getDocs(
      collection(db, 'customers', docSnap.id, 'transactions'),
    );
    for (const tDoc of txSnap.docs) {
      batch.delete(tDoc.ref);
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    // B. Legacy subcollections (transactions-YYYY) if any
    for (const year of archiveYears) {
      const archSnap = await getDocs(
        collection(db, 'customers', docSnap.id, `transactions-${year}`),
      );
      for (const aDoc of archSnap.docs) {
        batch.delete(aDoc.ref);
        batchCount++;
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    // C. Customer doc
    batch.delete(docSnap.ref);
    batchCount++;
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // 2. Delete yearly archive customer collections: customers-(YYYY) and their transactions
  for (const year of archiveYears) {
    const archCustSnap = await getDocs(collection(db, `customers-${year}`));
    for (const acDoc of archCustSnap.docs) {
      const acTxSnap = await getDocs(
        collection(db, `customers-${year}`, acDoc.id, 'transactions'),
      );
      for (const tDoc of acTxSnap.docs) {
        batch.delete(tDoc.ref);
        batchCount++;
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
      batch.delete(acDoc.ref);
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  // 3. Delete all active purchases
  const purchasesSnap = await getDocs(collection(db, 'purchases'));
  for (const pDoc of purchasesSnap.docs) {
    batch.delete(pDoc.ref);
    batchCount++;
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // 4. Delete historical yearly purchases collections (e.g., purchases-2025, purchases-2024)
  for (const year of archiveYears) {
    const archPurchSnap = await getDocs(collection(db, `purchases-${year}`));
    for (const apDoc of archPurchSnap.docs) {
      batch.delete(apDoc.ref);
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  // 5. Reset backup_status metadata doc
  try {
    batch.delete(doc(db, 'metadata', 'backup_status'));
    batchCount++;
  } catch {
    // Ignore if not present
  }

  if (batchCount > 0) {
    await batch.commit();
  }
}
