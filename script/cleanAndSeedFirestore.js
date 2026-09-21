/**
 * Script: Clean Firestore and Seed with Verified Reconciled Data
 * Uses firebase-admin with service-account.json
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const BACKUP_DIR = path.join(__dirname, 'data', 'backups');

function parseCsv(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let insideQuote = false;
    let current = '';
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

// Batch helper
class FirestoreBatcher {
  constructor(db) {
    this.db = db;
    this.batch = db.batch();
    this.count = 0;
    this.totalCommitted = 0;
  }

  async set(ref, data, options = { merge: true }) {
    this.batch.set(ref, data, options);
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async delete(ref) {
    this.batch.delete(ref);
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count > 0) {
      await this.batch.commit();
      this.totalCommitted += this.count;
      this.batch = this.db.batch();
      this.count = 0;
    }
  }
}

async function cleanCollection(collectionName) {
  console.log(`Cleaning collection '${collectionName}'...`);
  const snap = await db.collection(collectionName).get();
  const batcher = new FirestoreBatcher(db);
  for (const doc of snap.docs) {
    // If it has subcollections (like customers/transactions), clean subcollection first
    const subcols = await doc.ref.listCollections();
    for (const subcol of subcols) {
      const subSnap = await subcol.get();
      for (const sDoc of subSnap.docs) {
        await batcher.delete(sDoc.ref);
      }
    }
    await batcher.delete(doc.ref);
  }
  await batcher.commit();
  console.log(`Deleted ${snap.size} documents from '${collectionName}'.`);
}

async function run() {
  console.log('🚀 Starting Clean & Seed process for Cloud Firestore...');

  // 1. Clean existing Firestore collections
  await cleanCollection('customers');
  await cleanCollection('purchases');
  await cleanCollection('expenses');
  await cleanCollection('monthly_rollout');
  await cleanCollection('metadata');

  console.log('✨ All old collections cleaned successfully.\n');

  // 2. Load and Prepare Clean Data
  console.log('Reading data from backup files...');

  // Customers
  const custCsv = fs.readFileSync(
    path.join(BACKUP_DIR, 'customers.csv'),
    'utf8',
  );
  const rawCust = parseCsv(custCsv);
  const customers = rawCust.map((c) => ({
    id: String(c.CustomerID),
    name: c.CustomerName,
    mobile: c.Mobile || '',
    village: c.Village || '',
    creditLimit: Number(c.CreditLimit) || 35000,
    outstandingAmount: Number(c.OutstandingAmount) || 0,
  }));

  const custMap = {};
  customers.forEach((c) => {
    custMap[c.id] = c.name;
  });

  // Sales
  const salesCsv = fs.readFileSync(path.join(BACKUP_DIR, 'sales.csv'), 'utf8');
  const rawSales = parseCsv(salesCsv);
  const salesTransactions = rawSales.map((s, idx) => ({
    id: s.TransactionID || `sale_${idx + 1}`,
    customerId: String(s.CustomerID || '307'),
    customerName: s.CustomerName || custMap[String(s.CustomerID)] || 'Retail',
    date: s.Date || new Date().toISOString(),
    type: 'SALE',
    item: s.Item || 'Others',
    weightKg: Number(s.WeightKg) || 0,
    rate: Number(s.Rate) || 0,
    amount: Number(s.TotalAmount) || 0,
    cashPaid: Number(s.CashPaid) || 0,
    remainingDue: Number(s.RemainingDue) || 0,
    discount: Number(s.Discount) || 0,
    note: s.Notes || '',
  }));

  // Services
  const servicesCsvPath = path.join(BACKUP_DIR, 'services.csv');
  let serviceTransactions = [];
  if (fs.existsSync(servicesCsvPath)) {
    const servicesCsv = fs.readFileSync(servicesCsvPath, 'utf8');
    const rawServices = parseCsv(servicesCsv);
    serviceTransactions = rawServices.map((sv, idx) => ({
      id: sv.ServiceID || `service_${idx + 1}`,
      customerId: String(sv.CustomerID || '307'),
      customerName:
        sv.CustomerName || custMap[String(sv.CustomerID)] || 'Retail',
      date: sv.Date || new Date().toISOString(),
      type: 'SERVICE',
      category: 'Services',
      item: sv.Item || 'Pickup',
      amount: Number(sv.Amount) || 0,
      cashPaid: Number(sv.Amount) || 0,
      remainingDue: 0,
      note: sv.Notes || '',
    }));
  }

  // Payments
  const paymentsCsv = fs.readFileSync(
    path.join(BACKUP_DIR, 'payments.csv'),
    'utf8',
  );
  const rawPayments = parseCsv(paymentsCsv);
  const paymentTransactions = rawPayments.map((p, idx) => ({
    id: p.PaymentID || `payment_${idx + 1}`,
    customerId: String(p.CustomerID),
    customerName: p.CustomerName || custMap[String(p.CustomerID)] || '',
    date: p.Date || new Date().toISOString(),
    type: 'PAYMENT',
    amount: Number(p.AmountPaid) || 0,
    paymentAmount: Number(p.AmountPaid) || 0,
    cashPaid: Number(p.AmountPaid) || 0,
    remainingDue: 0,
    note: p.Notes || '',
  }));

  // Purchases & Expenses
  const purchasesCsv = fs.readFileSync(
    path.join(BACKUP_DIR, 'purchases.csv'),
    'utf8',
  );
  const rawPurchases = parseCsv(purchasesCsv);
  const purchases = rawPurchases.map((p, idx) => {
    const isExpense = p.PurchaseID && p.PurchaseID.startsWith('expense_');
    return {
      id: p.PurchaseID || `purchase_${idx + 1}`,
      date: p.Date || new Date().toISOString(),
      type: isExpense ? 'EXPENSE' : 'PURCHASE',
      category: isExpense ? undefined : p.Category || 'Purchase',
      expenseCategory: isExpense ? p.Category || 'Others' : undefined,
      item: p.Item || 'Others',
      weightKg: Number(p.WeightKg) || 0,
      rate: Number(p.PurchaseRate) || 0,
      purchaseRate: Number(p.PurchaseRate) || 0,
      amount: Number(p.Amount) || 0,
      cashPaid: Number(p.CashPaid) || 0,
      remainingDue: Number(p.RemainingDue) || 0,
      vendorName: p.VendorName || '',
      note: p.Notes || '',
    };
  });

  // Monthly Rollouts
  const rolloutCsv = fs.readFileSync(
    path.join(BACKUP_DIR, 'monthly_rollout.csv'),
    'utf8',
  );
  const rawRollout = parseCsv(rolloutCsv);
  const monthlyRollouts = rawRollout.map((r) => ({
    month: r.Month,
    name: r.Month,
    spreadsheetId: r.SpreadsheetId,
    rolledOutAt: r.RolledOutAt,
    summary: {
      period: r.PeriodKey,
      openingStock: {
        weightKg: Number(r.OpeningStockKg) || 0,
        rate: Number(r.OpeningStockRate) || 0,
        amount: Number(r.OpeningStockAmount) || 0,
      },
      purchases: {
        weightKg: Number(r.PurchasesKg) || 0,
        rate: Number(r.PurchasesRate) || 0,
        amount: Number(r.PurchasesAmount) || 0,
      },
      totalStock: {
        weightKg:
          (Number(r.OpeningStockKg) || 0) + (Number(r.PurchasesKg) || 0),
        rate: Number(r.PurchasesRate) || 0,
        amount:
          (Number(r.OpeningStockAmount) || 0) +
          (Number(r.PurchasesAmount) || 0),
      },
      sales: {
        weightKg: Number(r.SalesKg) || 0,
        rate: Number(r.SalesRate) || 0,
        amount: Number(r.SalesAmount) || 0,
      },
      closingStock: {
        weightKg: Number(r.ClosingStockKg) || 0,
        rate: Number(r.ClosingStockRate) || 0,
        amount: Number(r.ClosingStockAmount) || 0,
      },
      grossCommission: {
        prev: Number(r.GrossCommissionPrev) || 0,
        cm: Number(r.GrossCommissionCm) || 0,
        total: Number(r.GrossCommissionTotal) || 0,
      },
      daalu: {
        prev: Number(r.DaaluPrev) || 0,
        cm: Number(r.DaaluCm) || 0,
        total: Number(r.DaaluTotal) || 0,
      },
      expenses: {
        prev: Number(r.ExpensesPrev) || 0,
        cm: Number(r.ExpensesCm) || 0,
        total: Number(r.ExpensesTotal) || 0,
      },
      netProfit: {
        cm: Number(r.NetProfitCm) || 0,
        total: Number(r.NetProfitTotal) || 0,
      },
      lendingToCustomers: Number(r.LendingToCustomers) || 0,
      cashBalance: Number(r.CashBalance) || 0,
      totalCapital: Number(r.TotalCapital) || 0,
    },
  }));

  // Metadata
  const metadata = [
    {
      key: 'backup_status',
      lastBackedUpYear: 2025,
      backedUpAt: '2026-09-01T00:00:00.000Z',
    },
    {
      key: 'monthly_rollout_status',
      lastRolledOutMonth: '2026-08',
      lastRolledOutAt: '2026-09-01T00:00:00.000Z',
      history: monthlyRollouts,
    },
  ];

  console.log(`Prepared Data:
  - Customers: ${customers.length}
  - Sales: ${salesTransactions.length}
  - Services: ${serviceTransactions.length}
  - Payments: ${paymentTransactions.length}
  - Purchases & Expenses: ${purchases.length}
  - Monthly Rollouts: ${monthlyRollouts.length}
  - Metadata: ${metadata.length}
  `);

  // 3. Seed into Firestore
  const seedBatcher = new FirestoreBatcher(db);

  // A. Customers
  console.log('Seeding Customers...');
  for (const cust of customers) {
    const docRef = db.collection('customers').doc(String(cust.id));
    await seedBatcher.set(docRef, cust);
  }

  // B. Transactions (under customers/{id}/transactions)
  console.log('Seeding Transactions under Customers...');
  const allTransactions = [
    ...salesTransactions,
    ...serviceTransactions,
    ...paymentTransactions,
  ];

  for (const tx of allTransactions) {
    const txRef = db
      .collection('customers')
      .doc(String(tx.customerId))
      .collection('transactions')
      .doc(String(tx.id));
    await seedBatcher.set(txRef, tx);
  }

  // C. Purchases & Expenses
  console.log('Seeding Purchases & Expenses...');
  for (const p of purchases) {
    const pRef = db.collection('purchases').doc(String(p.id));
    await seedBatcher.set(pRef, p);
  }

  // D. Monthly Rollouts
  console.log('Seeding Monthly Rollouts...');
  for (const r of monthlyRollouts) {
    const rRef = db.collection('monthly_rollout').doc(String(r.month));
    await seedBatcher.set(rRef, r);
  }

  // E. Metadata
  console.log('Seeding Metadata...');
  for (const m of metadata) {
    const mRef = db.collection('metadata').doc(String(m.key));
    await seedBatcher.set(mRef, m);
  }

  // Commit remaining
  await seedBatcher.commit();

  console.log('\n🎉 Cloud Firestore Cleaned & Seeded Successfully!');
  console.log(`Total documents written: ${seedBatcher.totalCommitted}`);
}

run().catch((err) => {
  console.error('❌ Error during clean & seed:', err);
  process.exit(1);
});
