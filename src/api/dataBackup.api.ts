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
  | 'sales'
  | 'payments'
  | 'purchases'
  | 'expenses'
  | 'services'
  | 'monthly_rollout';

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

function formatDateForCsv(dateVal: unknown): string {
  if (!dateVal) return '';
  if (
    typeof dateVal === 'object' &&
    'seconds' in (dateVal as Record<string, unknown>)
  ) {
    const sec = (dateVal as { seconds: number }).seconds;
    return new Date(sec * 1000).toISOString();
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString();
  }
  return String(dateVal);
}

// Columns definition for Customers
export const customerCsvColumns: CsvColumn<Customer>[] = [
  { header: 'CustomerID', accessor: (c) => c.id },
  { header: 'CustomerName', accessor: (c) => c.name },
  { header: 'Mobile', accessor: (c) => c.mobile || '' },
  { header: 'Village', accessor: (c) => c.village || '' },
  { header: 'CreditLimit', accessor: (c) => c.creditLimit || 35000 },
  { header: 'OutstandingAmount', accessor: (c) => c.outstandingAmount || 0 },
];

// Columns definition for Sales
export const salesCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'TransactionID', accessor: (t) => t.id || '' },
  { header: 'CustomerID', accessor: (t) => t.customerId || '' },
  { header: 'CustomerName', accessor: (t) => t.customerName || '' },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  { header: 'Item', accessor: (t) => t.item || 'Others' },
  { header: 'WeightKg', accessor: (t) => t.weightKg || 0 },
  { header: 'Rate', accessor: (t) => t.rate || 0 },
  { header: 'TotalAmount', accessor: (t) => t.amount || 0 },
  { header: 'CashPaid', accessor: (t) => t.cashPaid || 0 },
  { header: 'RemainingDue', accessor: (t) => t.remainingDue || 0 },
  { header: 'Discount', accessor: (t) => t.discount || 0 },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

// Columns definition for Payments
export const paymentsCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'PaymentID', accessor: (t) => t.id || '' },
  { header: 'CustomerID', accessor: (t) => t.customerId || '' },
  { header: 'CustomerName', accessor: (t) => t.customerName || '' },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  { header: 'AmountPaid', accessor: (t) => t.amount || t.paymentAmount || 0 },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

// Columns definition for Purchases
export const purchasesCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'PurchaseID', accessor: (t) => t.id || '' },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  { header: 'Category', accessor: (t) => t.category || 'Purchase' },
  { header: 'Item', accessor: (t) => t.item || 'Others' },
  { header: 'WeightKg', accessor: (t) => t.weightKg || 0 },
  { header: 'PurchaseRate', accessor: (t) => t.purchaseRate || t.rate || 0 },
  { header: 'Amount', accessor: (t) => t.amount || 0 },
  { header: 'VendorName', accessor: (t) => t.vendorName || '' },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

// Columns definition for Expenses
export const expensesCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'ExpenseID', accessor: (t) => t.id || '' },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  { header: 'ExpenseCategory', accessor: (t) => t.expenseCategory || 'Others' },
  { header: 'Item', accessor: (t) => t.item || 'Others' },
  { header: 'Amount', accessor: (t) => t.amount || 0 },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

