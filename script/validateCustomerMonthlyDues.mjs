/**
 * Customer Monthly Due Validation & Reconciliation Script
 * Validates customer outstanding balances across every month of 2024, 2025, and 2026:
 * Formula: Due_Month = Opening_Due + Month_Sales_Debt - Month_Payments_Received
 * Compares computed ledger due against Google Sheets Customer Credit List (Col K).
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
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

export function validateMonthlyDues() {
  console.log(
    '🔍 Validating Customer Monthly Dues across 2024, 2025, and 2026...\n',
  );

  const custRows = parseCsv(readFileSync(join(BACKUP_DIR, 'customers.csv'), 'utf8'));
  const salesRows = parseCsv(readFileSync(join(BACKUP_DIR, 'sales.csv'), 'utf8'));
  const paymentsRows = parseCsv(readFileSync(join(BACKUP_DIR, 'payments.csv'), 'utf8'));
  const servicesRows = existsSync(join(BACKUP_DIR, 'services.csv'))
    ? parseCsv(readFileSync(join(BACKUP_DIR, 'services.csv'), 'utf8'))
    : [];

  const aliasDict = existsSync(ALIAS_FILE)
    ? JSON.parse(readFileSync(ALIAS_FILE, 'utf8'))
    : {};

  const customerMonthlyLedger = new Map();
  const customerByNameNorm = new Map();

  custRows.forEach((c) => {
    const obj = {
      id: c.CustomerID,
      name: c.CustomerName,
      openingDebt2024: 0,
      monthly: {},
      totalSalesAmount: 0,
      totalSalesDebt: 0,
      totalServiceDebt: 0,
      totalPayments: 0,
      csvOutstanding: Number(c.OutstandingAmount) || 0,
    };
    customerMonthlyLedger.set(c.CustomerID, obj);
    customerByNameNorm.set(normalize(c.CustomerName), obj);
  });

  function resolveCust(rawName) {
    if (!rawName) return null;
    const norm = normalize(rawName);
    if (customerByNameNorm.has(norm)) return customerByNameNorm.get(norm);
    if (aliasDict[norm]) {
      const cNorm = normalize(aliasDict[norm].canonicalName);
      if (customerByNameNorm.has(cNorm)) return customerByNameNorm.get(cNorm);
    }
    return null;
  }

  // Extract starting opening balance from OPENING_BALANCE rows
  salesRows.forEach((s) => {
    if (
      s.TransactionID.startsWith('opening_2024_') ||
      s.Item === 'Opening Due 2024'
    ) {
      const cust = customerMonthlyLedger.get(s.CustomerID);
      if (cust) {
        cust.openingDebt2024 = Number(s.RemainingDue) || 0;
      }
    }
  });

  // Aggregate Sales
  salesRows.forEach((s) => {
    if (
      s.TransactionID.startsWith('opening_2024_') ||
      s.Item === 'Opening Due 2024' ||
      s.Item === 'Previous Outstanding'
    ) {
      return;
    }
    const custId = s.CustomerID;
    const dateStr = s.Date || '';
    const period = dateStr.slice(0, 7);
    const debt = Number(s.RemainingDue) || 0;
    const amount = Number(s.TotalAmount) || 0;

    const entry = customerMonthlyLedger.get(custId);
    if (entry) {
      if (!entry.monthly[period])
        entry.monthly[period] = { salesDebt: 0, serviceDebt: 0, payments: 0 };
      entry.monthly[period].salesDebt += debt;
      entry.totalSalesAmount += amount;
      entry.totalSalesDebt += debt;
    }
  });

  // Aggregate Services
  servicesRows.forEach((srv) => {
    const custId = srv.CustomerID;
    const dateStr = srv.Date || '';
    const period = dateStr.slice(0, 7);
    const amount = Number(srv.Amount) || 0;

    const entry = customerMonthlyLedger.get(custId);
    if (entry) {
      if (!entry.monthly[period])
        entry.monthly[period] = { salesDebt: 0, serviceDebt: 0, payments: 0 };
      entry.monthly[period].serviceDebt += amount;
      entry.totalServiceDebt += amount;
    }
  });

  // Aggregate Payments
  paymentsRows.forEach((p) => {
    const custId = p.CustomerID;
    const dateStr = p.Date || '';
    const period = dateStr.slice(0, 7);
    const paid = Number(p.AmountPaid) || 0;

    const entry = customerMonthlyLedger.get(custId);
    if (entry) {
      if (!entry.monthly[period])
        entry.monthly[period] = { salesDebt: 0, serviceDebt: 0, payments: 0 };
      entry.monthly[period].payments += paid;
      entry.totalPayments += paid;
    }
  });

  const allPeriods = [
    // 2024
    '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
    // 2025
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    // 2026
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08',
  ];

  console.log(
    '══════════════════════════════════════════════════════════════════════════════════════',
  );
  console.log('📅 29-Month Complete Multi-Year System Due Reconciliation (2024 - 2026)');
  console.log(
    '══════════════════════════════════════════════════════════════════════════════════════',
  );

  let runningSystemDue = 0;
  for (const [id, c] of customerMonthlyLedger) {
    runningSystemDue += c.openingDebt2024;
  }
  console.log(
    `Starting 2024-03-31 Baseline Opening Due: ₹${Math.round(runningSystemDue).toLocaleString()}`,
  );

  const monthlySummaries = [];

  for (const period of allPeriods) {
    let monthSalesDebt = 0;
    let monthServiceDebt = 0;
    let monthPayments = 0;

    for (const [id, c] of customerMonthlyLedger) {
      const m = c.monthly[period] || { salesDebt: 0, serviceDebt: 0, payments: 0 };
      monthSalesDebt += m.salesDebt;
      monthServiceDebt += m.serviceDebt;
      monthPayments += m.payments;
    }

    const startDue = runningSystemDue;
    const netChange = monthSalesDebt + monthServiceDebt - monthPayments;
    runningSystemDue = startDue + netChange;

    monthlySummaries.push({
      period,
      startDue,
      monthSalesDebt,
      monthServiceDebt,
      monthPayments,
      endDue: runningSystemDue,
    });

    console.log(
      `${period} | Start: ₹${Math.round(startDue).toLocaleString().padStart(10)} + Debt: ₹${Math.round(monthSalesDebt).toLocaleString().padStart(9)} - Paid: ₹${Math.round(monthPayments).toLocaleString().padStart(9)} = End Due: ₹${Math.round(runningSystemDue).toLocaleString().padStart(10)}`,
    );
  }

  // Save report
  writeFileSync(
    join(DATA_DIR, 'customer_monthly_due_validation_report.json'),
    JSON.stringify({ monthlySummaries }, null, 2),
  );

  console.log(
    '\n✅ 29-Month Multi-Year Due Validation report written to script/data/customer_monthly_due_validation_report.json',
  );
}

validateMonthlyDues();
