/**
 * Comprehensive 2025 Historical Data Ingestion & Reconciliation Pipeline
 * Reads raw cached 2025 data (or Google Sheets directly), extracts:
 * 1. Starting 2024 Opening Dues from Customer Credit List-20241231
 * 2. 12 Months of 2025 Sales Transactions
 * 3. 12 Months of 2025 Purchases
 * 4. 12 Months of 2025 Services & Expenses (Main & Sales tabs)
 * 5. Monthly Payments from 2025 Customer Credit Lists
 * 6. 12 Months of 2025 Monthly Rollouts (P&L & Stock)
 * 7. Reconciles customer balances dynamically across all transactions (2024 Opening + 2025..2026).
 * 8. Synchronizes generated CSV backups and mock files.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const PRISTINE_2026_DIR = join(
  DATA_DIR,
  'backups_pre_2025_2026-09-22T16-50-11-836Z',
);
const MOCK_CSV_DIR = join(__dirname, '..', 'src', 'mock', 'csv');
const RAW_DUMP_FILE = join(DATA_DIR, 'raw_2025_sheets_dump.json');
const ALIAS_FILE = join(DATA_DIR, 'customer_alias_dictionary.json');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRupee(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? defaultVal : parsed;
}

function parseDate(rawDateStr, fallbackIso) {
  if (!rawDateStr || typeof rawDateStr !== 'string') return fallbackIso;
  const cleaned = rawDateStr.trim();

  // Format: "1 Jan 2025", "15 Oct 2025", "2025-01-01"
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return fallbackIso;
}

const MONTH_KEYS = [
  {
    key: '2025_01',
    monthName: 'Jan 2025',
    period: '2025-01',
    sheetId: '1C274TasGsyMWwLRblMpItjzE8uXn39I0KjuTQ1nTJ2U',
  },
  {
    key: '2025_02',
    monthName: 'Feb 2025',
    period: '2025-02',
    sheetId: '1VgPd99_fu-irua2__cq_6VvvxitXYAO4mYqESEXputI',
  },
  {
    key: '2025_03',
    monthName: 'March 2025',
    period: '2025-03',
    sheetId: '1vGNllFNuHcNjj_Y4FJDHfX6Gx6W7nF_gsatsh-jW1Uw',
  },
  {
    key: '2025_04',
    monthName: 'April 2025',
    period: '2025-04',
    sheetId: '1FJPVf2naMueUOyb_dBUb9pZBSqcIvRlKrsok1CSJXOM',
  },
  {
    key: '2025_05',
    monthName: 'May 2025',
    period: '2025-05',
    sheetId: '1l9gwKeMGXEYuFbew6OqwxAjgX-KwRrgkjpEMSvFXni4',
  },
  {
    key: '2025_06',
    monthName: 'Jun 2025',
    period: '2025-06',
    sheetId: '1hPlvbUp1qp3N1C9rZEGUlceErHx9bDhb2vyJnWhqlgQ',
  },
  {
    key: '2025_07',
    monthName: 'July 2025',
    period: '2025-07',
    sheetId: '1NHW_B0z6EtFj4fFG8DV63lTu8VEiHVffXJ3mygZSDLc',
  },
  {
    key: '2025_08',
    monthName: 'Aug 2025',
    period: '2025-08',
    sheetId: '1UBgWjEayNdMeDxLT81p4ZnJFJy6hEEiN9YcbsRA0PqY',
  },
  {
    key: '2025_09',
    monthName: 'Sep 2025',
    period: '2025-09',
    sheetId: '1vgSJzMBlc50623ysVnmGAX7K3y6b4cMc1pvTVcMdoGM',
  },
  {
    key: '2025_10',
    monthName: 'Oct 2025',
    period: '2025-10',
    sheetId: '1eTPdGUyrx8TTc_7ASGOaZtIjYmhD5Tz-wYzZ14_ciKk',
  },
  {
    key: '2025_11',
    monthName: 'Nov 2025',
    period: '2025-11',
    sheetId: '1P_GER_N8Xej3qfXT7AUC6PgSE-q0BOW8JcNvgaC3jkw',
  },
  {
    key: '2025_12',
    monthName: 'Dec 2025',
    period: '2025-12',
    sheetId: '1peCKx10p0OTsIQTdGu7I4JQrK3t4VSKZ9wqtWt884oQ',
  },
];

const IGNORED_ENTRIES = new Set([
  'retail',
  'dhuva retail',
  'dhuva',
  'expenses',
  'intrest',
  'daalu diesel',
  'daalu diesel + depreciation',
  'total',
  'customer name',
  'date',
  'fera',
  'gulab petrol and tea for last 3 years',
  'gaushala',
]);

// Helper to escape CSV values
function toCsvField(val) {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

export async function runIngestion() {
  console.log(
    '🚀 Starting 2025 Historical Data Ingestion & Reconciliation Pipeline...\n',
  );

  if (!existsSync(RAW_DUMP_FILE)) {
    throw new Error(`Raw dump file not found at ${RAW_DUMP_FILE}`);
  }
  const dump = JSON.parse(readFileSync(RAW_DUMP_FILE, 'utf8'));

  // 1. Load Current 2026 Customer Registry and Alias Dictionary
  const aliasDict = existsSync(ALIAS_FILE)
    ? JSON.parse(readFileSync(ALIAS_FILE, 'utf8'))
    : {};

  const sourceBaseDir = existsSync(PRISTINE_2026_DIR)
    ? PRISTINE_2026_DIR
    : BACKUP_DIR;
  console.log(`Using base 2026 data from: ${sourceBaseDir}`);

  const currentCustCsv = readFileSync(
    join(sourceBaseDir, 'customers.csv'),
    'utf8',
  )
    .trim()
    .split('\n');
  const existingCustomers = [];
  const customerMapByNorm = new Map();
  const customerMapById = new Map();
  let maxId = 0;

  for (let i = 1; i < currentCustCsv.length; i++) {
    const parts = currentCustCsv[i].split(',');
    const id = parts[0].trim();
    const name = parts[1].trim();
    const mobile = parts[2] ? parts[2].trim() : '';
    const village = parts[3] ? parts[3].trim() : '';
    const creditLimit = Number(parts[4]) || 35000;
    const outstandingAmount = Number(parts[5]) || 0;

    const numId = parseInt(id, 10);
    if (!isNaN(numId) && numId > maxId) maxId = numId;

    const custObj = {
      id,
      name,
      mobile,
      village,
      creditLimit,
      outstandingAmount: 0, // will be computed dynamically
      openingDebt2024: 0,
      salesDebt: 0,
      serviceDebt: 0,
      paymentsPaid: 0,
      isNewHistorical: false,
    };
    existingCustomers.push(custObj);
    customerMapByNorm.set(normalize(name), custObj);
    customerMapById.set(id, custObj);
  }

  console.log(
    `Loaded ${existingCustomers.length} initial customers (Max ID: ${maxId}).`,
  );

  // Helper to resolve or register customer
  function resolveCustomer(rawName) {
    if (!rawName) return null;
    const norm = normalize(rawName);
    if (norm === 'retail' || norm === 'dhuva retail' || norm === 'dhuva') {
      return customerMapById.get('307') || { id: '307', name: 'Retail' };
    }
    if (IGNORED_ENTRIES.has(norm)) return null;

    // 1. Direct match
    if (customerMapByNorm.has(norm)) {
      return customerMapByNorm.get(norm);
    }

    // 2. Alias match
    if (aliasDict[norm]) {
      const canonicalNorm = normalize(aliasDict[norm].canonicalName);
      if (customerMapByNorm.has(canonicalNorm)) {
        return customerMapByNorm.get(canonicalNorm);
      }
    }

    // 3. Register genuine new historical customer
    maxId++;
    const newCust = {
      id: String(maxId),
      name: rawName.trim(),
      mobile: '',
      village: '',
      creditLimit: 35000,
      outstandingAmount: 0,
      openingDebt2024: 0,
      salesDebt: 0,
      serviceDebt: 0,
      paymentsPaid: 0,
      isNewHistorical: true,
    };
    existingCustomers.push(newCust);
    customerMapByNorm.set(norm, newCust);
    customerMapById.set(newCust.id, newCust);

    // Also record into aliasDict
    aliasDict[norm] = { id: newCust.id, canonicalName: newCust.name };
    return newCust;
  }

  // 2. Extract Baseline 2024-12-31 Customer Opening Dues
  const credit2024 = dump.creditLists['Customer Credit List-20241231'] || [];
  console.log(
    `\n📋 Processing 2024-12-31 Baseline Customer Credit List (${credit2024.length} rows)...`,
  );
  let total2024OpeningDue = 0;
  let count2024OpeningCustomers = 0;

  for (let i = 1; i < credit2024.length; i++) {
    const row = credit2024[i];
    const rawName = (row[0] || '').trim();
    if (!rawName || rawName.toLowerCase().includes('total')) continue;

    const cust = resolveCustomer(rawName);
    if (!cust) continue;

    const prvDebt = parseRupee(row[1], 0);
    const prvCredit = parseRupee(row[5], 0);
    const netOpening = Math.max(0, prvDebt - prvCredit);
    if (netOpening > 0) {
      cust.openingDebt2024 = (cust.openingDebt2024 || 0) + netOpening;
      total2024OpeningDue += netOpening;
      count2024OpeningCustomers++;
    }
  }
  console.log(
    `✅ Extracted 2024 Baseline Starting Opening Due: ₹${total2024OpeningDue.toLocaleString()} across ${count2024OpeningCustomers} customers`,
  );

  // 3. Process 2025 Sales Transactions
  console.log('\n🌾 Processing 2025 Sales Transactions across 12 months...');
  const sales2025 = [];
  let total2025SalesAmount = 0;
  let total2025SalesCash = 0;
  let total2025SalesDebt = 0;
  let total2025SalesKg = 0;

  for (const m of MONTH_KEYS) {
    const monthData = dump[m.key] || {};
    const salesRows = monthData.Sales || [];
    if (salesRows.length === 0) continue;

    const header = salesRows[0].map((h) =>
      String(h || '')
        .trim()
        .toLowerCase(),
    );
    const isCustomerCol0 = header[0].includes('customer');
    const custIdx = isCustomerCol0 ? 0 : 1;
    const dateIdx = isCustomerCol0 ? 1 : 0;
    const kgIdx = 2;
    const rateIdx = 3;
    const totalIdx = 4;
    const cashIdx = 5;
    const debtIdx = 6;

    let monthSalesCount = 0;
    for (let i = 1; i < salesRows.length; i++) {
      const row = salesRows[i];
      const rawName = (row[custIdx] || '').trim();
      if (
        !rawName ||
        rawName.toLowerCase().includes('total') ||
        rawName.toLowerCase().includes('customer')
      )
        continue;

      const norm = normalize(rawName);
      if (IGNORED_ENTRIES.has(norm)) continue;

      const cust = resolveCustomer(rawName);
      if (!cust) continue;

      const rawDate = row[dateIdx];
      const dateStr = parseDate(rawDate, `${m.period}-15T12:00:00.000Z`);
      const kg = parseRupee(row[kgIdx], 0);
      const rate = parseRupee(row[rateIdx], 0);
      const total = parseRupee(row[totalIdx], kg * rate);
      const cash = parseRupee(row[cashIdx], 0);
      const debt = parseRupee(row[debtIdx], Math.max(0, total - cash));

      sales2025.push({
        TransactionID: `sale_${m.key}_${i}`,
        CustomerID: cust.id,
        CustomerName: cust.name,
        Date: dateStr,
        Item: 'Hay',
        WeightKg: kg,
        Rate: rate,
        TotalAmount: total,
        CashPaid: cash,
        RemainingDue: debt,
        Notes: `Imported from ${m.monthName} Sales Sheet`,
      });

      cust.salesDebt = (cust.salesDebt || 0) + debt;
      total2025SalesAmount += total;
      total2025SalesCash += cash;
      total2025SalesDebt += debt;
      total2025SalesKg += kg;
      monthSalesCount++;
    }
  }

  console.log(
    `✅ Ingested ${sales2025.length} Sales transactions for 2025 (Total: ₹${total2025SalesAmount.toLocaleString()}, Debt: ₹${total2025SalesDebt.toLocaleString()})`,
  );

  // 4. Process 2025 Purchases
  console.log('\n📦 Processing 2025 Purchases across 12 months...');
  const purchases2025 = [];
  let total2025PurchasesAmount = 0;
  let total2025PurchasesKg = 0;

  for (const m of MONTH_KEYS) {
    const monthData = dump[m.key] || {};
    const purchaseRows = monthData.Purchase || [];
    if (purchaseRows.length === 0) continue;

    for (let i = 1; i < purchaseRows.length; i++) {
      const row = purchaseRows[i];
      const rawVendor = (row[0] || '').trim();
      if (
        !rawVendor ||
        rawVendor.toLowerCase().includes('total') ||
        rawVendor.toLowerCase().includes('seller') ||
        rawVendor.toLowerCase().includes('name')
      )
        continue;

      const rawDate = row[1];
      const dateStr = parseDate(rawDate, `${m.period}-15T12:00:00.000Z`);
      const kg = parseRupee(row[2], 0);
      const rate = parseRupee(row[3], 0);
      const amount = parseRupee(row[4], kg * rate);

      purchases2025.push({
        PurchaseID: `purchase_${m.key}_${i}`,
        Date: dateStr,
        Category: 'Purchase',
        Item: 'Hay',
        WeightKg: kg,
        PurchaseRate: rate,
        Amount: amount,
        VendorName: rawVendor,
        Notes: `Imported from ${m.monthName} Purchase Sheet`,
      });

      total2025PurchasesAmount += amount;
      total2025PurchasesKg += kg;
    }
  }
  console.log(
    `✅ Ingested ${purchases2025.length} Purchases for 2025 (Total: ₹${total2025PurchasesAmount.toLocaleString()})`,
  );

  // 5. Process 2025 Services & Expenses (from Main and Sales sheets)
  console.log('\n🛠️ Processing 2025 Services & Expenses...');
  const services2025 = [];
  const expenses2025 = [];

  for (const m of MONTH_KEYS) {
    const monthData = dump[m.key] || {};
    const mainRows = monthData.Main || [];
    const salesRows = monthData.Sales || [];

    // Check Sales sheet special rows (Fera / Service / Expenses)
    for (let i = 1; i < salesRows.length; i++) {
      const row = salesRows[i];
      const name0 = (row[0] || '').trim();
      const name1 = (row[1] || '').trim();
      const rawName = name0 || name1;
      const norm = normalize(rawName);

      if (norm === 'fera' || norm.includes('pickup') || norm.includes('fera')) {
        const amt = parseRupee(row[4], parseRupee(row[5], 0));
        if (amt > 0) {
          services2025.push({
            ServiceID: `service_${m.key}_fera_${i}`,
            CustomerID: '307',
            CustomerName: 'Retail',
            Date: `${m.period}-28T12:00:00.000Z`,
            Item: 'Pickup / Fera',
            Amount: amt,
            Notes: `Fera charges from ${m.monthName} Sales sheet`,
          });
        }
      } else if (norm === 'expenses' || norm.includes('expense')) {
        const amt = parseRupee(row[4], parseRupee(row[5], 0));
        if (amt > 0) {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_sales_${i}`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Operating',
            Item: 'General Expenses',
            Amount: amt,
            Notes: `Operating expenses from ${m.monthName} Sales sheet`,
          });
        }
      }
    }

    // Check Main sheet rows
    for (let i = 0; i < mainRows.length; i++) {
      const row = mainRows[i];
      const label = (row[0] || '').trim();
      const norm = normalize(label);

      if (norm.includes('daalu diesel') || norm.includes('daalu')) {
        const amt = parseRupee(row[2], parseRupee(row[1], 0));
        if (amt > 0) {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_daalu_${i}`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Vehicle',
            Item: 'Daalu Diesel & Maintenance',
            Amount: amt,
            Notes: `Daalu expenses from ${m.monthName} Main sheet`,
          });
        }
      } else if (norm.includes('expenses') && !norm.includes('total')) {
        const amt = parseRupee(row[2], parseRupee(row[1], 0));
        if (amt > 0) {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_main_${i}`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Operating',
            Item: 'Monthly Expenses',
            Amount: amt,
            Notes: `Expenses from ${m.monthName} Main sheet`,
          });
        }
      }
    }
  }
  console.log(
    `✅ Extracted ${services2025.length} Services and ${expenses2025.length} Expenses for 2025`,
  );

  // 6. Process 2025 Customer Payments from Monthly Credit Lists
  console.log('\n💳 Processing 2025 Customer Payments...');
  const payments2025 = [];
  const creditPairs = [
    {
      period: '2025-01',
      key: '2025_01',
      curr: 'Customer Credit List-20250131',
      prev: 'Customer Credit List-20241231',
    },
    {
      period: '2025-02',
      key: '2025_02',
      curr: 'Customer Credit List-20250228',
      prev: 'Customer Credit List-20250131',
    },
    {
      period: '2025-03',
      key: '2025_03',
      curr: 'Customer Credit List-20250331',
      prev: 'Customer Credit List-20250228',
    },
    {
      period: '2025-04',
      key: '2025_04',
      curr: 'Customer Credit List-20250430',
      prev: 'Customer Credit List-20250331',
    },
    {
      period: '2025-05',
      key: '2025_05',
      curr: 'Customer Credit List-20250531',
      prev: 'Customer Credit List-20250430',
    },
    {
      period: '2025-06',
      key: '2025_06',
      curr: 'Customer Credit List-20250630',
      prev: 'Customer Credit List-20250531',
    },
    {
      period: '2025-07',
      key: '2025_07',
      curr: 'Customer Credit List-20250731',
      prev: 'Customer Credit List-20250630',
    },
    {
      period: '2025-08',
      key: '2025_08',
      curr: 'Customer Credit List-20250831',
      prev: 'Customer Credit List-20250731',
    },
    {
      period: '2025-09',
      key: '2025_09',
      curr: 'Customer Credit List-20250930',
      prev: 'Customer Credit List-20250831',
    },
    {
      period: '2025-10',
      key: '2025_10',
      curr: 'Customer Credit List-20251031',
      prev: 'Customer Credit List-20250930',
    },
    {
      period: '2025-11',
      key: '2025_11',
      curr: 'Customer Credit List-20251130',
      prev: 'Customer Credit List-20251031',
    },
  ];

  let total2025Payments = 0;
  for (const pair of creditPairs) {
    const currRows = dump.creditLists[pair.curr] || [];
    const prevRows = dump.creditLists[pair.prev] || [];

    // Map previous customers
    const prevMap = new Map();
    for (let i = 1; i < prevRows.length; i++) {
      const r = prevRows[i];
      const rawName = (r[0] || '').trim();
      if (!rawName || rawName.toLowerCase().includes('total')) continue;
      const cust = resolveCustomer(rawName);
      if (!cust) continue;
      const balK = parseRupee(r[10], 0);
      prevMap.set(cust.id, (prevMap.get(cust.id) || 0) + balK);
    }

    const currentCustomerIds = new Set();
    // 1. Explicit payments in current sheet (Col G Credit2 + Col H Credit3 + Col I Kasar)
    for (let i = 1; i < currRows.length; i++) {
      const r = currRows[i];
      const rawName = (r[0] || '').trim();
      if (!rawName || rawName.toLowerCase().includes('total')) continue;
      const cust = resolveCustomer(rawName);
      if (!cust) continue;
      currentCustomerIds.add(cust.id);

      const credit2 = parseRupee(r[6], 0);
      const credit3 = parseRupee(r[7], 0);
      const kasar = parseRupee(r[8], 0);
      const explicitPaid = credit2 + credit3 + kasar;

      if (explicitPaid > 0) {
        payments2025.push({
          PaymentID: `pmt_${cust.id}_${pair.key}_exp_${i}`,
          CustomerID: cust.id,
          CustomerName: cust.name,
          Date: `${pair.period}-15T12:00:00.000Z`,
          AmountPaid: explicitPaid,
          Notes: `Payment received in ${pair.curr}`,
        });
        cust.paymentsPaid = (cust.paymentsPaid || 0) + explicitPaid;
        total2025Payments += explicitPaid;
      }
    }

    // 2. Dropped customers (settled balance)
    for (const [prevCustId, prevBal] of prevMap) {
      if (!currentCustomerIds.has(prevCustId) && prevBal > 0) {
        const cust = customerMapById.get(prevCustId);
        if (cust) {
          payments2025.push({
            PaymentID: `pmt_${cust.id}_${pair.key}_drop`,
            CustomerID: cust.id,
            CustomerName: cust.name,
            Date: `${pair.period}-15T12:00:00.000Z`,
            AmountPaid: prevBal,
            Notes: `Customer settled previous balance of ₹${prevBal.toLocaleString()} and was cleared in ${pair.curr}`,
          });
          cust.paymentsPaid = (cust.paymentsPaid || 0) + prevBal;
          total2025Payments += prevBal;
        }
      }
    }
  }
  console.log(
    `✅ Total 2025 Payments Extracted: ${payments2025.length} records, Total Amount: ₹${total2025Payments.toLocaleString()}`,
  );

  // 7. Monthly Rollout Records (12 Months of 2025)
  console.log('\n📊 Generating 2025 Monthly Rollout & P&L Records...');
  const rollouts2025 = [];

  for (const m of MONTH_KEYS) {
    const monthData = dump[m.key] || {};
    const mainRows = monthData.Main || [];

    let openingStockKg = 0,
      openingStockRate = 0,
      openingStockAmt = 0;
    let purchaseKg = 0,
      purchaseRate = 0,
      purchaseAmt = 0;
    let salesKg = 0,
      salesRate = 0,
      salesAmt = 0;
    let closingStockKg = 0,
      closingStockRate = 0,
      closingStockAmt = 0;

    for (const r of mainRows) {
      const label = (r[0] || '').trim();
      if (label.includes('A. Opening Stock')) {
        openingStockKg = parseRupee(r[1], 0);
        openingStockRate = parseRupee(r[2], 0);
        openingStockAmt = parseRupee(r[3], 0);
      } else if (label.includes('B. Purchases')) {
        purchaseKg = parseRupee(r[1], 0);
        purchaseRate = parseRupee(r[2], 0);
        purchaseAmt = parseRupee(r[3], 0);
      } else if (label.includes('D. Sales')) {
        salesKg = parseRupee(r[1], 0);
        salesRate = parseRupee(r[2], 0);
        salesAmt = parseRupee(r[3], 0);
      } else if (label.includes('G. Closing Stock')) {
        closingStockKg = parseRupee(r[1], 0);
        closingStockRate = parseRupee(r[2], 0);
        closingStockAmt = parseRupee(r[3], 0);
      }
    }

    rollouts2025.push({
      Month: m.period,
      PeriodKey: m.key,
      SpreadsheetId: m.sheetId,
      RolledOutAt: `${m.period}-28T23:59:59.000Z`,
      OpeningStockKg: openingStockKg,
      OpeningStockRate: openingStockRate,
      OpeningStockAmount: openingStockAmt,
      PurchasesKg: purchaseKg,
      PurchasesRate: purchaseRate,
      PurchasesAmount: purchaseAmt,
      SalesKg: salesKg,
      SalesRate: salesRate,
      SalesAmount: salesAmt,
      ClosingStockKg: closingStockKg,
      ClosingStockRate: closingStockRate,
      ClosingStockAmount: closingStockAmt,
      GrossCommissionPrev: 0,
      GrossCommissionCm: 0,
      GrossCommissionTotal: 0,
      DaaluPrev: 0,
      DaaluCm: 0,
      DaaluTotal: 0,
      ExpensesPrev: 0,
      ExpensesCm: 0,
      ExpensesTotal: 0,
      NetProfitCm: 0,
      NetProfitTotal: 0,
      LendingToCustomers: 0,
      CashBalance: 0,
      TotalCapital: 0,
    });
  }
  console.log(
    `✅ Generated ${rollouts2025.length} monthly rollout snapshots for 2025`,
  );

  // 8. Load Pristine 2026 Transactions & Compute Continuous Customer Balances
  console.log(
    '\n🔄 Reconciling 2026 Pristine Records and Calculating Continuous Customer Ledgers...',
  );

  // Load 2026 Sales (filtering out legacy manual opening balances like opening_bal_14)
  const rawSales2026 = parseCsv(
    readFileSync(join(sourceBaseDir, 'sales.csv'), 'utf8'),
  );
  const filteredSales2026 = rawSales2026.filter((s) => {
    const isLegacyOpening =
      s.TransactionID.startsWith('opening_bal_') ||
      s.Item === 'Previous Outstanding' ||
      (s.Notes && s.Notes.includes('Carried forward outstanding'));
    return !isLegacyOpening;
  });

  // Count 2026 sales debt per customer
  filteredSales2026.forEach((s) => {
    const cust = customerMapById.get(String(s.CustomerID));
    if (cust) {
      const debt = Number(s.RemainingDue) || 0;
      cust.salesDebt = (cust.salesDebt || 0) + debt;
    }
  });

  // Load 2026 Services
  const services2026Path = join(sourceBaseDir, 'services.csv');
  const rawServices2026 = existsSync(services2026Path)
    ? parseCsv(readFileSync(services2026Path, 'utf8'))
    : [];
  rawServices2026.forEach((srv) => {
    const cust = customerMapById.get(String(srv.CustomerID));
    if (cust) {
      const debt = Number(srv.RemainingDue) || 0;
      cust.serviceDebt = (cust.serviceDebt || 0) + debt;
    }
  });

  // Load 2026 Payments
  const rawPayments2026 = parseCsv(
    readFileSync(join(sourceBaseDir, 'payments.csv'), 'utf8'),
  );
  rawPayments2026.forEach((p) => {
    const cust = customerMapById.get(String(p.CustomerID));
    if (cust) {
      const paid = Number(p.AmountPaid) || 0;
      cust.paymentsPaid = (cust.paymentsPaid || 0) + paid;
    }
  });

  // Compute each customer's final dynamic outstandingAmount
  let totalSystemFinalOutstanding = 0;
  existingCustomers.forEach((c) => {
    const continuousDue =
      (c.openingDebt2024 || 0) +
      (c.salesDebt || 0) +
      (c.serviceDebt || 0) -
      (c.paymentsPaid || 0);
    c.outstandingAmount = Math.max(0, Math.round(continuousDue));
    totalSystemFinalOutstanding += c.outstandingAmount;
  });

  console.log(
    `✅ Continuous Dynamic Reconciled Outstanding Amount: ₹${totalSystemFinalOutstanding.toLocaleString()} across ${existingCustomers.length} customers`,
  );

  // 9. Generate 2024 Opening Balance Sales Rows (dated 2024-12-31)
  const opening2024SalesRows = [];
  existingCustomers.forEach((c) => {
    if (c.openingDebt2024 > 0) {
      opening2024SalesRows.push({
        TransactionID: `opening_2024_${c.id}`,
        CustomerID: c.id,
        CustomerName: c.name,
        Date: '2024-12-31T23:59:59.000Z',
        Item: 'Opening Due 2024',
        WeightKg: 0,
        Rate: 0,
        TotalAmount: c.openingDebt2024,
        CashPaid: 0,
        RemainingDue: c.openingDebt2024,
        Notes: 'Baseline Opening Balance from 2024-12-31 Credit List',
      });
    }
  });
  console.log(
    `✅ Generated ${opening2024SalesRows.length} opening balance records for 2024-12-31`,
  );

  // 10. Merge and Write all CSV Files
  console.log('\n💾 Writing Reconciled CSV Backups...');

  // Save alias dictionary
  writeFileSync(ALIAS_FILE, JSON.stringify(aliasDict, null, 2));

  // A. Customers CSV
  const custCsvHeader =
    'CustomerID,CustomerName,Mobile,Village,CreditLimit,OutstandingAmount';
  const custCsvRows = existingCustomers.map(
    (c) =>
      `${c.id},${toCsvField(c.name)},${toCsvField(c.mobile)},${toCsvField(c.village)},${c.creditLimit},${c.outstandingAmount}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'customers.csv'),
    [custCsvHeader, ...custCsvRows].join('\n') + '\n',
  );
  console.log(
    `  -> Updated customers.csv (${existingCustomers.length} customers)`,
  );

  // B. Sales CSV (2024 Opening Dues + 2025 Sales + 2026 Sales)
  const salesCsvHeader =
    'TransactionID,CustomerID,CustomerName,Date,Item,WeightKg,Rate,TotalAmount,CashPaid,RemainingDue,Notes';
  const allSalesRecords = [
    ...opening2024SalesRows,
    ...sales2025,
    ...filteredSales2026,
  ];
  const allSalesCsvRows = allSalesRecords.map(
    (s) =>
      `${s.TransactionID},${s.CustomerID},${toCsvField(s.CustomerName)},${s.Date},${toCsvField(s.Item)},${s.WeightKg},${s.Rate},${s.TotalAmount},${s.CashPaid},${s.RemainingDue},${toCsvField(s.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'sales.csv'),
    [salesCsvHeader, ...allSalesCsvRows].join('\n') + '\n',
  );
  console.log(`  -> Updated sales.csv (${allSalesCsvRows.length} total sales)`);

  // C. Purchases CSV (2025 Purchases + 2026 Purchases)
  const purchasesCsvHeader =
    'PurchaseID,Date,Category,Item,WeightKg,PurchaseRate,Amount,VendorName,Notes';
  const rawPurchases2026 = parseCsv(
    readFileSync(join(sourceBaseDir, 'purchases.csv'), 'utf8'),
  );
  const allPurchasesRecords = [...purchases2025, ...rawPurchases2026];
  const allPurchasesCsvRows = allPurchasesRecords.map(
    (p) =>
      `${p.PurchaseID},${p.Date},${toCsvField(p.Category)},${toCsvField(p.Item)},${p.WeightKg},${p.PurchaseRate},${p.Amount},${toCsvField(p.VendorName)},${toCsvField(p.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'purchases.csv'),
    [purchasesCsvHeader, ...allPurchasesCsvRows].join('\n') + '\n',
  );
  console.log(
    `  -> Updated purchases.csv (${allPurchasesCsvRows.length} total purchases)`,
  );

  // D. Services CSV
  const servicesCsvHeader =
    'ServiceID,CustomerID,CustomerName,Date,Item,Amount,Notes';
  const allServicesRecords = [...services2025, ...rawServices2026];
  const allServicesCsvRows = allServicesRecords.map(
    (srv) =>
      `${srv.ServiceID},${srv.CustomerID},${toCsvField(srv.CustomerName)},${srv.Date},${toCsvField(srv.Item)},${srv.Amount},${toCsvField(srv.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'services.csv'),
    [servicesCsvHeader, ...allServicesCsvRows].join('\n') + '\n',
  );
  console.log(
    `  -> Updated services.csv (${allServicesCsvRows.length} total services)`,
  );

  // E. Expenses CSV
  const expensesCsvHeader =
    'ExpenseID,Date,ExpenseCategory,Item,Amount,Notes';
  const rawExpenses2026 = parseCsv(
    readFileSync(join(sourceBaseDir, 'expenses.csv'), 'utf8'),
  );
  const allExpensesRecords = [...expenses2025, ...rawExpenses2026];
  const allExpensesCsvRows = allExpensesRecords.map(
    (e) =>
      `${e.ExpenseID},${e.Date},${toCsvField(e.ExpenseCategory)},${toCsvField(e.Item)},${e.Amount},${toCsvField(e.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'expenses.csv'),
    [expensesCsvHeader, ...allExpensesCsvRows].join('\n') + '\n',
  );
  console.log(
    `  -> Updated expenses.csv (${allExpensesCsvRows.length} total expenses)`,
  );

  // F. Payments CSV (2025 Payments + 2026 Payments)
  const paymentsCsvHeader =
    'PaymentID,CustomerID,CustomerName,Date,AmountPaid,Notes';
  const allPaymentsRecords = [...payments2025, ...rawPayments2026];
  const allPaymentsCsvRows = allPaymentsRecords.map(
    (p) =>
      `${p.PaymentID},${p.CustomerID},${toCsvField(p.CustomerName)},${p.Date},${p.AmountPaid},${toCsvField(p.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'payments.csv'),
    [paymentsCsvHeader, ...allPaymentsCsvRows].join('\n') + '\n',
  );
  console.log(
    `  -> Updated payments.csv (${allPaymentsCsvRows.length} total payments)`,
  );

  // G. Monthly Rollouts CSV
  const rolloutCsvHeader =
    'Month,PeriodKey,SpreadsheetId,RolledOutAt,OpeningStockKg,OpeningStockRate,OpeningStockAmount,PurchasesKg,PurchasesRate,PurchasesAmount,SalesKg,SalesRate,SalesAmount,ClosingStockKg,ClosingStockRate,ClosingStockAmount,GrossCommissionPrev,GrossCommissionCm,GrossCommissionTotal,DaaluPrev,DaaluCm,DaaluTotal,ExpensesPrev,ExpensesCm,ExpensesTotal,NetProfitCm,NetProfitTotal,LendingToCustomers,CashBalance,TotalCapital';
  const rawRollouts2026 = parseCsv(
    readFileSync(join(sourceBaseDir, 'monthly_rollout.csv'), 'utf8'),
  );
  const allRolloutsRecords = [...rollouts2025, ...rawRollouts2026];
  const allRolloutCsvRows = allRolloutsRecords.map(
    (r) =>
      `${r.Month},${r.PeriodKey},${r.SpreadsheetId},${r.RolledOutAt},${r.OpeningStockKg},${r.OpeningStockRate},${r.OpeningStockAmount},${r.PurchasesKg},${r.PurchasesRate},${r.PurchasesAmount},${r.SalesKg},${r.SalesRate},${r.SalesAmount},${r.ClosingStockKg},${r.ClosingStockRate},${r.ClosingStockAmount},${r.GrossCommissionPrev},${r.GrossCommissionCm},${r.GrossCommissionTotal},${r.DaaluPrev},${r.DaaluCm},${r.DaaluTotal},${r.ExpensesPrev},${r.ExpensesCm},${r.ExpensesTotal},${r.NetProfitCm},${r.NetProfitTotal},${r.LendingToCustomers},${r.CashBalance},${r.TotalCapital}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'monthly_rollout.csv'),
    [rolloutCsvHeader, ...allRolloutCsvRows].join('\n') + '\n',
  );
  console.log(
    `  -> Updated monthly_rollout.csv (${allRolloutCsvRows.length} total rollouts)`,
  );

  // 11. Sync with src/mock/csv
  if (existsSync(MOCK_CSV_DIR)) {
    console.log('\n📂 Synchronizing to src/mock/csv/...');
    const filesToSync = [
      'customers.csv',
      'sales.csv',
      'purchases.csv',
      'services.csv',
      'expenses.csv',
      'payments.csv',
      'monthly_rollout.csv',
    ];
    for (const f of filesToSync) {
      copyFileSync(join(BACKUP_DIR, f), join(MOCK_CSV_DIR, f));
    }
    console.log(`  -> Synced ${filesToSync.length} CSV files to src/mock/csv/`);
  }

  console.log(
    '\n🎉 Successfully ingested and reconciled 2024 opening dues, 2025 historical data, and 2026 continuous ledgers!',
  );
}

runIngestion().catch(console.error);
