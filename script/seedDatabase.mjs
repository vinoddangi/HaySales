/**
 * Seed Database Generator (Jan 2026 onwards)
 *
 * Normalization Rules:
 * - 3 Pure Core Tables:
 *   1. 'customers': { id, name, mobile?, village?, creditLimit? }
 *   2. 'customer_transactions': Sales, Services, Payments (>= 2026-01-01)
 *   3. 'operation_transactions': Purchases, Expenses (>= 2026-01-01)
 * - Single financial field 'amount' on all transactions (NO paymentAmount).
 * - Strictly 'weight' in Kg (NO weightKg).
 * - No stored 'rate' in database (derived dynamically via getRate(tx)).
 * - No metadata or monthly rollout tables.
 * - No openingBalance or outstandingAmount stored in customers table.
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
  const clean = item.trim().toLowerCase();
  if (clean.includes('tuvar')) return 'Tuvar';
  if (clean.includes('chana')) return 'Chana';
  if (
    clean.includes('b. kutty') ||
    clean.includes('b kutty') ||
    clean.includes('bkutty')
  )
    return 'B. Kutty';
  if (
    clean.includes('m. kutty') ||
    clean.includes('m kutty') ||
    clean.includes('mkutty')
  )
    return 'M. Kutty';
  if (clean.includes('isabgol')) return 'Isabgol';
  return 'Others';
}

function normalizeServiceCategory(item, notes) {
  const clean = (item || '').trim().toLowerCase();
  const cleanNotes = (notes || '').trim().toLowerCase();
  if (
    clean.includes('pickup') ||
    clean.includes('daalu') ||
    cleanNotes.includes('pickup') ||
    cleanNotes.includes('daalu')
  )
    return 'Pickup';
  if (clean.includes('tractor')) return 'Tractor';
  if (clean.includes('commission')) return 'Commission';
  if (clean.includes('labor') || clean.includes('labour')) return 'Labor';
  if (clean.includes('transport')) return 'Transport';
  return 'Others';
}

function normalizeExpenseCategory(expenseCat, cat, notes) {
  const clean = `${expenseCat || ''} ${cat || ''} ${notes || ''}`.toLowerCase();
  if (
    clean.includes('diesel') ||
    clean.includes('fuel') ||
    clean.includes('petrol')
  )
    return 'Fuel';
  if (
    clean.includes('maintenance') ||
    clean.includes('service') ||
    clean.includes('repair')
  )
    return 'Maintenance';
  if (clean.includes('interest') || clean.includes('vyaj')) return 'Interest';
  if (
    clean.includes('labor') ||
    clean.includes('labour') ||
    clean.includes('driver')
  )
    return 'Labor';
  if (
    clean.includes('food') ||
    clean.includes('tea') ||
    clean.includes('drink') ||
    clean.includes('nasta')
  )
    return 'Food / Drink';
  if (
    clean.includes('tools') ||
    clean.includes('tool') ||
    clean.includes('tarpaulin') ||
    clean.includes('talpatri')
  )
    return 'Tools';
  if (clean.includes('discount') || clean.includes('kapat')) return 'Discount';
  if (clean.includes('depreciation')) return 'Depreciation';
  if (
    clean.includes('profit') ||
    clean.includes('dividend') ||
    clean.includes('distribution')
  )
    return 'Profit Distribution';
  return 'Others';
}

export function generateSnapshot() {
  const START_DATE_ISO = '2026-01-01T00:00:00.000Z';
  const START_DATE_STR = '2026-01-01';

  // 1. Raw Data Extraction
  const rawCust = parseCsv(
    fs.readFileSync(path.join(BACKUP_DIR, 'customers.csv'), 'utf8'),
  );
  const rawSales = parseCsv(
    fs.readFileSync(path.join(BACKUP_DIR, 'sales.csv'), 'utf8'),
  );
  const rawPayments = parseCsv(
    fs.readFileSync(path.join(BACKUP_DIR, 'payments.csv'), 'utf8'),
  );
  const rawPurchases = parseCsv(
    fs.readFileSync(path.join(BACKUP_DIR, 'purchases.csv'), 'utf8'),
  );

  let rawServices = [];
  const servicesCsvPath = path.join(BACKUP_DIR, 'services.csv');
  if (fs.existsSync(servicesCsvPath)) {
    rawServices = parseCsv(fs.readFileSync(servicesCsvPath, 'utf8'));
  }

  let rawExpenses = [];
  const expensesCsvPath = path.join(BACKUP_DIR, 'expenses.csv');
  if (fs.existsSync(expensesCsvPath)) {
    rawExpenses = parseCsv(fs.readFileSync(expensesCsvPath, 'utf8'));
  }

  // 2. Customers Master Store (Pure Demographic Profile)
  const customers = rawCust.map((c) => {
    const cId = String(c.CustomerID);
    const record = {
      id: cId,
      name: c.CustomerName.replace(/Daalu/gi, 'Pickup').trim(),
      creditLimit: Number(c.CreditLimit) || 35000,
    };
    if (c.Mobile) record.mobile = c.Mobile.trim();
    if (c.Village) record.village = c.Village.trim();
    return record;
  });

  const custMap = {};
  customers.forEach((c) => {
    custMap[c.id] = c.name;
  });

  // 3. Customer Transactions: Sales (>= 2026-01-01)
  const sales2026 = rawSales
    .filter((s) => s.Date >= START_DATE_STR)
    .map((s, idx) => {
      const cId = String(s.CustomerID || '307');
      const amt = Number(s.TotalAmount) || 0;
      const cash =
        s.CashPaid !== '' && s.CashPaid !== undefined
          ? Number(s.CashPaid) || 0
          : 0;
      const due =
        s.RemainingDue !== '' && s.RemainingDue !== undefined
          ? Number(s.RemainingDue) || 0
          : Math.max(0, amt - cash);
      const weight = Number(s.WeightKg) || 0;

      const record = {
        id: s.TransactionID || `sale_2026_${idx + 1}`,
        type: 'SALE',
        category: normalizeCropCategory(s.Item),
        date: s.Date || START_DATE_ISO,
        weight,
        amount: amt,
        cashPaid: cash,
        remainingDue: due,
        customerId: cId,
        customerName: (s.CustomerName || custMap[cId] || 'Retail')
          .replace(/Daalu/gi, 'Pickup')
          .trim(),
      };
      if (s.Discount && Number(s.Discount) > 0)
        record.discount = Number(s.Discount);
      if (s.Notes) record.note = s.Notes.replace(/Daalu/gi, 'Pickup').trim();
      return record;
    });

  // Customer Transactions: Services (>= 2026-01-01)
  const services2026 = rawServices
    .filter((sv) => sv.Date >= START_DATE_STR)
    .map((sv, idx) => {
      const cId = String(sv.CustomerID || '307');
      const amt = Number(sv.Amount) || 0;
      const record = {
        id: sv.ServiceID || `service_2026_${idx + 1}`,
        type: 'SERVICE',
        category: normalizeServiceCategory(sv.Item, sv.Notes),
        date: sv.Date || START_DATE_ISO,
        amount: amt,
        cashPaid: amt,
        remainingDue: 0,
        customerId: cId,
        customerName: (sv.CustomerName || custMap[cId] || 'Retail')
          .replace(/Daalu/gi, 'Pickup')
          .trim(),
      };
      if (sv.Notes) record.note = sv.Notes.replace(/Daalu/gi, 'Pickup').trim();
      return record;
    });

  // Customer Transactions: Payments (>= 2026-01-01)
  const payments2026 = rawPayments
    .filter((p) => p.Date >= START_DATE_STR)
    .map((p, idx) => {
      const cId = String(p.CustomerID || '307');
      const amt = Number(p.AmountPaid) || 0;
      const record = {
        id: p.PaymentID || `pmt_2026_${idx + 1}`,
        type: 'PAYMENT',
        date: p.Date || START_DATE_ISO,
        amount: amt,
        cashPaid: amt,
        remainingDue: 0,
        customerId: cId,
        customerName: (p.CustomerName || custMap[cId] || '')
          .replace(/Daalu/gi, 'Pickup')
          .trim(),
      };
      if (p.Notes) record.note = p.Notes.replace(/Daalu/gi, 'Pickup').trim();
      return record;
    });

  const customerTransactions = [...sales2026, ...services2026, ...payments2026];

  // 4. Operation Transactions: Purchases (>= 2026-01-01)
  const purchases2026 = rawPurchases
    .filter((p) => p.Date >= START_DATE_STR)
    .map((p, idx) => {
      const isExpense = p.PurchaseID && p.PurchaseID.startsWith('expense_');
      const amt = Number(p.Amount) || 0;
      const cash =
        p.CashPaid !== '' && p.CashPaid !== undefined
          ? Number(p.CashPaid) || 0
          : amt;
      const due =
        p.RemainingDue !== '' && p.RemainingDue !== undefined
          ? Number(p.RemainingDue) || 0
          : 0;
      const weight = Number(p.WeightKg) || 0;

      if (isExpense) {
        const record = {
          id: p.PurchaseID || `expense_2026_${idx + 1}`,
          type: 'EXPENSE',
          category: normalizeExpenseCategory(
            p.ExpenseCategory,
            p.Category,
            p.Notes,
          ),
          date: p.Date || START_DATE_ISO,
          amount: amt,
          cashPaid: cash,
          remainingDue: due,
        };
        if (p.VendorName) record.vendorName = p.VendorName.trim();
        if (p.Notes) record.note = p.Notes.replace(/Daalu/gi, 'Pickup').trim();
        return record;
      }

      const record = {
        id: p.PurchaseID || `purchase_2026_${idx + 1}`,
        type: 'PURCHASE',
        category: normalizeCropCategory(p.Item),
        date: p.Date || START_DATE_ISO,
        weight,
        amount: amt,
        cashPaid: cash,
        remainingDue: due,
      };
      if (p.VendorName) record.vendorName = p.VendorName.trim();
      if (p.Notes) record.note = p.Notes.replace(/Daalu/gi, 'Pickup').trim();
      return record;
    });

  // Operation Transactions: Expenses (>= 2026-01-01)
  const expenses2026 = rawExpenses
    .filter((e) => e.Date >= START_DATE_STR)
    .map((e, idx) => {
      const amt = Number(e.Amount) || 0;
      const record = {
        id: e.ExpenseID || `expense_2026_${idx + 1}`,
        type: 'EXPENSE',
        category: normalizeExpenseCategory(
          e.ExpenseCategory,
          e.Category,
          e.Notes,
        ),
        date: e.Date || START_DATE_ISO,
        amount: amt,
        cashPaid: amt,
        remainingDue: 0,
      };
      if (e.Notes) record.note = e.Notes.replace(/Daalu/gi, 'Pickup').trim();
      return record;
    });

  // Merge operations without duplicate IDs
  const opMap = new Map();
  purchases2026.forEach((p) => opMap.set(p.id, p));
  expenses2026.forEach((e) => opMap.set(e.id, e));
  const operationTransactions = Array.from(opMap.values());

  const snapshot = {
    version: 2,
    generatedAt: new Date().toISOString(),
    customers,
    customer_transactions: customerTransactions,
    operation_transactions: operationTransactions,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log('✅ initialDatabaseSnapshot.json generated successfully!');
  console.log(`- Customers: ${customers.length}`);
  console.log(
    `- Customer Transactions: ${customerTransactions.length} (${sales2026.length} sales + ${services2026.length} services + ${payments2026.length} payments)`,
  );
  console.log(
    `- Operation Transactions: ${operationTransactions.length} (Purchases & Expenses)`,
  );

  return snapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSnapshot();
}
