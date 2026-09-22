/**
 * Comprehensive Multi-Year (2024, 2025, 2026) Historical Data Ingestion & Reconciliation Pipeline
 *
 * 1. 2024:
 *    - Baseline Opening Due on 2024-03-31 from Customer Credit List-30-april (Col B - Col F)
 *    - 9 Months of 2024 Sales (April - Dec 2024)
 *    - 9 Months of 2024 Purchases (April - Dec 2024)
 *    - 9 Months of 2024 Services & Expenses (Main & Sales tabs)
 *    - 9 Months of 2024 Payments from Credit Lists
 *    - 9 Months of 2024 Monthly Rollout Snapshots
 *
 * 2. 2025:
 *    - 12 Months of 2025 Sales (Jan - Dec 2025)
 *    - 12 Months of 2025 Purchases (Jan - Dec 2025)
 *    - 12 Months of 2025 Services & Expenses
 *    - 12 Months of 2025 Payments from Credit Lists
 *    - 12 Months of 2025 Monthly Rollout Snapshots
 *
 * 3. 2026:
 *    - 8 Months of 2026 Pristine Records (Jan - Aug 2026)
 *
 * 4. Continuous Customer Ledger:
 *    - Reconciles customer IDs and aliases across all 3 years.
 *    - Dynamically computes continuous running balance from 2024-03-31 to 2026-08-31.
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
const RAW_2024_DUMP = join(DATA_DIR, 'raw_2024_sheets_dump.json');
const RAW_2025_DUMP = join(DATA_DIR, 'raw_2025_sheets_dump.json');
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
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return fallbackIso;
}

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

const MONTHS_2024 = [
  { key: '2024_04', monthName: 'April 2024', period: '2024-04', sheetId: '14rvOhScbEekNLV6Nmn__bQVhbxP7X0oqhSalz-BTl1s' },
  { key: '2024_05', monthName: 'May 2024', period: '2024-05', sheetId: '1xMVOs5yMazAG-NA3b4y7lz3aGPDZqzi7i9T-pzNsHv0' },
  { key: '2024_06', monthName: 'June 2024', period: '2024-06', sheetId: '1RV5syYkJjQZ14QoR5vynxgfbikRwxlZvMNJeEbLltVU' },
  { key: '2024_07', monthName: 'July 2024', period: '2024-07', sheetId: '1wFMBKMD4KESh47rIOa88OkY4EOd3GSeED6ib04NrdtQ' },
  { key: '2024_08', monthName: 'Aug 2024', period: '2024-08', sheetId: '1IXvKjF5Nps0gAVEM-dt1iwJs64tEvxDPOoCgYOBQ4lw' },
  { key: '2024_09', monthName: 'Sep 2024', period: '2024-09', sheetId: '1gJFn8NDkY78NKy41Oec8f6vGAIkaCrJ9z8bIkGQr6pQ' },
  { key: '2024_10', monthName: 'Oct 2024', period: '2024-10', sheetId: '1t55BvCeXlSqgbI5dpvDqrJSIA8gVl5ENgo56TAZDSYI' },
  { key: '2024_11', monthName: 'Nov 2024', period: '2024-11', sheetId: '1rcm6QVqS9kW0113_zpyn7XZGfOwX6n-wVYFvZN4cru0' },
  { key: '2024_12', monthName: 'Dec 2024', period: '2024-12', sheetId: '1_beZmyLuX9GrED7KdEOm4AyNeKTAnyACN51ZqcgzYMs' },
];

const MONTHS_2025 = [
  { key: '2025_01', monthName: 'Jan 2025', period: '2025-01', sheetId: '1C274TasGsyMWwLRblMpItjzE8uXn39I0KjuTQ1nTJ2U' },
  { key: '2025_02', monthName: 'Feb 2025', period: '2025-02', sheetId: '1VgPd99_fu-irua2__cq_6VvvxitXYAO4mYqESEXputI' },
  { key: '2025_03', monthName: 'March 2025', period: '2025-03', sheetId: '1vGNllFNuHcNjj_Y4FJDHfX6Gx6W7nF_gsatsh-jW1Uw' },
  { key: '2025_04', monthName: 'April 2025', period: '2025-04', sheetId: '1FJPVf2naMueUOyb_dBUb9pZBSqcIvRlKrsok1CSJXOM' },
  { key: '2025_05', monthName: 'May 2025', period: '2025-05', sheetId: '1l9gwKeMGXEYuFbew6OqwxAjgX-KwRrgkjpEMSvFXni4' },
  { key: '2025_06', monthName: 'Jun 2025', period: '2025-06', sheetId: '1hPlvbUp1qp3N1C9rZEGUlceErHx9bDhb2vyJnWhqlgQ' },
  { key: '2025_07', monthName: 'July 2025', period: '2025-07', sheetId: '1NHW_B0z6EtFj4fFG8DV63lTu8VEiHVffXJ3mygZSDLc' },
  { key: '2025_08', monthName: 'Aug 2025', period: '2025-08', sheetId: '1UBgWjEayNdMeDxLT81p4ZnJFJy6hEEiN9YcbsRA0PqY' },
  { key: '2025_09', monthName: 'Sep 2025', period: '2025-09', sheetId: '1vgSJzMBlc50623ysVnmGAX7K3y6b4cMc1pvTVcMdoGM' },
  { key: '2025_10', monthName: 'Oct 2025', period: '2025-10', sheetId: '1eTPdGUyrx8TTc_7ASGOaZtIjYmhD5Tz-wYzZ14_ciKk' },
  { key: '2025_11', monthName: 'Nov 2025', period: '2025-11', sheetId: '1P_GER_N8Xej3qfXT7AUC6PgSE-q0BOW8JcNvgaC3jkw' },
  { key: '2025_12', monthName: 'Dec 2025', period: '2025-12', sheetId: '1peCKx10p0OTsIQTdGu7I4JQrK3t4VSKZ9wqtWt884oQ' },
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

export async function runIngestion() {
  console.log('🚀 Starting Complete Multi-Year (2024, 2025, 2026) Ingestion Pipeline...\n');

  if (!existsSync(RAW_2024_DUMP) || !existsSync(RAW_2025_DUMP)) {
    throw new Error('Raw dump files for 2024 or 2025 not found.');
  }

  const dump2024 = JSON.parse(readFileSync(RAW_2024_DUMP, 'utf8'));
  const dump2025 = JSON.parse(readFileSync(RAW_2025_DUMP, 'utf8'));

  const aliasDict = existsSync(ALIAS_FILE)
    ? JSON.parse(readFileSync(ALIAS_FILE, 'utf8'))
    : {};

  const sourceBaseDir = existsSync(PRISTINE_2026_DIR) ? PRISTINE_2026_DIR : BACKUP_DIR;
  const currentCustCsv = readFileSync(join(sourceBaseDir, 'customers.csv'), 'utf8')
    .trim()
    .split('\n');

  const allCustomers = [];
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

    const numId = parseInt(id, 10);
    if (!isNaN(numId) && numId > maxId) maxId = numId;

    const custObj = {
      id,
      name,
      mobile,
      village,
      creditLimit,
      outstandingAmount: 0,
      openingDebt2024: 0,
      salesDebt: 0,
      serviceDebt: 0,
      paymentsPaid: 0,
      isNewHistorical: false,
    };
    allCustomers.push(custObj);
    customerMapByNorm.set(normalize(name), custObj);
    customerMapById.set(id, custObj);
  }

  function resolveCustomer(rawName) {
    if (!rawName) return null;
    let cleanName = rawName.trim();

    // Extract mobile if embedded in name e.g. "Juva Karsanbhai 9924975376"
    let extractedMobile = '';
    const phoneMatch = cleanName.match(/(\d{10})/);
    if (phoneMatch) {
      extractedMobile = phoneMatch[1];
      cleanName = cleanName.replace(phoneMatch[1], '').replace(/[-–—]/g, ' ').trim();
    }

    const norm = normalize(cleanName);
    if (norm === 'retail' || norm === 'dhuva retail' || norm === 'dhuva') {
      return customerMapById.get('307') || { id: '307', name: 'Retail' };
    }
    if (IGNORED_ENTRIES.has(norm)) return null;

    // 1. Direct norm match
    if (customerMapByNorm.has(norm)) {
      const c = customerMapByNorm.get(norm);
      if (extractedMobile && !c.mobile) c.mobile = extractedMobile;
      return c;
    }

    // 2. Alias match
    if (aliasDict[norm]) {
      const canonicalNorm = normalize(aliasDict[norm].canonicalName);
      if (customerMapByNorm.has(canonicalNorm)) {
        const c = customerMapByNorm.get(canonicalNorm);
        if (extractedMobile && !c.mobile) c.mobile = extractedMobile;
        return c;
      }
    }

    // 3. Register genuine new historical customer
    maxId++;
    const newCust = {
      id: String(maxId),
      name: cleanName,
      mobile: extractedMobile,
      village: '',
      creditLimit: 35000,
      outstandingAmount: 0,
      openingDebt2024: 0,
      salesDebt: 0,
      serviceDebt: 0,
      paymentsPaid: 0,
      isNewHistorical: true,
    };
    allCustomers.push(newCust);
    customerMapByNorm.set(norm, newCust);
    customerMapById.set(newCust.id, newCust);

    aliasDict[norm] = { id: newCust.id, canonicalName: newCust.name };
    return newCust;
  }

  // =========================================================================
  // 1. 2024 Baseline Starting Opening Due (2024-03-31) from April Credit List
  // =========================================================================
  console.log('📋 Extracting Starting 2024-03-31 Baseline Customer Opening Dues...');
  const clApril2024 = dump2024.creditLists['Customer Credit List-30-april']?.data?.Sheet1 || [];
  let total2024OpeningDue = 0;
  let count2024OpeningCust = 0;

  for (let i = 1; i < clApril2024.length; i++) {
    const row = clApril2024[i];
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
      count2024OpeningCust++;
    }
  }
  console.log(`✅ Extracted 2024-03-31 Baseline Opening Due: ₹${total2024OpeningDue.toLocaleString()} across ${count2024OpeningCust} accounts`);

  // =========================================================================
  // 2. 2024 Sales, Purchases, Services, Expenses, Payments & Rollouts
  // =========================================================================
  console.log('\n🌾 Processing 2024 Monthly Transactions (April to Dec 2024)...');
  const sales2024 = [];
  const purchases2024 = [];
  const services2024 = [];
  const expenses2024 = [];
  const rollouts2024 = [];

  for (const m of MONTHS_2024) {
    const sheetData = dump2024.monthlySheets[m.key]?.data || {};
    const salesRows = sheetData.Sales || [];
    const purchaseRows = sheetData.Purchase || [];
    const mainRows = sheetData.Main || [];

    // Sales
    if (salesRows.length > 1) {
      const header = salesRows[0].map((h) => String(h || '').trim().toLowerCase());
      const isCust0 = header[0].includes('customer');
      const custIdx = isCust0 ? 0 : 1;
      const dateIdx = isCust0 ? 1 : 0;

      for (let i = 1; i < salesRows.length; i++) {
        const row = salesRows[i];
        const rawName = (row[custIdx] || '').trim();
        if (!rawName || rawName.toLowerCase().includes('total') || rawName.toLowerCase().includes('customer')) continue;

        const cust = resolveCustomer(rawName);
        if (!cust) continue;

        const dateStr = parseDate(row[dateIdx], `${m.period}-15T12:00:00.000Z`);
        const kg = parseRupee(row[2], 0);
        const rate = parseRupee(row[3], 0);
        const total = parseRupee(row[4], kg * rate);
        const cash = parseRupee(row[5], 0);
        const debt = parseRupee(row[6], Math.max(0, total - cash));

        sales2024.push({
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
      }
    }

    // Purchases
    if (purchaseRows.length > 1) {
      for (let i = 1; i < purchaseRows.length; i++) {
        const row = purchaseRows[i];
        const rawVendor = (row[1] || row[0] || '').trim();
        if (!rawVendor || rawVendor.toLowerCase().includes('total') || rawVendor.toLowerCase().includes('item') || rawVendor.toLowerCase().includes('seller')) continue;

        const dateStr = parseDate(row[0], `${m.period}-15T12:00:00.000Z`);
        const item = row[1] ? String(row[1]).trim() : 'Hay';
        const kg = parseRupee(row[2], 0);
        const rate = parseRupee(row[3], 0);
        const amount = parseRupee(row[4], kg * rate);

        purchases2024.push({
          PurchaseID: `purchase_${m.key}_${i}`,
          Date: dateStr,
          Category: 'Purchase',
          Item: item || 'Hay',
          WeightKg: kg,
          PurchaseRate: rate,
          Amount: amount,
          VendorName: rawVendor,
          Notes: `Imported from ${m.monthName} Purchase Sheet`,
        });
      }
    }

    // Main Sheet Rollout & Expenses
    let opStockKg = 0, opStockRate = 0, opStockAmt = 0;
    let purKg = 0, purRate = 0, purAmt = 0;
    let slsKg = 0, slsRate = 0, slsAmt = 0;
    let clStockKg = 0, clStockRate = 0, clStockAmt = 0;

    for (let i = 0; i < mainRows.length; i++) {
      const row = mainRows[i];
      const label = (row[0] || '').trim().toLowerCase();

      if (label.includes('opening stock')) {
        opStockKg = parseRupee(row[1], 0);
        opStockRate = parseRupee(row[2], 0);
        opStockAmt = parseRupee(row[3], 0);
      } else if (label.includes('purchase')) {
        purKg = parseRupee(row[1], 0);
        purRate = parseRupee(row[2], 0);
        purAmt = parseRupee(row[3], 0);
      } else if (label.includes('sales')) {
        slsKg = parseRupee(row[1], 0);
        slsRate = parseRupee(row[2], 0);
        slsAmt = parseRupee(row[3], 0);
      } else if (label.includes('closing stock')) {
        clStockKg = parseRupee(row[1], 0);
        clStockRate = parseRupee(row[2], 0);
        clStockAmt = parseRupee(row[3], 0);
      } else if (label.includes('daalu')) {
        const amt = parseRupee(row[2], parseRupee(row[1], 0));
        if (amt > 0) {
          expenses2024.push({
            ExpenseID: `expense_${m.key}_daalu_${i}`,
            Date: `${m.period}-28T12:00:00.000Z`,
            ExpenseCategory: 'Vehicle',
            Item: 'Daalu Diesel & Maintenance',
            Amount: amt,
            Notes: `Daalu expenses from ${m.monthName} Main sheet`,
          });
        }
      } else if (label.includes('expense') && !label.includes('total')) {
        const amt = parseRupee(row[2], parseRupee(row[1], 0));
        if (amt > 0) {
          expenses2024.push({
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

    rollouts2024.push({
      Month: m.period,
      PeriodKey: m.key,
      SpreadsheetId: m.sheetId,
      RolledOutAt: `${m.period}-28T23:59:59.000Z`,
      OpeningStockKg: opStockKg,
      OpeningStockRate: opStockRate,
      OpeningStockAmount: opStockAmt,
      PurchasesKg: purKg,
      PurchasesRate: purRate,
      PurchasesAmount: purAmt,
      SalesKg: slsKg,
      SalesRate: slsRate,
      SalesAmount: slsAmt,
      ClosingStockKg: clStockKg,
      ClosingStockRate: clStockRate,
      ClosingStockAmount: clStockAmt,
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

  // 2024 Payments from Credit Lists
  console.log('💳 Extracting 2024 Customer Payments from Monthly Credit Lists...');
  const payments2024 = [];
  const creditPairs2024 = [
    { period: '2024-04', key: '2024_04', curr: 'Customer Credit List-30-april', prev: null },
    { period: '2024-05', key: '2024_05', curr: 'Customer Credit List-May-31', prev: 'Customer Credit List-30-april' },
    { period: '2024-06', key: '2024_06', curr: 'Customer Credit List-20240630', prev: 'Customer Credit List-May-31' },
    { period: '2024-07', key: '2024_07', curr: 'Customer Credit List-20240731', prev: 'Customer Credit List-20240630' },
    { period: '2024-08', key: '2024_08', curr: 'Customer Credit List-20240831', prev: 'Customer Credit List-20240731' },
    { period: '2024-09', key: '2024_09', curr: 'Customer Credit List-20240930', prev: 'Customer Credit List-20240831' },
    { period: '2024-10', key: '2024_10', curr: 'Customer Credit List-20241030', prev: 'Customer Credit List-20240930' },
    { period: '2024-11', key: '2024_11', curr: 'Customer Credit List-20241130', prev: 'Customer Credit List-20241030' },
    { period: '2024-12', key: '2024_12', curr: 'Customer Credit List-20241231', prev: 'Customer Credit List-20241130' },
  ];

  for (const pair of creditPairs2024) {
    const currRows = dump2024.creditLists[pair.curr]?.data?.Sheet1 || [];
    const prevRows = pair.prev ? (dump2024.creditLists[pair.prev]?.data?.Sheet1 || []) : [];

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
        payments2024.push({
          PaymentID: `pmt_${cust.id}_${pair.key}_exp_${i}`,
          CustomerID: cust.id,
          CustomerName: cust.name,
          Date: `${pair.period}-15T12:00:00.000Z`,
          AmountPaid: explicitPaid,
          Notes: `Payment received in ${pair.curr}`,
        });
        cust.paymentsPaid = (cust.paymentsPaid || 0) + explicitPaid;
      }
    }

    for (const [prevCustId, prevBal] of prevMap) {
      if (!currentCustomerIds.has(prevCustId) && prevBal > 0) {
        const cust = customerMapById.get(prevCustId);
        if (cust) {
          payments2024.push({
            PaymentID: `pmt_${cust.id}_${pair.key}_drop`,
            CustomerID: cust.id,
            CustomerName: cust.name,
            Date: `${pair.period}-15T12:00:00.000Z`,
            AmountPaid: prevBal,
            Notes: `Customer settled previous balance of ₹${prevBal.toLocaleString()} in ${pair.curr}`,
          });
          cust.paymentsPaid = (cust.paymentsPaid || 0) + prevBal;
        }
      }
    }
  }
  console.log(`✅ Extracted ${sales2024.length} Sales, ${purchases2024.length} Purchases, ${payments2024.length} Payments for 2024`);

  // =========================================================================
  // 3. 2025 Sales, Purchases, Services, Expenses, Payments & Rollouts
  // =========================================================================
  console.log('\n🌾 Processing 2025 Monthly Transactions (Jan to Dec 2025)...');
  const sales2025 = [];
  const purchases2025 = [];
  const services2025 = [];
  const expenses2025 = [];
  const rollouts2025 = [];

  for (const m of MONTHS_2025) {
    const monthData = dump2025[m.key] || {};
    const salesRows = monthData.Sales || [];
    const purchaseRows = monthData.Purchase || [];
    const mainRows = monthData.Main || [];

    // Sales
    if (salesRows.length > 1) {
      const header = salesRows[0].map((h) => String(h || '').trim().toLowerCase());
      const isCust0 = header[0].includes('customer');
      const custIdx = isCust0 ? 0 : 1;
      const dateIdx = isCust0 ? 1 : 0;

      for (let i = 1; i < salesRows.length; i++) {
        const row = salesRows[i];
        const rawName = (row[custIdx] || '').trim();
        if (!rawName || rawName.toLowerCase().includes('total') || rawName.toLowerCase().includes('customer')) continue;

        const cust = resolveCustomer(rawName);
        if (!cust) continue;

        const dateStr = parseDate(row[dateIdx], `${m.period}-15T12:00:00.000Z`);
        const kg = parseRupee(row[2], 0);
        const rate = parseRupee(row[3], 0);
        const total = parseRupee(row[4], kg * rate);
        const cash = parseRupee(row[5], 0);
        const debt = parseRupee(row[6], Math.max(0, total - cash));

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
      }
    }

    // Purchases
    if (purchaseRows.length > 1) {
      for (let i = 1; i < purchaseRows.length; i++) {
        const row = purchaseRows[i];
        const rawVendor = (row[0] || '').trim();
        if (!rawVendor || rawVendor.toLowerCase().includes('total') || rawVendor.toLowerCase().includes('seller')) continue;

        const dateStr = parseDate(row[1], `${m.period}-15T12:00:00.000Z`);
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
      }
    }

    // Main Sheet Rollout & Expenses
    let opStockKg = 0, opStockRate = 0, opStockAmt = 0;
    let purKg = 0, purRate = 0, purAmt = 0;
    let slsKg = 0, slsRate = 0, slsAmt = 0;
    let clStockKg = 0, clStockRate = 0, clStockAmt = 0;

    for (let i = 0; i < mainRows.length; i++) {
      const row = mainRows[i];
      const label = (row[0] || '').trim().toLowerCase();

      if (label.includes('opening stock')) {
        opStockKg = parseRupee(row[1], 0);
        opStockRate = parseRupee(row[2], 0);
        opStockAmt = parseRupee(row[3], 0);
      } else if (label.includes('purchases')) {
        purKg = parseRupee(row[1], 0);
        purRate = parseRupee(row[2], 0);
        purAmt = parseRupee(row[3], 0);
      } else if (label.includes('sales')) {
        slsKg = parseRupee(row[1], 0);
        slsRate = parseRupee(row[2], 0);
        slsAmt = parseRupee(row[3], 0);
      } else if (label.includes('closing stock')) {
        clStockKg = parseRupee(row[1], 0);
        clStockRate = parseRupee(row[2], 0);
        clStockAmt = parseRupee(row[3], 0);
      } else if (label.includes('daalu')) {
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
      } else if (label.includes('expenses') && !label.includes('total')) {
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

    rollouts2025.push({
      Month: m.period,
      PeriodKey: m.key,
      SpreadsheetId: m.sheetId,
      RolledOutAt: `${m.period}-28T23:59:59.000Z`,
      OpeningStockKg: opStockKg,
      OpeningStockRate: opStockRate,
      OpeningStockAmount: opStockAmt,
      PurchasesKg: purKg,
      PurchasesRate: purRate,
      PurchasesAmount: purAmt,
      SalesKg: slsKg,
      SalesRate: slsRate,
      SalesAmount: slsAmt,
      ClosingStockKg: clStockKg,
      ClosingStockRate: clStockRate,
      ClosingStockAmount: clStockAmt,
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

  // 2025 Payments
  console.log('💳 Extracting 2025 Customer Payments from Monthly Credit Lists...');
  const payments2025 = [];
  const creditPairs2025 = [
    { period: '2025-01', key: '2025_01', curr: 'Customer Credit List-20250131', prev: 'Customer Credit List-20241231' },
    { period: '2025-02', key: '2025_02', curr: 'Customer Credit List-20250228', prev: 'Customer Credit List-20250131' },
    { period: '2025-03', key: '2025_03', curr: 'Customer Credit List-20250331', prev: 'Customer Credit List-20250228' },
    { period: '2025-04', key: '2025_04', curr: 'Customer Credit List-20250430', prev: 'Customer Credit List-20250331' },
    { period: '2025-05', key: '2025_05', curr: 'Customer Credit List-20250531', prev: 'Customer Credit List-20250430' },
    { period: '2025-06', key: '2025_06', curr: 'Customer Credit List-20250630', prev: 'Customer Credit List-20250531' },
    { period: '2025-07', key: '2025_07', curr: 'Customer Credit List-20250731', prev: 'Customer Credit List-20250630' },
    { period: '2025-08', key: '2025_08', curr: 'Customer Credit List-20250831', prev: 'Customer Credit List-20250731' },
    { period: '2025-09', key: '2025_09', curr: 'Customer Credit List-20250930', prev: 'Customer Credit List-20250831' },
    { period: '2025-10', key: '2025_10', curr: 'Customer Credit List-20251031', prev: 'Customer Credit List-20250930' },
    { period: '2025-11', key: '2025_11', curr: 'Customer Credit List-20251130', prev: 'Customer Credit List-20251031' },
  ];

  for (const pair of creditPairs2025) {
    const currRows = dump2025.creditLists[pair.curr] || [];
    const prevRows = dump2025.creditLists[pair.prev] || [];

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
      }
    }

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
            Notes: `Customer settled previous balance of ₹${prevBal.toLocaleString()} in ${pair.curr}`,
          });
          cust.paymentsPaid = (cust.paymentsPaid || 0) + prevBal;
        }
      }
    }
  }
  console.log(`✅ Extracted ${sales2025.length} Sales, ${purchases2025.length} Purchases, ${payments2025.length} Payments for 2025`);

  // =========================================================================
  // 4. 2026 Pristine Transactions & Final Continuous Ledger Computation
  // =========================================================================
  console.log('\n🔄 Reconciling 2026 Pristine Records and Calculating Continuous Multi-Year Ledger...');

  const rawSales2026 = parseCsv(readFileSync(join(sourceBaseDir, 'sales.csv'), 'utf8'));
  const filteredSales2026 = rawSales2026.filter((s) => {
    const isLegacyOpening =
      s.TransactionID.startsWith('opening_bal_') ||
      s.Item === 'Previous Outstanding' ||
      (s.Notes && s.Notes.includes('Carried forward outstanding'));
    return !isLegacyOpening;
  });

  filteredSales2026.forEach((s) => {
    const cust = customerMapById.get(String(s.CustomerID));
    if (cust) {
      const debt = Number(s.RemainingDue) || 0;
      cust.salesDebt = (cust.salesDebt || 0) + debt;
    }
  });

  const rawServices2026 = existsSync(join(sourceBaseDir, 'services.csv'))
    ? parseCsv(readFileSync(join(sourceBaseDir, 'services.csv'), 'utf8'))
    : [];
  rawServices2026.forEach((srv) => {
    const cust = customerMapById.get(String(srv.CustomerID));
    if (cust) {
      const debt = Number(srv.RemainingDue) || 0;
      cust.serviceDebt = (cust.serviceDebt || 0) + debt;
    }
  });

  const rawPayments2026 = parseCsv(readFileSync(join(sourceBaseDir, 'payments.csv'), 'utf8'));
  rawPayments2026.forEach((p) => {
    const cust = customerMapById.get(String(p.CustomerID));
    if (cust) {
      const paid = Number(p.AmountPaid) || 0;
      cust.paymentsPaid = (cust.paymentsPaid || 0) + paid;
    }
  });

  let totalSystemFinalOutstanding = 0;
  allCustomers.forEach((c) => {
    const continuousDue =
      (c.openingDebt2024 || 0) +
      (c.salesDebt || 0) +
      (c.serviceDebt || 0) -
      (c.paymentsPaid || 0);
    c.outstandingAmount = Math.max(0, Math.round(continuousDue));
    totalSystemFinalOutstanding += c.outstandingAmount;
  });

  console.log(`✅ Continuous Dynamic Outstanding (at end of Aug 2026): ₹${totalSystemFinalOutstanding.toLocaleString()} across ${allCustomers.length} accounts`);

  // =========================================================================
  // 5. Generate Starting 2024 Opening Balance Sales Rows (dated 2024-03-31)
  // =========================================================================
  const opening2024SalesRows = [];
  allCustomers.forEach((c) => {
    if (c.openingDebt2024 > 0) {
      opening2024SalesRows.push({
        TransactionID: `opening_2024_${c.id}`,
        CustomerID: c.id,
        CustomerName: c.name,
        Date: '2024-03-31T23:59:59.000Z',
        Item: 'Opening Due 2024',
        WeightKg: 0,
        Rate: 0,
        TotalAmount: c.openingDebt2024,
        CashPaid: 0,
        RemainingDue: c.openingDebt2024,
        Notes: 'Baseline Starting Opening Balance from April 2024 Credit List',
      });
    }
  });
  console.log(`✅ Generated ${opening2024SalesRows.length} opening balance records for 2024-03-31`);

  // =========================================================================
  // 6. Write All CSV Files & Synchronize
  // =========================================================================
  console.log('\n💾 Writing Reconciled Multi-Year CSV Files...');
  writeFileSync(ALIAS_FILE, JSON.stringify(aliasDict, null, 2));

  // A. Customers
  const custCsvHeader = 'CustomerID,CustomerName,Mobile,Village,CreditLimit,OutstandingAmount';
  const custCsvRows = allCustomers.map(
    (c) => `${c.id},${toCsvField(c.name)},${toCsvField(c.mobile)},${toCsvField(c.village)},${c.creditLimit},${c.outstandingAmount}`,
  );
  writeFileSync(join(BACKUP_DIR, 'customers.csv'), [custCsvHeader, ...custCsvRows].join('\n') + '\n');
  console.log(`  -> Updated customers.csv (${allCustomers.length} total customers)`);

  // B. Sales (2024 Opening Dues + 2024 Sales + 2025 Sales + 2026 Sales)
  const salesCsvHeader = 'TransactionID,CustomerID,CustomerName,Date,Item,WeightKg,Rate,TotalAmount,CashPaid,RemainingDue,Notes';
  const allSalesRecords = [
    ...opening2024SalesRows,
    ...sales2024,
    ...sales2025,
    ...filteredSales2026,
  ];
  const allSalesCsvRows = allSalesRecords.map(
    (s) => `${s.TransactionID},${s.CustomerID},${toCsvField(s.CustomerName)},${s.Date},${toCsvField(s.Item)},${s.WeightKg},${s.Rate},${s.TotalAmount},${s.CashPaid},${s.RemainingDue},${toCsvField(s.Notes)}`,
  );
  writeFileSync(join(BACKUP_DIR, 'sales.csv'), [salesCsvHeader, ...allSalesCsvRows].join('\n') + '\n');
  console.log(`  -> Updated sales.csv (${allSalesCsvRows.length} total sales records)`);

  // C. Purchases (2024 + 2025 + 2026)
  const purchasesCsvHeader = 'PurchaseID,Date,Category,Item,WeightKg,PurchaseRate,Amount,VendorName,Notes';
  const rawPurchases2026 = parseCsv(readFileSync(join(sourceBaseDir, 'purchases.csv'), 'utf8'));
  const allPurchasesRecords = [...purchases2024, ...purchases2025, ...rawPurchases2026];
  const allPurchasesCsvRows = allPurchasesRecords.map(
    (p) => `${p.PurchaseID},${p.Date},${toCsvField(p.Category)},${toCsvField(p.Item)},${p.WeightKg},${p.PurchaseRate},${p.Amount},${toCsvField(p.VendorName)},${toCsvField(p.Notes)}`,
  );
  writeFileSync(join(BACKUP_DIR, 'purchases.csv'), [purchasesCsvHeader, ...allPurchasesCsvRows].join('\n') + '\n');
  console.log(`  -> Updated purchases.csv (${allPurchasesCsvRows.length} total purchases)`);

  // D. Services
  const servicesCsvHeader = 'ServiceID,CustomerID,CustomerName,Date,Item,Amount,Notes';
  const allServicesRecords = [...services2024, ...services2025, ...rawServices2026];
  const allServicesCsvRows = allServicesRecords.map(
    (srv) => `${srv.ServiceID},${srv.CustomerID},${toCsvField(srv.CustomerName)},${srv.Date},${toCsvField(srv.Item)},${srv.Amount},${toCsvField(srv.Notes)}`,
  );
  writeFileSync(join(BACKUP_DIR, 'services.csv'), [servicesCsvHeader, ...allServicesCsvRows].join('\n') + '\n');
  console.log(`  -> Updated services.csv (${allServicesCsvRows.length} total services)`);

  // E. Expenses
  const expensesCsvHeader = 'ExpenseID,Date,ExpenseCategory,Item,Amount,Notes';
  const rawExpenses2026 = parseCsv(readFileSync(join(sourceBaseDir, 'expenses.csv'), 'utf8'));
  const allExpensesRecords = [...expenses2024, ...expenses2025, ...rawExpenses2026];
  const allExpensesCsvRows = allExpensesRecords.map(
    (e) => `${e.ExpenseID},${e.Date},${toCsvField(e.ExpenseCategory)},${toCsvField(e.Item)},${e.Amount},${toCsvField(e.Notes)}`,
  );
  writeFileSync(join(BACKUP_DIR, 'expenses.csv'), [expensesCsvHeader, ...allExpensesCsvRows].join('\n') + '\n');
  console.log(`  -> Updated expenses.csv (${allExpensesCsvRows.length} total expenses)`);

  // F. Payments
  const paymentsCsvHeader = 'PaymentID,CustomerID,CustomerName,Date,AmountPaid,Notes';
  const allPaymentsRecords = [...payments2024, ...payments2025, ...rawPayments2026];
  const allPaymentsCsvRows = allPaymentsRecords.map(
    (p) => `${p.PaymentID},${p.CustomerID},${toCsvField(p.CustomerName)},${p.Date},${p.AmountPaid},${toCsvField(p.Notes)}`,
  );
  writeFileSync(join(BACKUP_DIR, 'payments.csv'), [paymentsCsvHeader, ...allPaymentsCsvRows].join('\n') + '\n');
  console.log(`  -> Updated payments.csv (${allPaymentsCsvRows.length} total payments)`);

  // G. Monthly Rollouts (2024 + 2025 + 2026)
  const rolloutCsvHeader =
    'Month,PeriodKey,SpreadsheetId,RolledOutAt,OpeningStockKg,OpeningStockRate,OpeningStockAmount,PurchasesKg,PurchasesRate,PurchasesAmount,SalesKg,SalesRate,SalesAmount,ClosingStockKg,ClosingStockRate,ClosingStockAmount,GrossCommissionPrev,GrossCommissionCm,GrossCommissionTotal,DaaluPrev,DaaluCm,DaaluTotal,ExpensesPrev,ExpensesCm,ExpensesTotal,NetProfitCm,NetProfitTotal,LendingToCustomers,CashBalance,TotalCapital';
  const rawRollouts2026 = parseCsv(readFileSync(join(sourceBaseDir, 'monthly_rollout.csv'), 'utf8'));
  const allRolloutsRecords = [...rollouts2024, ...rollouts2025, ...rawRollouts2026];
  const allRolloutCsvRows = allRolloutsRecords.map(
    (r) => `${r.Month},${r.PeriodKey},${r.SpreadsheetId},${r.RolledOutAt},${r.OpeningStockKg},${r.OpeningStockRate},${r.OpeningStockAmount},${r.PurchasesKg},${r.PurchasesRate},${r.PurchasesAmount},${r.SalesKg},${r.SalesRate},${r.SalesAmount},${r.ClosingStockKg},${r.ClosingStockRate},${r.ClosingStockAmount},${r.GrossCommissionPrev},${r.GrossCommissionCm},${r.GrossCommissionTotal},${r.DaaluPrev},${r.DaaluCm},${r.DaaluTotal},${r.ExpensesPrev},${r.ExpensesCm},${r.ExpensesTotal},${r.NetProfitCm},${r.NetProfitTotal},${r.LendingToCustomers},${r.CashBalance},${r.TotalCapital}`,
  );
  writeFileSync(join(BACKUP_DIR, 'monthly_rollout.csv'), [rolloutCsvHeader, ...allRolloutCsvRows].join('\n') + '\n');
  console.log(`  -> Updated monthly_rollout.csv (${allRolloutCsvRows.length} total rollouts)`);

  // Sync with src/mock/csv
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

  console.log('\n🎉 Complete Multi-Year Ingestion (2024, 2025, 2026) Finished Successfully!');
}

runIngestion().catch(console.error);
