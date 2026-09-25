/**
 * Detailed Side-by-Side Comparison:
 * Main/Summary Tab vs Customer Sales and Purchase Records (2022-23)
 * Demonstrates exact reconciliation once Daalu (Pickup Service) is isolated.
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

const MONTHS = [
  {
    key: 'Nov-2022',
    period: '2022-11',
    id: '1hrs0IxXvTS146ukGPyQ3zts2dsgnq_vAQYiR4TQUuGo',
    mainTab: 'Sheet1',
  },
  {
    key: 'Dec-2022',
    period: '2022-12',
    id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE',
    mainTab: 'Sheet1',
  },
  {
    key: 'Jan-2023',
    period: '2023-01',
    id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q',
    mainTab: 'Sheet1',
  },
  {
    key: 'Feb-2023',
    period: '2023-02',
    id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M',
    mainTab: 'Main',
  },
  {
    key: 'Mar-2023',
    period: '2023-03',
    id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0',
    mainTab: 'Main',
  },
];

const report = [];

for (const m of MONTHS) {
  // 1. Read Main/Sheet1 Tab
  const mResp = await sheets.spreadsheets.values.get({
    spreadsheetId: m.id,
    range: `${m.mainTab}!A1:F20`,
  });
  await delay(300);
  const mRows = mResp.data.values || [];

  let mainPurchKg = 0,
    mainPurchRate = 0,
    mainPurchAmt = 0;
  let mainSalesKg = 0,
    mainSalesRate = 0,
    mainSalesAmt = 0;

  mRows.forEach((r) => {
    const label = (r[0] || '').trim();
    if (/Purchange|Purchase/.test(label) && label.startsWith('B.')) {
      mainPurchKg = parseNum(r[1]);
      mainPurchRate = parseNum(r[2]);
      mainPurchAmt = parseNum(r[3]);
    }
    if (label === 'D. Sales' || /^D\. Sales/.test(label)) {
      mainSalesKg = parseNum(r[1]);
      mainSalesRate = parseNum(r[2]);
      mainSalesAmt = parseNum(r[3]);
    }
  });

  // 2. Read Purchase Tab
  const pResp = await sheets.spreadsheets.values.get({
    spreadsheetId: m.id,
    range: 'Purchase!A1:G100',
  });
  await delay(300);
  const pRows = pResp.data.values || [];
  let tabPurchKg = 0,
    tabPurchAmt = 0,
    pTxCount = 0;

  for (let i = 1; i < pRows.length; i++) {
    const r = pRows[i];
    const vendor = (r[0] || '').trim();
    if (!vendor || vendor.toLowerCase().includes('total')) continue;
    const kg = parseNum(r[2]);
    const amt = parseNum(r[4]) || kg * parseNum(r[3]);
    tabPurchKg += kg;
    tabPurchAmt += amt;
    pTxCount++;
  }

  // 3. Read Sales Tab
  const sResp = await sheets.spreadsheets.values.get({
    spreadsheetId: m.id,
    range: 'Sales!A1:L250',
  });
  await delay(300);
  const sRows = sResp.data.values || [];

  // Find header row of bottom section
  let bottomHeaderIdx = -1;
  for (let i = 0; i < sRows.length; i++) {
    const txt = (sRows[i][0] || '').toLowerCase().trim();
    if (txt.includes('daalu diesel') || txt.includes('daalu  diesel')) {
      bottomHeaderIdx = i;
      break;
    }
  }

  // Find Total row of customer sales
  let custTotalIdx = -1;
  for (
    let i = bottomHeaderIdx >= 0 ? bottomHeaderIdx - 1 : sRows.length - 1;
    i >= 0;
    i--
  ) {
    if ((sRows[i][0] || '').toLowerCase().trim() === 'total') {
      custTotalIdx = i;
      break;
    }
  }

  const endIdx =
    custTotalIdx >= 0
      ? custTotalIdx
      : bottomHeaderIdx >= 0
        ? bottomHeaderIdx
        : sRows.length;

  let tabSalesKg = 0;
  let tabGrassSalesAmt = 0;
  let tabDaaluPickupAmt = 0;
  let tabTotalAmt = 0;
  let tabCashPaid = 0;
  let tabCreditAmt = 0;
  let tabBrokerageAmt = 0;
  let sTxCount = 0;

  for (let i = 1; i < endIdx; i++) {
    const r = sRows[i];
    const name = (r[0] || '').trim();
    if (!name || name.toLowerCase().includes('total')) continue;

    const kg = parseNum(r[2]);
    let grassAmt = 0,
      daaluAmt = 0,
      total = 0,
      cash = 0,
      credit = 0;

    // Check for brokerage row (like in March)
    if (
      name.toLowerCase().includes('brok') ||
      name.toLowerCase().includes('commis')
    ) {
      const bAmt = parseNum(r[4]);
      tabBrokerageAmt += bAmt;
      tabSalesKg += kg;
      tabGrassSalesAmt += bAmt; // In March, Brokerage is included in the D. Sales summary
      tabTotalAmt += bAmt;
      tabCashPaid += parseNum(r[5]);
      continue;
    }

    if (m.key !== 'Mar-2023') {
      // Nov, Dec, Jan, Feb all have: [Name, Date, KG, Rates, Kasar, Total Grass, Daalu, Total, Cash, Debt]
      grassAmt = parseNum(r[5]);
      daaluAmt = parseNum(r[6]);
      total = parseNum(r[7]);
      cash = parseNum(r[8]);
      credit = parseNum(r[9]);
    } else {
      // Mar 2023: [Name, Date, KG, Rates, Total, Cash, Debt]
      total = parseNum(r[4]);
      grassAmt = total;
      daaluAmt = 0;
      cash = parseNum(r[5]);
      credit = parseNum(r[6]);
    }

    if (total === 0 && kg > 0) {
      grassAmt = kg * parseNum(r[3]);
      total = grassAmt + daaluAmt;
      credit = Math.max(0, total - cash);
    }

    tabSalesKg += kg;
    tabGrassSalesAmt += grassAmt;
    tabDaaluPickupAmt += daaluAmt;
    tabTotalAmt += total;
    tabCashPaid += cash;
    tabCreditAmt += credit;
    sTxCount++;
  }

  // Comparisons
  const purchKgDiff = tabPurchKg - mainPurchKg;
  const purchAmtDiff = tabPurchAmt - mainPurchAmt;
  const salesKgDiff = tabSalesKg - mainSalesKg;
  const grassSalesAmtDiff = tabGrassSalesAmt - mainSalesAmt;

  report.push({
    month: m.key,
    purchases: {
      main: { kg: mainPurchKg, rate: mainPurchRate, amount: mainPurchAmt },
      tab: { kg: tabPurchKg, amount: tabPurchAmt, txCount: pTxCount },
      kgDiff: purchKgDiff,
      amtDiff: purchAmtDiff,
      isExactMatch: Math.abs(purchAmtDiff) < 1 && Math.abs(purchKgDiff) < 1,
    },
    sales: {
      main: { kg: mainSalesKg, rate: mainSalesRate, amount: mainSalesAmt },
      tab: {
        kg: tabSalesKg,
        grassAmount: tabGrassSalesAmt,
        daaluAmount: tabDaaluPickupAmt,
        totalWithDaalu: tabTotalAmt,
        cashPaid: tabCashPaid,
        creditDebt: tabCreditAmt,
        brokerage: tabBrokerageAmt,
        txCount: sTxCount,
      },
      kgDiff: salesKgDiff,
      grassAmtDiff: grassSalesAmtDiff,
      isGrassMatch:
        Math.abs(grassSalesAmtDiff) < 2 && Math.abs(salesKgDiff) < 2,
    },
  });
}

console.log(
  '══════════════════════════════════════════════════════════════════════════════════════════════════',
);
console.log(
  '📌 COMPLETE MONTHLY RECONCILIATION: MAIN TAB vs CUSTOMER TRANSACTIONS (2022-23)',
);
console.log(
  '══════════════════════════════════════════════════════════════════════════════════════════════════',
);

for (const r of report) {
  console.log(`\n📅 ${r.month}:`);
  console.log(
    '  ────────────────────────────────────────────────────────────────────────────────────────────────',
  );
  console.log('  🛒 PURCHASES (ALL CASH):');
  console.log(
    `     Main Tab Summary : ${r.purchases.main.kg.toLocaleString()} kg @ ₹${r.purchases.main.rate} = ₹${r.purchases.main.amount.toLocaleString('en-IN')}`,
  );
  console.log(
    `     Purchase Records : ${r.purchases.tab.kg.toLocaleString()} kg (${r.purchases.tab.txCount} sellers) = ₹${r.purchases.tab.amount.toLocaleString('en-IN')}`,
  );
  console.log(
    `     Variance         : KG Diff: ${r.purchases.kgDiff} | Amount Diff: ₹${r.purchases.amtDiff}  →  ${r.purchases.isExactMatch ? '✅ EXACT 100% MATCH' : '❌ VARIANCE'}`,
  );

  console.log('\n  🌾 SALES:');
  console.log(
    `     Main Tab Summary : ${r.sales.main.kg.toLocaleString()} kg @ ₹${r.sales.main.rate} = ₹${r.sales.main.amount.toLocaleString('en-IN')} (Grass Sales)`,
  );
  console.log(
    `     Customer Records : ${r.sales.tab.kg.toLocaleString()} kg (${r.sales.tab.txCount} customer sales)`,
  );
  console.log(
    `                        ├─ Grass Sales:  ₹${r.sales.tab.grassAmount.toLocaleString('en-IN')}`,
  );
  console.log(
    `                        ├─ Daalu Pickup: ₹${r.sales.tab.daaluAmount.toLocaleString('en-IN')} (Delivery Service)`,
  );
  if (r.sales.tab.brokerage > 0) {
    console.log(
      `                        ├─ Brokerage:    ₹${r.sales.tab.brokerage.toLocaleString('en-IN')} (Commission)`,
    );
  }
  console.log(
    `                        └─ Gross Total:  ₹${r.sales.tab.totalWithDaalu.toLocaleString('en-IN')}`,
  );
  console.log(
    `     Cash / Credit    : Cash: ₹${r.sales.tab.cashPaid.toLocaleString('en-IN')} | Credit (Debt): ₹${r.sales.tab.creditDebt.toLocaleString('en-IN')}`,
  );
  console.log(
    `     Grass Sales Match: KG Diff: ${r.sales.kgDiff} | Amount Diff: ₹${r.sales.grassAmtDiff.toFixed(2)}  →  ${r.sales.isGrassMatch ? '✅ EXACT 100% MATCH' : '❌ VARIANCE'}`,
  );
}

writeFileSync(
  join(__dirname, 'data/main_vs_customer_tabs_comparison_2022_23.json'),
  JSON.stringify(report, null, 2),
);
console.log(
  '\n📄 Saved detailed comparison to script/data/main_vs_customer_tabs_comparison_2022_23.json',
);
