/**
 * Multi-Month Customer Outstanding & 3 Payment Scenarios Reconciliation
 * Evaluates Nov 2022 - Mar 2023:
 * Formula: Closing_Due = Opening_Due + New_Credit_Sales - Payments_Received - Discounts/Kasar
 * 
 * Analyzes the 3 Payment Scenarios:
 * 1. Full Settlement (Customer pays full debt or cleared to ₹0 with Kasar waiver)
 * 2. Partial Payment (Customer pays part of due, remaining balance rolls forward)
 * 3. Cleared Due Before New Purchase / Rolled Forward (Debt carries over or cleared on re-order)
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');
const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'service-account.json'), 'utf-8'));
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const delay = ms => new Promise(r => setTimeout(r, ms));

function parseNum(s) {
  return parseFloat((s || '').toString().replace(/[₹, kg]/g, '').replace(/\((.+)\)/, '-$1')) || 0;
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTHS = [
  { key: 'Nov-2022', period: '2022-11', id: '1hrs0IxXvTS146ukGPyQ3zts2dsgnq_vAQYiR4TQUuGo', mainTab: 'Sheet1' },
  { key: 'Dec-2022', period: '2022-12', id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE', mainTab: 'Sheet1' },
  { key: 'Jan-2023', period: '2023-01', id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q', mainTab: 'Sheet1' },
  { key: 'Feb-2023', period: '2023-02', id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M', mainTab: 'Main' },
  { key: 'Mar-2023', period: '2023-03', id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0', mainTab: 'Main' },
];

const CREDIT_SHEET_ID = '1hSdnQiMEPuv5mIwdf4a8sOv_19imddG-DEvMt2P5yig';

console.log('🔍 Step 1: Loading Credit List & Monthly Sales Tabs...');

// 1. Load Credit List (Sheet1 & Sheet3)
const cResp1 = await sheets.spreadsheets.values.get({ spreadsheetId: CREDIT_SHEET_ID, range: 'Sheet1!A1:N200' });
await delay(300);
const cRows1 = cResp1.data.values || [];

const creditListMap = new Map();
for (let i = 1; i < cRows1.length; i++) {
  const r = cRows1[i];
  const name = (r[0] || '').trim();
  if (!name || name.toLowerCase().includes('total')) continue;
  const d1 = parseNum(r[1]);
  const d2 = parseNum(r[2]);
  const d3 = parseNum(r[3]);
  const gross = parseNum(r[4]) || (d1 + d2 + d3);
  const c1 = parseNum(r[5]);
  const c2 = parseNum(r[6]);
  const c3 = parseNum(r[7]);
  const kasar = parseNum(r[8]);
  const totalPaid = parseNum(r[9]) || (c1 + c2 + c3 + kasar);
  const netDue = parseNum(r[10]) || (gross - totalPaid);

  creditListMap.set(normalize(name), {
    name,
    d1, d2, d3, gross,
    c1, c2, c3, kasar,
    totalPaid, netDue,
  });
}

// 2. Read each month's sales rows
const monthlyCustomerSales = []; // { month, salesMap: norm -> { name, grassAmt, daaluAmt, total, cash, credit } }

for (const m of MONTHS) {
  const sResp = await sheets.spreadsheets.values.get({ spreadsheetId: m.id, range: 'Sales!A1:L250' });
  await delay(300);
  const rows = sResp.data.values || [];

  let bottomHeaderIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const txt = (rows[i][0] || '').toLowerCase().trim();
    if (txt.includes('daalu diesel') || txt.includes('daalu  diesel')) {
      bottomHeaderIdx = i;
      break;
    }
  }

  let custTotalIdx = -1;
  for (let i = bottomHeaderIdx >= 0 ? bottomHeaderIdx - 1 : rows.length - 1; i >= 0; i--) {
    if ((rows[i][0] || '').toLowerCase().trim() === 'total') {
      custTotalIdx = i;
      break;
    }
  }

  const endIdx = custTotalIdx >= 0 ? custTotalIdx : (bottomHeaderIdx >= 0 ? bottomHeaderIdx : rows.length);
  const salesMap = new Map();

  for (let i = 1; i < endIdx; i++) {
    const r = rows[i];
    const rawName = (r[0] || '').trim();
    if (!rawName || rawName.toLowerCase().includes('total')) continue;
    if (rawName.toLowerCase().includes('brok') || rawName.toLowerCase().includes('commis')) continue;

    const kg = parseNum(r[2]);
    let total = 0, cash = 0, credit = 0;

    if (m.key !== 'Mar-2023') {
      total = parseNum(r[7]);
      cash = parseNum(r[8]);
      credit = parseNum(r[9]);
    } else {
      total = parseNum(r[4]);
      cash = parseNum(r[5]);
      credit = parseNum(r[6]);
    }

    if (total === 0 && kg > 0) {
      total = kg * parseNum(r[3]);
      credit = Math.max(0, total - cash);
    }

    const norm = normalize(rawName);
    if (!salesMap.has(norm)) {
      salesMap.set(norm, { name: rawName, totalSales: 0, cashPaid: 0, creditDebt: 0, txCount: 0 });
    }
    const entry = salesMap.get(norm);
    entry.totalSales += total;
    entry.cashPaid += cash;
    entry.creditDebt += credit;
    entry.txCount += 1;
  }

  monthlyCustomerSales.push({ month: m.key, period: m.period, salesMap });
}

// ── Step 2: Categorize Payment Scenarios across the Credit List ────────
console.log('\n📊 Step 2: Classifying Credit List into 3 Payment Scenarios...');

const scenario1_FullSettlement = []; // Paid to 0 or with Kasar
const scenario2_PartialPayment = []; // Paid part of balance, remaining due > 0
const scenario3_ZeroPayment = [];    // No payment, 100% carried forward

for (const [norm, c] of creditListMap.entries()) {
  if (c.totalPaid > 0 && c.netDue <= 0) {
    scenario1_FullSettlement.push(c);
  } else if (c.totalPaid > 0 && c.netDue > 0) {
    scenario2_PartialPayment.push(c);
  } else {
    scenario3_ZeroPayment.push(c);
  }
}

const totalGross = Array.from(creditListMap.values()).reduce((s, c) => s + c.gross, 0);
const totalPaidAll = Array.from(creditListMap.values()).reduce((s, c) => s + c.totalPaid, 0);
const totalNetDueAll = Array.from(creditListMap.values()).reduce((s, c) => s + c.netDue, 0);

console.log(`\n═══════════════════════════════════════════════════════════════════════════════════`);
console.log(`💳 3 PAYMENT SCENARIOS BREAKDOWN (Credit List Audit)`);
console.log(`═══════════════════════════════════════════════════════════════════════════════════`);
console.log(`Total Customers Evaluated: ${creditListMap.size}`);
console.log(`Total Gross Credit Debt:   ₹${totalGross.toLocaleString('en-IN')}`);
console.log(`Total Payments & Kasar:    ₹${totalPaidAll.toLocaleString('en-IN')}`);
console.log(`Final Outstanding Net Due: ₹${totalNetDueAll.toLocaleString('en-IN')}`);

console.log(`\n1️⃣ Scenario 1: FULL SETTLEMENT / CLEARED (Paid to ₹0 or Waived with Kasar)`);
console.log(`   • Customers: ${scenario1_FullSettlement.length}`);
const s1Gross = scenario1_FullSettlement.reduce((s, c) => s + c.gross, 0);
const s1Paid = scenario1_FullSettlement.reduce((s, c) => s + c.totalPaid, 0);
console.log(`   • Debt Settled: ₹${s1Gross.toLocaleString('en-IN')} (Recovered: ₹${s1Paid.toLocaleString('en-IN')}, Remaining Due: ₹0)`);
scenario1_FullSettlement.forEach(c => {
  console.log(`     - ${c.name.padEnd(35)} Gross: ₹${c.gross.toString().padStart(6)} | Paid: ₹${(c.c1+c.c2+c.c3).toString().padStart(6)} | Kasar: ₹${c.kasar} | Net Due: ₹0`);
});

console.log(`\n2️⃣ Scenario 2: PARTIAL PAYMENT RECOVERY (Partial cash paid, balance rolls over)`);
console.log(`   • Customers: ${scenario2_PartialPayment.length}`);
const s2Gross = scenario2_PartialPayment.reduce((s, c) => s + c.gross, 0);
const s2Paid = scenario2_PartialPayment.reduce((s, c) => s + c.totalPaid, 0);
const s2Net = scenario2_PartialPayment.reduce((s, c) => s + c.netDue, 0);
console.log(`   • Gross Debt: ₹${s2Gross.toLocaleString('en-IN')} | Cash Collected: ₹${s2Paid.toLocaleString('en-IN')} | Outstanding Due: ₹${s2Net.toLocaleString('en-IN')}`);
scenario2_PartialPayment.forEach(c => {
  console.log(`     - ${c.name.padEnd(35)} Gross: ₹${c.gross.toString().padStart(6)} | Paid: ₹${(c.c1+c.c2+c.c3).toString().padStart(6)} | Kasar: ₹${c.kasar} | Net Due: ₹${c.netDue}`);
});

console.log(`\n3️⃣ Scenario 3: ZERO PAYMENT / UNPAID CREDIT (100% carried forward)`);
console.log(`   • Customers: ${scenario3_ZeroPayment.length}`);
const s3Gross = scenario3_ZeroPayment.reduce((s, c) => s + c.gross, 0);
console.log(`   • Total Unpaid Outstanding Carried Over: ₹${s3Gross.toLocaleString('en-IN')}`);
console.log(`   • Top 5 Unpaid Customers:`);
scenario3_ZeroPayment.sort((a,b) => b.gross - a.gross).slice(0, 5).forEach(c => {
  console.log(`     - ${c.name.padEnd(35)} Outstanding Due: ₹${c.netDue.toLocaleString('en-IN')}`);
});

// ── Step 3: Month-by-Month Customer Outstanding Roll-Forward ─────────
console.log(`\n═══════════════════════════════════════════════════════════════════════════════════`);
console.log(`📈 MONTH-BY-MONTH RECONCILIATION: SALES DEBT vs ACCUMULATED OUTSTANDING`);
console.log(`═══════════════════════════════════════════════════════════════════════════════════`);

let cumulativeCreditDebt = 0;
let cumulativeCashSales = 0;
let cumulativeGrossSales = 0;

for (const m of monthlyCustomerSales) {
  const mCredit = Array.from(m.salesMap.values()).reduce((s, c) => s + c.creditDebt, 0);
  const mCash = Array.from(m.salesMap.values()).reduce((s, c) => s + c.cashPaid, 0);
  const mTotal = Array.from(m.salesMap.values()).reduce((s, c) => s + c.totalSales, 0);
  const mCustCount = m.salesMap.size;
  const creditCustCount = Array.from(m.salesMap.values()).filter(c => c.creditDebt > 0).length;

  cumulativeCreditDebt += mCredit;
  cumulativeCashSales += mCash;
  cumulativeGrossSales += mTotal;

  console.log(`\n📅 ${m.month}:`);
  console.log(`   • Active Customers    : ${mCustCount} (${creditCustCount} on credit, ${mCustCount - creditCustCount} spot cash)`);
  console.log(`   • Spot Cash Collected : ₹${mCash.toLocaleString('en-IN')}`);
  console.log(`   • New Credit Debt     : ₹${mCredit.toLocaleString('en-IN')}`);
  console.log(`   • Month Total Sales   : ₹${mTotal.toLocaleString('en-IN')}`);
  console.log(`   • Cumulative Credit Due Added: ₹${cumulativeCreditDebt.toLocaleString('en-IN')}`);
}

// ── Step 4: Trace Key Customer Accounts Across All 5 Months ───────────
console.log(`\n═══════════════════════════════════════════════════════════════════════════════════`);
console.log(`🔍 INDIVIDUAL CUSTOMER ACCOUNT RECONCILIATION EXAMPLES`);
console.log(`═══════════════════════════════════════════════════════════════════════════════════`);

const sampleCustomers = [
  'Bhutadiya Dineshbhai Veerabhai',
  'Bera Laljibhai Sadabhai',
  'Darbar Bhayuji Gadh',
  'Gudol Amaratbhai Parthibhai',
  'Desai Rameshbhai Nagjibhai Samdhi',
];

for (const sample of sampleCustomers) {
  const norm = normalize(sample);
  const creditEntry = creditListMap.get(norm);
  console.log(`\n👤 Customer: ${sample}`);
  console.log(`   ─────────────────────────────────────────────────────────────────────────────`);
  let runningDue = 0;
  for (const m of monthlyCustomerSales) {
    const s = m.salesMap.get(norm);
    if (s) {
      runningDue += s.creditDebt;
      console.log(`   ${m.month.padEnd(10)}: Bought ₹${s.totalSales.toLocaleString('en-IN').padStart(7)} | Cash: ₹${s.cashPaid.toString().padStart(5)} | Credit Debt: +₹${s.creditDebt.toString().padStart(6)} (Running: ₹${runningDue.toLocaleString('en-IN')})`);
    } else {
      console.log(`   ${m.month.padEnd(10)}: No transaction in this month`);
    }
  }

  if (creditEntry) {
    console.log(`   Credit List Final Audit:`);
    console.log(`     - Gross Debt Recorded : ₹${creditEntry.gross.toLocaleString('en-IN')}`);
    console.log(`     - Payment Received    : ₹${(creditEntry.c1 + creditEntry.c2 + creditEntry.c3).toLocaleString('en-IN')}`);
    if (creditEntry.kasar > 0) {
      console.log(`     - Settlement Kasar    : ₹${creditEntry.kasar.toLocaleString('en-IN')} (Discount Waiver)`);
    }
    console.log(`     - Final Net Due       : ₹${creditEntry.netDue.toLocaleString('en-IN')}`);
    const scenarioType = creditEntry.totalPaid > 0 ? (creditEntry.netDue <= 0 ? 'Scenario 1 (Full Settlement)' : 'Scenario 2 (Partial Recovery)') : 'Scenario 3 (Zero Payment)';
    console.log(`     - Classification      : ${scenarioType}`);
  }
}

writeFileSync(
  join(__dirname, 'data/customer_outstanding_payment_scenarios_reconciliation.json'),
  JSON.stringify({
    summary: {
      totalCustomers: creditListMap.size,
      totalGross,
      totalPaidAll,
      totalNetDueAll,
      scenario1_FullSettlementCount: scenario1_FullSettlement.length,
      scenario1_TotalDebt: s1Gross,
      scenario1_TotalPaid: s1Paid,
      scenario2_PartialPaymentCount: scenario2_PartialPayment.length,
      scenario2_TotalGross: s2Gross,
      scenario2_TotalPaid: s2Paid,
      scenario2_TotalNetDue: s2Net,
      scenario3_ZeroPaymentCount: scenario3_ZeroPayment.length,
      scenario3_TotalNetDue: s3Gross,
    },
    scenarios: {
      scenario1: scenario1_FullSettlement,
      scenario2: scenario2_PartialPayment,
      scenario3: scenario3_ZeroPayment,
    },
  }, null, 2)
);
console.log(`\n📄 Saved complete reconciliation report to script/data/customer_outstanding_payment_scenarios_reconciliation.json`);
