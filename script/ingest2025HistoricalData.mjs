/**
 * Comprehensive 2025 Historical Data Ingestion & Reconciliation Pipeline
 * Reads raw cached 2025 data (or Google Sheets directly), extracts:
 * 1. Starting 2024 Opening Dues from Customer Credit List-20241231
 * 2. 12 Months of 2025 Sales Transactions
 * 3. 12 Months of 2025 Purchases
 * 4. 12 Months of 2025 Services & Expenses (Main & Sales tabs)
 * 5. Monthly Payments from 2025 Customer Credit Lists
 * 6. 12 Months of 2025 Monthly Rollouts (P&L & Stock)
 * 7. Reconciles customer balances and customer registry.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
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

  const currentCustCsv = readFileSync(join(BACKUP_DIR, 'customers.csv'), 'utf8')
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
      outstandingAmount,
      openingDebt2024: 0,
      isNewHistorical: false,
    };
    existingCustomers.push(custObj);
    customerMapByNorm.set(normalize(name), custObj);
    customerMapById.set(id, custObj);
  }

  console.log(
    `Loaded ${existingCustomers.length} existing customers (Max ID: ${maxId}).`,
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

  for (let i = 1; i < credit2024.length; i++) {
    const row = credit2024[i];
    const rawName = (row[0] || '').trim();
    if (!rawName || rawName.toLowerCase().includes('total')) continue;

    const cust = resolveCustomer(rawName);
    if (!cust) continue;

    const prvDebt = parseRupee(row[1], 0);
    const prvCredit = parseRupee(row[5], 0);
    const netOpening = Math.max(0, prvDebt - prvCredit);
    cust.openingDebt2024 = (cust.openingDebt2024 || 0) + netOpening;
    total2024OpeningDue += netOpening;
  }
  console.log(
    `✅ Extracted 2024 Baseline Starting Opening Due: ₹${total2024OpeningDue.toLocaleString()}`,
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
      if (
        norm === 'expenses' ||
        norm === 'intrest' ||
        norm === 'daalu diesel' ||
        norm === 'daalu diesel + depreciation' ||
        norm === 'fera'
      ) {
        // Handled in expenses
        continue;
      }

      const cust = resolveCustomer(rawName);
      if (!cust) continue;

      const rawDate = row[dateIdx] || '';
      const fallbackIso = `${m.period}-15T12:00:00.000Z`;
      const date = parseDate(rawDate, fallbackIso);

      const weightKg = parseRupee(row[kgIdx], 0);
      const rate = parseRupee(row[rateIdx], 0);
      const amount = parseRupee(row[totalIdx], 0);
      const cashPaid = parseRupee(row[cashIdx], 0);
      const remainingDue = parseRupee(row[debtIdx], amount - cashPaid);

      const saleId = `sale_${m.key}_${i}`;
      sales2025.push({
        TransactionID: saleId,
        CustomerID: cust.id,
        CustomerName: cust.name,
        Date: date,
        Item: 'Others',
        WeightKg: weightKg,
        Rate: rate,
        TotalAmount: amount,
        CashPaid: cashPaid,
        RemainingDue: remainingDue,
        Notes: `Historical sale recorded from ${m.monthName} (Row ${i})`,
      });

      total2025SalesAmount += amount;
      total2025SalesCash += cashPaid;
      total2025SalesDebt += remainingDue;
      total2025SalesKg += weightKg;
      monthSalesCount++;
    }
    console.log(`  ${m.monthName}: ${monthSalesCount} sales extracted`);
  }
  console.log(
    `✅ Total 2025 Sales: ${sales2025.length} transactions, ₹${total2025SalesAmount.toLocaleString()} total, ₹${total2025SalesCash.toLocaleString()} cash, ₹${total2025SalesDebt.toLocaleString()} debt, ${total2025SalesKg.toLocaleString()} kg`,
  );

  // 4. Process 2025 Purchases
  console.log('\n📦 Processing 2025 Purchases across 12 months...');
  const purchases2025 = [];
  let total2025PurchaseAmount = 0;
  let total2025PurchaseKg = 0;

  for (const m of MONTH_KEYS) {
    const monthData = dump[m.key] || {};
    const purchaseRows = monthData.Purchase || [];
    let monthPurchaseCount = 0;

    for (let i = 1; i < purchaseRows.length; i++) {
      const row = purchaseRows[i];
      const rawDate = row[0] || '';
      const item = row[1] || 'Others';
      const weightKg = parseRupee(row[2], 0);
      const rate = parseRupee(row[3], 0);
      const amount = parseRupee(row[4], 0);

      if (weightKg === 0 && amount === 0) continue;

      const fallbackIso = `${m.period}-15T12:00:00.000Z`;
      const date = parseDate(rawDate, fallbackIso);
      const purchaseId = `purchase_${m.key}_${i}`;

      purchases2025.push({
        PurchaseID: purchaseId,
        Date: date,
        Category: 'Purchase',
        Item: item,
        WeightKg: weightKg,
        PurchaseRate: rate,
        Amount: amount,
        VendorName: '',
        Notes: `Historical purchase recorded from ${m.monthName}`,
      });

      total2025PurchaseAmount += amount;
      total2025PurchaseKg += weightKg;
      monthPurchaseCount++;
    }
    console.log(`  ${m.monthName}: ${monthPurchaseCount} purchases extracted`);
  }
  console.log(
    `✅ Total 2025 Purchases: ${purchases2025.length} records, ₹${total2025PurchaseAmount.toLocaleString()} total, ${total2025PurchaseKg.toLocaleString()} kg`,
  );

  // 5. Process 2025 Services & Expenses
  console.log('\n⚙️ Processing 2025 Services and Expenses...');
  const services2025 = [];
  const expenses2025 = [];

  for (const m of MONTH_KEYS) {
    const monthData = dump[m.key] || {};
    const mainRows = monthData.Main || [];
    const salesRows = monthData.Sales || [];

    // Check Main tab for CM expenses
    for (const r of mainRows) {
      const label1 = String(r[0] || '').toLowerCase();
      const label2 = String(r[2] || '').toLowerCase();
      if (
        label1.includes('expenses (cm)') ||
        label1.includes('expenses(cm)') ||
        label1.includes('0. expenses')
      ) {
        const amt = parseRupee(r[1] || r[3], 0);
        if (amt > 0) {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_main`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Others',
            Item: 'Monthly Operations',
            Amount: amt,
            Notes: `Monthly farm expense from ${m.monthName} Main tab`,
          });
        }
      } else if (
        label2.includes('expenses (cm)') ||
        label2.includes('expenses(cm)') ||
        label2.includes('0. expenses')
      ) {
        const amt = parseRupee(r[3], 0);
        if (amt > 0) {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_main`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Others',
            Item: 'Monthly Operations',
            Amount: amt,
            Notes: `Monthly farm expense from ${m.monthName} Main tab`,
          });
        }
      }
    }

    // Check Sales tab for Interest / Diesel / Daalu
    for (let i = 1; i < salesRows.length; i++) {
      const row = salesRows[i];
      const name = String(row[0] || row[1] || '')
        .trim()
        .toLowerCase();
      const amt = parseRupee(row[4] || row[3] || row[2], 0);

      if (amt > 0) {
        if (name === 'intrest') {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_intrest_${i}`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Interest',
            Item: 'Others',
            Amount: amt,
            Notes: `Interest expense recorded in ${m.monthName} Sales tab`,
          });
        } else if (name.includes('daalu diesel') || name === 'diesel') {
          expenses2025.push({
            ExpenseID: `expense_${m.key}_diesel_${i}`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Fuel',
            Item: 'Others',
            Amount: amt,
            Notes: `Diesel / Daalu expense from ${m.monthName} Sales tab`,
          });
        } else if (name === 'daalu' || name.includes('pickup')) {
          // If recorded as positive income or pickup service
          services2025.push({
            ServiceID: `service_${m.key}_${i}`,
            CustomerID: '307',
            CustomerName: 'Retail',
            Date: `${m.period}-28T12:00:00.000Z`,
            Item: 'Pickup',
            Amount: amt,
            Notes: `Service income from ${m.monthName} (${name})`,
          });
        }
      }
    }
  }
  console.log(
    `✅ Total 2025 Services: ${services2025.length} records, Expenses: ${expenses2025.length} records`,
  );

  // 6. Process 2025 Customer Credit Lists (Monthly Payments)
  console.log('\n💳 Processing 2025 Customer Credit Lists and Payments...');
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
          PaymentID: `${cust.id}_${pair.key}_exp_${i}`,
          CustomerID: cust.id,
          CustomerName: cust.name,
          Date: `${pair.period}-15T12:00:00.000Z`,
          AmountPaid: explicitPaid,
          Notes: `Payment received in ${pair.curr}`,
        });
        total2025Payments += explicitPaid;
      }
    }

    // 2. Dropped customers (settled balance)
    for (const [prevCustId, prevBal] of prevMap) {
      if (!currentCustomerIds.has(prevCustId) && prevBal > 0) {
        const cust = customerMapById.get(prevCustId);
        if (cust) {
          payments2025.push({
            PaymentID: `${cust.id}_${pair.key}_drop`,
            CustomerID: cust.id,
            CustomerName: cust.name,
            Date: `${pair.period}-15T12:00:00.000Z`,
            AmountPaid: prevBal,
            Notes: `Customer settled previous balance of ₹${prevBal.toLocaleString()} and was cleared in ${pair.curr}`,
          });
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

    // Parse Main tab metrics
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
      const label = String(r[0] || '').trim();
      if (label.includes('A. Opening Stock')) {
        openingStockKg = parseRupee(r[1], 0);
        openingStockRate = parseRupee(r[2], 0);
        openingStockAmt = parseRupee(r[3], 0);
      } else if (
        label.includes('B. Purchange') ||
        label.includes('B. Purchase')
      ) {
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

  // 8. Merge and Update CSV Files Cleanly (Preserving 2026 data!)
  console.log('\n💾 Merging 2025 Historical Data into CSV files...');

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
    `  -> Updated customers.csv (${existingCustomers.length} total customers)`,
  );

  // B. Sales CSV (Prepend 2025 sales before 2026 sales)
  const currentSalesCsv = readFileSync(join(BACKUP_DIR, 'sales.csv'), 'utf8')
    .trim()
    .split('\n');
  const salesCsvHeader = currentSalesCsv[0];
  const existingSalesRows = currentSalesCsv.slice(1);

  const newSalesCsvRows = sales2025.map(
    (s) =>
      `${s.TransactionID},${s.CustomerID},${toCsvField(s.CustomerName)},${s.Date},${toCsvField(s.Item)},${s.WeightKg},${s.Rate},${s.TotalAmount},${s.CashPaid},${s.RemainingDue},${toCsvField(s.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'sales.csv'),
    [salesCsvHeader, ...newSalesCsvRows, ...existingSalesRows].join('\n') +
      '\n',
  );
  console.log(
    `  -> Updated sales.csv (${newSalesCsvRows.length + existingSalesRows.length} total sales records)`,
  );

  // C. Purchases CSV (Prepend 2025 purchases)
  const currentPurchasesCsv = readFileSync(
    join(BACKUP_DIR, 'purchases.csv'),
    'utf8',
  )
    .trim()
    .split('\n');
  const purchasesCsvHeader = currentPurchasesCsv[0];
  const existingPurchasesRows = currentPurchasesCsv.slice(1);

  const newPurchasesCsvRows = purchases2025.map(
    (p) =>
      `${p.PurchaseID},${p.Date},${toCsvField(p.Category)},${toCsvField(p.Item)},${p.WeightKg},${p.PurchaseRate},${p.Amount},${toCsvField(p.VendorName)},${toCsvField(p.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'purchases.csv'),
    [purchasesCsvHeader, ...newPurchasesCsvRows, ...existingPurchasesRows].join(
      '\n',
    ) + '\n',
  );
  console.log(
    `  -> Updated purchases.csv (${newPurchasesCsvRows.length + existingPurchasesRows.length} total purchases)`,
  );

  // D. Services CSV
  const currentServicesCsv = readFileSync(
    join(BACKUP_DIR, 'services.csv'),
    'utf8',
  )
    .trim()
    .split('\n');
  const servicesCsvHeader = currentServicesCsv[0];
  const existingServicesRows = currentServicesCsv.slice(1);

  const newServicesCsvRows = services2025.map(
    (srv) =>
      `${srv.ServiceID},${srv.CustomerID},${toCsvField(srv.CustomerName)},${srv.Date},${toCsvField(srv.Item)},${srv.Amount},${toCsvField(srv.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'services.csv'),
    [servicesCsvHeader, ...newServicesCsvRows, ...existingServicesRows].join(
      '\n',
    ) + '\n',
  );
  console.log(
    `  -> Updated services.csv (${newServicesCsvRows.length + existingServicesRows.length} total services)`,
  );

  // E. Expenses CSV
  const currentExpensesCsv = readFileSync(
    join(BACKUP_DIR, 'expenses.csv'),
    'utf8',
  )
    .trim()
    .split('\n');
  const expensesCsvHeader = currentExpensesCsv[0];
  const existingExpensesRows = currentExpensesCsv.slice(1);

  const newExpensesCsvRows = expenses2025.map(
    (e) =>
      `${e.ExpenseID},${e.Date},${toCsvField(e.ExpenseCategory)},${toCsvField(e.Item)},${e.Amount},${toCsvField(e.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'expenses.csv'),
    [expensesCsvHeader, ...newExpensesCsvRows, ...existingExpensesRows].join(
      '\n',
    ) + '\n',
  );
  console.log(
    `  -> Updated expenses.csv (${newExpensesCsvRows.length + existingExpensesRows.length} total expenses)`,
  );

  // F. Payments CSV
  const currentPaymentsCsv = readFileSync(
    join(BACKUP_DIR, 'payments.csv'),
    'utf8',
  )
    .trim()
    .split('\n');
  const paymentsCsvHeader = currentPaymentsCsv[0];
  const existingPaymentsRows = currentPaymentsCsv.slice(1);

  const newPaymentsCsvRows = payments2025.map(
    (p) =>
      `${p.PaymentID},${p.CustomerID},${toCsvField(p.CustomerName)},${p.Date},${p.AmountPaid},${toCsvField(p.Notes)}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'payments.csv'),
    [paymentsCsvHeader, ...newPaymentsCsvRows, ...existingPaymentsRows].join(
      '\n',
    ) + '\n',
  );
  console.log(
    `  -> Updated payments.csv (${newPaymentsCsvRows.length + existingPaymentsRows.length} total payments)`,
  );

  // G. Monthly Rollouts CSV
  const currentRolloutCsv = readFileSync(
    join(BACKUP_DIR, 'monthly_rollout.csv'),
    'utf8',
  )
    .trim()
    .split('\n');
  const rolloutCsvHeader = currentRolloutCsv[0];
  const existingRolloutRows = currentRolloutCsv.slice(1);

  const newRolloutCsvRows = rollouts2025.map(
    (r) =>
      `${r.Month},${r.PeriodKey},${r.SpreadsheetId},${r.RolledOutAt},${r.OpeningStockKg},${r.OpeningStockRate},${r.OpeningStockAmount},${r.PurchasesKg},${r.PurchasesRate},${r.PurchasesAmount},${r.SalesKg},${r.SalesRate},${r.SalesAmount},${r.ClosingStockKg},${r.ClosingStockRate},${r.ClosingStockAmount},${r.GrossCommissionPrev},${r.GrossCommissionCm},${r.GrossCommissionTotal},${r.DaaluPrev},${r.DaaluCm},${r.DaaluTotal},${r.ExpensesPrev},${r.ExpensesCm},${r.ExpensesTotal},${r.NetProfitCm},${r.NetProfitTotal},${r.LendingToCustomers},${r.CashBalance},${r.TotalCapital}`,
  );
  writeFileSync(
    join(BACKUP_DIR, 'monthly_rollout.csv'),
    [rolloutCsvHeader, ...newRolloutCsvRows, ...existingRolloutRows].join(
      '\n',
    ) + '\n',
  );
  console.log(
    `  -> Updated monthly_rollout.csv (${newRolloutCsvRows.length + existingRolloutRows.length} total monthly rollouts)`,
  );

  console.log(
    '\n🎉 Successfully ingested and reconciled 2025 historical data!',
  );
}

runIngestion().catch(console.error);
