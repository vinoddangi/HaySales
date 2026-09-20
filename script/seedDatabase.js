/**
 * Standalone Seed Script: Reads all CSVs from script/data/backups/
 * and generates a clean snapshot json file for the local IndexedDB.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, 'data', 'backups');
const OUT_FILE = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'initialDatabaseSnapshot.json',
);

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

console.log('Seeding database snapshot from CSV backups...');

// 1. Customers
const custCsv = fs.readFileSync(path.join(BACKUP_DIR, 'customers.csv'), 'utf8');
const rawCust = parseCsv(custCsv);
const customers = rawCust.map((c) => ({
  id: String(c.CustomerID),
  name: c.CustomerName,
  mobile: c.Mobile || '',
  village: c.Village || '',
  creditLimit: Number(c.CreditLimit) || 35000,
  outstandingAmount: Number(c.OutstandingAmount) || 0,
}));

// Customer Map for Lookup
const custMap = {};
customers.forEach((c) => {
  custMap[c.id] = c.name;
});

// 2. Sales & Services -> Transactions
const salesCsv = fs.readFileSync(path.join(BACKUP_DIR, 'sales.csv'), 'utf8');
const rawSales = parseCsv(salesCsv);
const salesTransactions = rawSales.map((s, idx) => {
  const isService = s.TransactionID && s.TransactionID.startsWith('service_');
  return {
    id: s.TransactionID || `sale_${idx + 1}`,
    customerId: String(s.CustomerID || '307'),
    customerName:
      s.CustomerName || custMap[String(s.CustomerID)] || 'Retail Customer',
    date: s.Date || new Date().toISOString(),
    type: isService ? 'SERVICE' : 'SALE',
    item: s.Item || (isService ? 'Pickup' : 'Others'),
    weightKg: Number(s.WeightKg) || 0,
    rate: Number(s.Rate) || 0,
    amount: Number(s.TotalAmount) || 0,
    cashPaid: Number(s.CashPaid) || 0,
    remainingDue: Number(s.RemainingDue) || 0,
    discount: Number(s.Discount) || 0,
    note: s.Notes || '',
    category: isService ? 'Services' : undefined,
  };
});

// 3. Payments -> Transactions
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

const allTransactions = [...salesTransactions, ...paymentTransactions];

// 4. Purchases (including merged Expenses)
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

// 5. Monthly Rollout History
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
      weightKg: (Number(r.OpeningStockKg) || 0) + (Number(r.PurchasesKg) || 0),
      rate: Number(r.PurchasesRate) || 0,
      amount:
        (Number(r.OpeningStockAmount) || 0) + (Number(r.PurchasesAmount) || 0),
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

// 6. Metadata
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

const snapshot = {
  version: 1,
  generatedAt: new Date().toISOString(),
  customers,
  transactions: allTransactions,
  purchases,
  monthly_rollout: monthlyRollouts,
  metadata,
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2), 'utf8');

console.log('✅ initialDatabaseSnapshot.json generated successfully!');
console.log(`- Customers: ${customers.length}`);
console.log(
  `- Transactions: ${allTransactions.length} (${salesTransactions.length} sales/services + ${paymentTransactions.length} payments)`,
);
console.log(`- Purchases & Expenses: ${purchases.length}`);
console.log(`- Monthly Rollouts: ${monthlyRollouts.length}`);
console.log(`- Metadata Entries: ${metadata.length}`);
