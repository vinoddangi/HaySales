/**
 * Standalone Seed Script: Reads all CSVs from script/data/backups/
 * and generates a clean, normalized snapshot json file for the local IndexedDB.
 *
 * Normalization Rules:
 * - Single strictly-typed 'category' field on all transactions.
 * - Terminology strictly 'Pickup' (never 'Daalu').
 * - Expenses properly mapped to 'Fuel', 'Pickup', 'Interest', 'Discount', 'Maintenance', 'Others'.
 * - Purchases properly mapped to valid CropType ('Tuvar', 'Chana', 'B. Kutty', 'M. Kutty', 'Isabgol', 'Others').
 * - Monthly rollouts use 'pickup' metric.
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

function normalizeCropCategory(item) {
  if (!item) return 'Others';
  const clean = item.trim();
  if (clean === 'Tuar' || clean === 'Tuvar') return 'Tuvar';
  if (clean === 'Chana') return 'Chana';
  if (clean === 'B Kutty' || clean === 'B. Kutty') return 'B. Kutty';
  if (clean === 'M Kutty' || clean === 'M. Kutty') return 'M. Kutty';
  if (clean === 'Isabgol') return 'Isabgol';
  return 'Others';
}

function normalizeExpenseCategory(cat, item, note) {
  const candidate = (cat || item || '').trim();
  if (candidate === 'Interest') return 'Interest';
  if (candidate === 'Discount') return 'Discount';
  if (candidate === 'Fuel') return 'Fuel';
  if (candidate === 'Maintenance') return 'Maintenance';
  if (candidate === 'Depreciation') return 'Depreciation';
  if (candidate === 'Labor') return 'Labor';
  if (
    candidate === 'Vehicle' ||
    candidate === 'Pickup' ||
    candidate.includes('Daalu') ||
    candidate.includes('Pickup')
  ) {
    return 'Pickup';
  }
  const noteText = (note || '').toLowerCase();
  if (noteText.includes('interest')) return 'Interest';
  if (noteText.includes('fuel') || noteText.includes('diesel')) return 'Fuel';
  if (noteText.includes('daalu') || noteText.includes('pickup'))
    return 'Pickup';
  if (noteText.includes('discount')) return 'Discount';
  return 'Others';
}

console.log('Seeding database snapshot from CSV backups...');

// 1. Customers
const custCsv = fs.readFileSync(path.join(BACKUP_DIR, 'customers.csv'), 'utf8');
const rawCust = parseCsv(custCsv);
const customers = rawCust.map((c) => ({
  id: String(c.CustomerID),
  name: c.CustomerName.replace(/Daalu/gi, 'Pickup'),
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

// 2. Sales -> Transactions
const salesCsv = fs.readFileSync(path.join(BACKUP_DIR, 'sales.csv'), 'utf8');
const rawSales = parseCsv(salesCsv);
const salesTransactions = rawSales.map((s, idx) => {
  const isOpening =
    (s.TransactionID && s.TransactionID.startsWith('opening_')) ||
    s.Item === 'Opening Due 2024' ||
    s.Item === 'Previous Outstanding';
  return {
    id: s.TransactionID || `sale_${idx + 1}`,
    customerId: String(s.CustomerID || '307'),
    customerName: (
      s.CustomerName ||
      custMap[String(s.CustomerID)] ||
      'Retail'
    ).replace(/Daalu/gi, 'Pickup'),
    date: s.Date || new Date().toISOString(),
    type: isOpening ? 'OPENING_BALANCE' : 'SALE',
    category: normalizeCropCategory(s.Item),
    weightKg: Number(s.WeightKg) || 0,
    rate: Number(s.Rate) || 0,
    amount: Number(s.TotalAmount) || 0,
    cashPaid: Number(s.CashPaid) || 0,
    remainingDue: Number(s.RemainingDue) || 0,
    discount: Number(s.Discount) || 0,
    note: (s.Notes || '').replace(/Daalu/gi, 'Pickup'),
  };
});

// 3. Services -> Transactions (e.g. Pickup Services for Retail)
const servicesCsvPath = path.join(BACKUP_DIR, 'services.csv');
let serviceTransactions = [];
if (fs.existsSync(servicesCsvPath)) {
  const servicesCsv = fs.readFileSync(servicesCsvPath, 'utf8');
  const rawServices = parseCsv(servicesCsv);
  serviceTransactions = rawServices.map((sv, idx) => ({
    id: sv.ServiceID || `service_${idx + 1}`,
    customerId: String(sv.CustomerID || '307'),
    customerName: (
      sv.CustomerName ||
      custMap[String(sv.CustomerID)] ||
      'Retail'
    ).replace(/Daalu/gi, 'Pickup'),
    date: sv.Date || new Date().toISOString(),
    type: 'SERVICE',
    category: 'Pickup',
    amount: Number(sv.Amount) || 0,
    cashPaid: Number(sv.Amount) || 0,
    remainingDue: 0,
    note: (sv.Notes || '').replace(/Daalu/gi, 'Pickup'),
  }));
}

// 4. Payments -> Transactions
const paymentsCsv = fs.readFileSync(
  path.join(BACKUP_DIR, 'payments.csv'),
  'utf8',
);
const rawPayments = parseCsv(paymentsCsv);
const paymentTransactions = rawPayments.map((p, idx) => ({
  id: p.PaymentID || `payment_${idx + 1}`,
  customerId: String(p.CustomerID),
  customerName: (p.CustomerName || custMap[String(p.CustomerID)] || '').replace(
    /Daalu/gi,
    'Pickup',
  ),

  date: p.Date || new Date().toISOString(),
  type: 'PAYMENT',
  category: 'Others',
  amount: Number(p.AmountPaid) || 0,
  paymentAmount: Number(p.AmountPaid) || 0,
  cashPaid: Number(p.AmountPaid) || 0,
  remainingDue: 0,
  note: (p.Notes || '').replace(/Daalu/gi, 'Pickup'),
}));

const allTransactions = [
  ...salesTransactions,
  ...serviceTransactions,
  ...paymentTransactions,
];

// 4. Purchases (including merged Expenses)
const purchasesCsv = fs.readFileSync(
  path.join(BACKUP_DIR, 'purchases.csv'),
  'utf8',
);
const rawPurchases = parseCsv(purchasesCsv);
const purchases = rawPurchases.map((p, idx) => {
  const isExpense = p.PurchaseID && p.PurchaseID.startsWith('expense_');
  const category = isExpense
    ? normalizeExpenseCategory(p.ExpenseCategory, p.Category, p.Notes)
    : normalizeCropCategory(p.Item);

  return {
    id: (p.PurchaseID || `purchase_${idx + 1}`).replace(/daalu/gi, 'pickup'),
    date: p.Date || new Date().toISOString(),
    type: isExpense ? 'EXPENSE' : 'PURCHASE',
    category,
    weightKg: Number(p.WeightKg) || 0,
    rate: Number(p.PurchaseRate) || 0,
    purchaseRate: Number(p.PurchaseRate) || 0,
    amount: Number(p.Amount) || 0,
    cashPaid: Number(p.CashPaid) || 0,
    remainingDue: Number(p.RemainingDue) || 0,
    vendorName: p.VendorName || '',
    note: (p.Notes || '').replace(/Daalu/gi, 'Pickup'),
  };
});

const expensesCsvPath = path.join(BACKUP_DIR, 'expenses.csv');
if (fs.existsSync(expensesCsvPath)) {
  const expensesCsv = fs.readFileSync(expensesCsvPath, 'utf8');
  const rawExpenses = parseCsv(expensesCsv);
  rawExpenses.forEach((e, idx) => {
    const eId = (e.ExpenseID || `expense_${idx + 1}`).replace(
      /daalu/gi,
      'pickup',
    );
    if (!purchases.some((p) => p.id === eId)) {
      purchases.push({
        id: eId,
        date: e.Date || new Date().toISOString(),
        type: 'EXPENSE',
        category: normalizeExpenseCategory(
          e.ExpenseCategory,
          e.Category,
          e.Notes,
        ),
        amount: Number(e.Amount) || 0,
        cashPaid: Number(e.Amount) || 0,
        remainingDue: 0,
        vendorName: '',
        note: (e.Notes || '').replace(/Daalu/gi, 'Pickup'),
      });
    }
  });
}

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
    pickup: {
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
