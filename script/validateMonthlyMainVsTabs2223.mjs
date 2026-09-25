/**
 * Cross-validate 2022-23 monthly sheets:
 * Main tab (Income Statement summary) must match Sales tab + Purchase tab totals exactly.
 * Also shows Cash vs Credit breakdown per month.
 */

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf-8'),
);
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function parseNum(s) {
  return (
    parseFloat(
      (s || '')
        .toString()
        .replace(/[₹, kg]/g, '')
        .replace(/\((.+)\)/, '-$1'),
    ) || 0
  );
}

async function readTab(id, tab, range = 'A1:L600') {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${tab}!${range}`,
    });
    return r.data.values || [];
  } catch (e) {
    return [];
  }
}

const MONTHS = [
  {
    key: 'Nov-2022',
    id: '1hrs0IxXvTS146ukGPyQ3zts2dsgnq_vAQYiR4TQUuGo',
    mainTab: 'Sheet1',
  },
  {
    key: 'Dec-2022',
    id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE',
    mainTab: 'Sheet1',
  },
  {
    key: 'Jan-2023',
    id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q',
    mainTab: 'Sheet1',
  },
  {
    key: 'Feb-2023',
    id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M',
    mainTab: 'Main',
  },
  {
    key: 'Mar-2023',
    id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0',
    mainTab: 'Main',
  },
];

const allResults = [];

for (const m of MONTHS) {
  // ── Main/Sheet1 tab ──────────────────────────────────────
  const mainRows = await readTab(m.id, m.mainTab, 'A1:F20');
  await delay(400);

  let mainPurchKG = 0,
    mainPurchAmt = 0,
    mainSalesKG = 0,
    mainSalesAmt = 0;
  let mainClosingKG = 0,
    mainLending = 0;

  mainRows.forEach((r) => {
    const label = (r[0] || '').trim();
    if (/Purchange|Purchase/.test(label) && label.startsWith('B.')) {
      mainPurchKG = parseNum(r[1]);
      mainPurchAmt = parseNum(r[3]);
    }
    if (label === 'D. Sales' || /^D\. Sales/.test(label)) {
      mainSalesKG = parseNum(r[1]);
      mainSalesAmt = parseNum(r[3]);
    }
    if (/Closing Stock/.test(label)) mainClosingKG = parseNum(r[1]);
    if (/Lending to Customer/.test(label)) mainLending = parseNum(r[1]);
  });

  // ── Purchase tab ─────────────────────────────────────────
  const purchRows = await readTab(m.id, 'Purchase', 'A1:E100');
  await delay(400);
  let purchKGCalc = 0,
    purchAmtCalc = 0;
  purchRows
    .slice(1)
    .filter(
      (r) =>
        r[0] &&
        !r[0].toLowerCase().includes('total') &&
        !r[0].toLowerCase().includes('date'),
    )
    .forEach((r) => {
      purchKGCalc += parseNum(r[2]);
      purchAmtCalc += parseNum(r[4]);
    });

  // ── Sales tab ─────────────────────────────────────────────
  const salesRows = await readTab(m.id, 'Sales', 'A1:L600');
  await delay(400);
  const hdr = salesRows[0] || [];
  const cashIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'cash');
  const debtIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'debt');
  const totalIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'total');
  const kgIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'kg');

  let salesKGCalc = 0,
    salesAmtCalc = 0,
    salesCashCalc = 0,
    salesDebtCalc = 0,
    txnCount = 0;
  salesRows
    .slice(1)
    .filter(
      (r) =>
        r[0] &&
        r[0] !== 'Customer Name' &&
        !r[0].toLowerCase().includes('total') &&
        !r[0].match(/^\d/),
    )
    .forEach((r) => {
      salesKGCalc += parseNum(r[kgIdx >= 0 ? kgIdx : 2]);
      const tot = parseNum(r[totalIdx >= 0 ? totalIdx : 7]);
      salesAmtCalc += tot;
      txnCount++;
      if (cashIdx >= 0) salesCashCalc += parseNum(r[cashIdx]);
      if (debtIdx >= 0) salesDebtCalc += parseNum(r[debtIdx]);
    });

  // ── Cross-checks ─────────────────────────────────────────
  const purchAmtOk = Math.abs(mainPurchAmt - purchAmtCalc) < 10;
  const purchKGok = Math.abs(mainPurchKG - purchKGCalc) < 5;
  const salesAmtOk = Math.abs(mainSalesAmt - salesAmtCalc) < 50;
  const salesKGok = Math.abs(mainSalesKG - salesKGCalc) < 20;
  const cashDebtOk =
    cashIdx >= 0 && debtIdx >= 0
      ? Math.abs(salesCashCalc + salesDebtCalc - salesAmtCalc) < 50
      : null;

  const result = {
    month: m.key,
    MAIN_TAB: {
      purchKG: mainPurchKG,
      purchAmt: mainPurchAmt,
      salesKG: mainSalesKG,
      salesAmt: mainSalesAmt,
      closingKG: mainClosingKG,
      lending: mainLending,
    },
    PURCHASE_TAB: {
      kg: purchKGCalc,
      amount: purchAmtCalc,
      items: purchRows
        .slice(1)
        .filter((r) => r[0] && !r[0].toLowerCase().includes('total')).length,
    },
    SALES_TAB: {
      kg: salesKGCalc,
      amount: salesAmtCalc,
      cash: salesCashCalc,
      credit: salesDebtCalc,
      transactions: txnCount,
    },
    CHECKS: {
      purchKG: purchKGok,
      purchAmt: purchAmtOk,
      salesKG: salesKGok,
      salesAmt: salesAmtOk,
      cashPlusDebtEqTotal: cashDebtOk,
    },
    DISCREPANCIES: {
      purchAmtDiff: Math.round(mainPurchAmt - purchAmtCalc),
      salesAmtDiff: Math.round(mainSalesAmt - salesAmtCalc),
      salesKGDiff: Math.round(mainSalesKG - salesKGCalc),
    },
  };
  allResults.push(result);

  const ok = (v) => (v === null ? '➖' : v ? '✅' : '❌');
  console.log('\n' + '━'.repeat(70));
  console.log(`📅  ${m.key}`);
  console.log('━'.repeat(70));
  console.log('  PURCHASE');
  console.log(
    `    Main tab    → KG: ${mainPurchKG.toLocaleString('en-IN')} | Amount: ₹${Math.round(mainPurchAmt).toLocaleString('en-IN')}`,
  );
  console.log(
    `    Purchase tab→ KG: ${Math.round(purchKGCalc).toLocaleString('en-IN')} | Amount: ₹${Math.round(purchAmtCalc).toLocaleString('en-IN')} (${result.PURCHASE_TAB.items} items)`,
  );
  console.log(
    `    Match: KG ${ok(purchKGok)}  Amount ${ok(purchAmtOk)}${!purchAmtOk ? `  ← Diff ₹${Math.round(mainPurchAmt - purchAmtCalc).toLocaleString('en-IN')}` : ''}`,
  );
  console.log('  SALES');
  console.log(
    `    Main tab    → KG: ${mainSalesKG.toLocaleString('en-IN')} | Amount: ₹${Math.round(mainSalesAmt).toLocaleString('en-IN')}`,
  );
  console.log(
    `    Sales tab   → KG: ${Math.round(salesKGCalc).toLocaleString('en-IN')} | Amount: ₹${Math.round(salesAmtCalc).toLocaleString('en-IN')} (${txnCount} txns)`,
  );
  console.log(
    `    Match: KG ${ok(salesKGok)}  Amount ${ok(salesAmtOk)}${!salesAmtOk ? `  ← Diff ₹${Math.round(mainSalesAmt - salesAmtCalc).toLocaleString('en-IN')}` : ''}`,
  );
  console.log(
    `  CASH/CREDIT: Cash ₹${Math.round(salesCashCalc).toLocaleString('en-IN')} | Credit ₹${Math.round(salesDebtCalc).toLocaleString('en-IN')}  Cash+Credit=Total: ${ok(cashDebtOk)}`,
  );
  console.log(
    `  Lending to Customer (Main): ₹${Math.round(mainLending).toLocaleString('en-IN')}`,
  );
  console.log(
    `  Closing Stock (Main): ${Math.round(mainClosingKG).toLocaleString('en-IN')} kg`,
  );
  console.log(`  Purchases are ALL CASH (no credit for purchases)`);
}

// ── Grand totals ─────────────────────────────────────────────
const grandPurch = allResults.reduce((s, r) => s + r.PURCHASE_TAB.amount, 0);
const grandSales = allResults.reduce((s, r) => s + r.SALES_TAB.amount, 0);
const grandCash = allResults.reduce((s, r) => s + r.SALES_TAB.cash, 0);
const grandCredit = allResults.reduce((s, r) => s + r.SALES_TAB.credit, 0);
const grandTxns = allResults.reduce((s, r) => s + r.SALES_TAB.transactions, 0);

console.log('\n' + '═'.repeat(70));
console.log('CROSS-VALIDATION SUMMARY — Nov 2022 to Mar 2023');
console.log('═'.repeat(70));
allResults.forEach((r) => {
  const allOk = Object.values(r.CHECKS).every((v) => v === true || v === null);
  const flags = [
    r.CHECKS.purchAmt ? '✅P' : '❌P',
    r.CHECKS.salesAmt ? '✅S' : '❌S',
    r.CHECKS.cashPlusDebtEqTotal === null
      ? '➖C'
      : r.CHECKS.cashPlusDebtEqTotal
        ? '✅C'
        : '❌C',
  ].join(' ');
  console.log(
    `  ${allOk ? '✅' : '❌'} ${r.month}  ${flags}  [P=Purchase S=Sales C=Cash+Credit check]`,
  );
});

console.log(`\n  5-Month Totals (from detailed tabs):`);
console.log(`  ┌─────────────────────────────────────────────┐`);
console.log(
  `  │ Total Purchases (ALL CASH): ₹${Math.round(grandPurch).toLocaleString('en-IN').padStart(12)} │`,
);
console.log(
  `  │ Total Sales:               ₹${Math.round(grandSales).toLocaleString('en-IN').padStart(12)} │`,
);
console.log(
  `  │   ├─ Cash Sales:           ₹${Math.round(grandCash).toLocaleString('en-IN').padStart(12)} │`,
);
console.log(
  `  │   └─ Credit Sales:         ₹${Math.round(grandCredit).toLocaleString('en-IN').padStart(12)} │`,
);
console.log(
  `  │ Total Transactions:        ${grandTxns.toString().padStart(13)} │`,
);
console.log(`  └─────────────────────────────────────────────┘`);

writeFileSync(
  join(__dirname, 'data/monthly_main_vs_tabs_validation_2022_23.json'),
  JSON.stringify(allResults, null, 2),
);
console.log(
  '\n📄 Saved → script/data/monthly_main_vs_tabs_validation_2022_23.json',
);