// Columns definition for Services
export const servicesCsvColumns: CsvColumn<Transaction>[] = [
  { header: 'ServiceID', accessor: (t) => t.id || '' },
  { header: 'CustomerID', accessor: (t) => t.customerId || '307' },
  {
    header: 'CustomerName',
    accessor: (t) => t.customerName || 'Retail Customer',
  },
  { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
  { header: 'Item', accessor: (t) => t.item || 'Pickup' },
  { header: 'Amount', accessor: (t) => t.amount || 0 },
  { header: 'Notes', accessor: (t) => t.note || '' },
];

/**
 * Exports all live data from Firestore as formatted CSV datasets
 */
export async function exportAllDataAsCsv(): Promise<
  Record<BackupCsvType, CsvExportResult>
> {
  const timestamp = new Date().toISOString().split('T')[0];

  // 1. Fetch Customers
  const custSnap = await getDocs(collection(db, 'customers'));
  const customers: Customer[] = [];
  const sales: Transaction[] = [];
  const payments: Transaction[] = [];
  const services: Transaction[] = [];

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

    // Fetch transactions
    const txSnap = await getDocs(
      collection(db, 'customers', docSnap.id, 'transactions'),
    );
    txSnap.forEach((tDoc) => {
      const t = {
        id: tDoc.id,
        customerId: docSnap.id,
        customerName: cust.name,
        ...tDoc.data(),
      } as Transaction;
      if (t.type === 'SALE') sales.push(t);
      else if (t.type === 'PAYMENT') payments.push(t);
      else if (t.type === 'SERVICE') services.push(t);
    });
  }

  // 2. Fetch Purchases & Expenses
  const purchasesSnap = await getDocs(collection(db, 'purchases'));
  const purchases: Transaction[] = [];
  const expenses: Transaction[] = [];

  purchasesSnap.forEach((pDoc) => {
    const p = { id: pDoc.id, ...pDoc.data() } as Transaction;
    if (p.type === 'EXPENSE') {
      expenses.push(p);
    } else {
      purchases.push(p);
    }
  });

  // Convert each to CSV
  const customersCsv = convertToCsv(customers, customerCsvColumns);
  const salesCsv = convertToCsv(sales, salesCsvColumns);
  const paymentsCsv = convertToCsv(payments, paymentsCsvColumns);
  const purchasesCsv = convertToCsv(purchases, purchasesCsvColumns);
  const expensesCsv = convertToCsv(expenses, expensesCsvColumns);
  const servicesCsv = convertToCsv(services, servicesCsvColumns);

  return {
    customers: {
      fileName: `customers_${timestamp}.csv`,
      type: 'customers',
      recordCount: customers.length,
      csvContent: customersCsv,
    },
    sales: {
      fileName: `sales_${timestamp}.csv`,
      type: 'sales',
      recordCount: sales.length,
      csvContent: salesCsv,
    },
    payments: {
      fileName: `payments_${timestamp}.csv`,
      type: 'payments',
      recordCount: payments.length,
      csvContent: paymentsCsv,
    },
    purchases: {
      fileName: `purchases_${timestamp}.csv`,
      type: 'purchases',
      recordCount: purchases.length,
      csvContent: purchasesCsv,
    },
    expenses: {
      fileName: `expenses_${timestamp}.csv`,
      type: 'expenses',
      recordCount: expenses.length,
      csvContent: expensesCsv,
    },
    services: {
      fileName: `services_${timestamp}.csv`,
      type: 'services',
      recordCount: services.length,
      csvContent: servicesCsv,
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
  type: BackupCsvType,
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
    const idIdx = headers.indexOf(
      type === 'purchases' ? 'purchaseid' : 'expenseid',
    );
    const dateIdx = headers.indexOf('date');
    const itemIdx = headers.indexOf('item');
    const amtIdx = headers.indexOf('amount');
    const wtIdx = headers.indexOf('weightkg');
    const rateIdx = headers.indexOf('purchaserate');
    const catIdx = headers.indexOf(
      type === 'purchases' ? 'category' : 'expensecategory',
    );
    const noteIdx = headers.indexOf('notes');

    let batch = writeBatch(db);
    let batchCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const amount = amtIdx !== -1 ? Number(row[amtIdx]) || 0 : 0;
      const docId =
        idIdx !== -1 && row[idIdx] ? row[idIdx] : `${type}_${Date.now()}_${i}`;
      const pRef = doc(db, 'purchases', docId);

      const record: Record<string, unknown> = {
        type: type === 'purchases' ? 'PURCHASE' : 'EXPENSE',
        date:
          dateIdx !== -1 && row[dateIdx]
            ? row[dateIdx]
            : new Date().toISOString(),
        item: itemIdx !== -1 && row[itemIdx] ? row[itemIdx] : 'Others',
        amount,
        note: noteIdx !== -1 ? row[noteIdx] : '',
      };

      if (type === 'purchases') {
        record.category =
          catIdx !== -1 && row[catIdx] ? row[catIdx] : 'Purchase';
        record.weightKg = wtIdx !== -1 ? Number(row[wtIdx]) || 0 : 0;
        record.purchaseRate = rateIdx !== -1 ? Number(row[rateIdx]) || 0 : 0;
      } else {
        record.expenseCategory =
          catIdx !== -1 && row[catIdx] ? row[catIdx] : 'Others';
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
    // Sales / Payments / Services
    const custIdIdx = headers.indexOf('customerid');
    const idIdx = headers.indexOf(
      type === 'sales'
        ? 'transactionid'
        : type === 'payments'
          ? 'paymentid'
          : 'serviceid',
    );
    const dateIdx = headers.indexOf('date');
    const amtIdx =
      headers.indexOf(
        type === 'payments'
          ? 'amountpaid'
          : type === 'services'
            ? 'amount'
            : 'totalamount',
      ) !== -1
        ? headers.indexOf(
            type === 'payments'
              ? 'amountpaid'
              : type === 'services'
                ? 'amount'
                : 'totalamount',
          )
        : headers.indexOf('amount');
    const wtIdx = headers.indexOf('weightkg');
    const rateIdx = headers.indexOf('rate');
    const cashIdx = headers.indexOf('cashpaid');
    const dueIdx = headers.indexOf('remainingdue');
    const itemIdx = headers.indexOf('item');
    const noteIdx = headers.indexOf('notes');

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
      const txRecord: Record<string, unknown> = {
        type:
          type === 'sales'
            ? 'SALE'
            : type === 'payments'
              ? 'PAYMENT'
              : 'SERVICE',
        date:
          dateIdx !== -1 && row[dateIdx]
            ? row[dateIdx]
            : new Date().toISOString(),
        amount: parsedAmount,
        note: noteIdx !== -1 ? row[noteIdx] : '',
      };

      if (type === 'sales') {
        txRecord.item =
          itemIdx !== -1 && row[itemIdx] ? row[itemIdx] : 'Others';
        txRecord.weightKg = wtIdx !== -1 ? Number(row[wtIdx]) || 0 : 0;
        txRecord.rate = rateIdx !== -1 ? Number(row[rateIdx]) || 0 : 0;
        txRecord.cashPaid = cashIdx !== -1 ? Number(row[cashIdx]) || 0 : 0;
        txRecord.remainingDue = dueIdx !== -1 ? Number(row[dueIdx]) || 0 : 0;
      } else if (type === 'services') {
        txRecord.item =
          itemIdx !== -1 && row[itemIdx] ? row[itemIdx] : 'Pickup';
        txRecord.category = 'Services';
        txRecord.cashPaid =
          cashIdx !== -1 ? Number(row[cashIdx]) || parsedAmount : parsedAmount;
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
 * Clears all customer, transaction, and purchase documents from Firestore
 */
export async function clearAllFirestoreDataApi(): Promise<void> {
  const BATCH_SIZE = 400;

  // 1. Delete all customers & subcollection transactions
  const custSnap = await getDocs(collection(db, 'customers'));
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const docSnap of custSnap.docs) {
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

    batch.delete(docSnap.ref);
    batchCount++;
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  // 2. Delete all purchases
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

  if (batchCount > 0) {
    await batch.commit();
  }
}
