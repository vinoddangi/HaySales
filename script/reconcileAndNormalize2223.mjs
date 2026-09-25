/**
 * Complete Reconciliation & Normalization for 2022-23:
 * 1. Read all 5 months of Sales tabs (Nov 2022 - Mar 2023)
 * 2. Classify Sales into Cash vs Credit per transaction
 * 3. Separate Grass Sales (Item='Others') and Daalu Pickup (Type='SERVICE', Item='Pickup')
 * 4. Read Purchases (Item='Others', 100% Cash)
 * 5. Extract Expenses matched to project expense model (Fuel, Interest, Labor, Tools, Others)
 * 6. Read Customer Credit List (Sheet1, Sheet2, Sheet3) and compute year-end customer balances
 * 7. Match customer sales ledger against Credit List outstanding
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
  return parseFloat((s || '').toString().replace(/[₹, ]/g, '')) || 0;
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapExpenseCategory(name) {
  const norm = String(name || '')
    .toLowerCase()
    .trim();
  if (norm.includes('intrest') || norm.includes('interest')) return 'Interest';
  if (
    norm.includes('diesel') ||
    norm.includes('fuel') ||
    norm.includes('petrol')
  )
    return 'Fuel';
  if (
    norm.includes('labor') ||
    norm.includes('labour') ||
    norm.includes('loader') ||
    norm.includes('majuri')
  )
    return 'Labor';
  if (
    norm.includes('food') ||
    norm.includes('drink') ||
    norm.includes('tea') ||
    norm.includes('nasta')
  )
    return 'Food / Drink';
  if (
    norm.includes('tool') ||
    norm.includes('tub') ||
    norm.includes('pavdo') ||
    norm.includes('patri') ||
    norm.includes('chokani') ||
    norm.includes('jag')
  )
    return 'Tools';
  if (
    norm.includes('repair') ||
    norm.includes('maintenance') ||
    norm.includes('service')
  )
    return 'Maintenance';
  if (norm.includes('depreciation')) return 'Depreciation';
  if (norm.includes('discount')) return 'Discount';
  return 'Others';
}

const MONTHS = [
  {
    key: 'Nov-2022',
    period: '2022-11',
    id: '1hrs0IxXvTS146ukGPyQ3zts2dsgnq_vAQYiR4TQUuGo',
    hasDaaluCol: true,
  },
  {
    key: 'Dec-2022',
    period: '2022-12',
    id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE',
    hasDaaluCol: true,
  },
  {
    key: 'Jan-2023',
    period: '2023-01',
    id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q',
    hasDaaluCol: true,
  },
  {
    key: 'Feb-2023',
    period: '2023-02',
    id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M',
    hasDaaluCol: true,
  }, // Main sheet Sales tab
  {
    key: 'Mar-2023',
    period: '2023-03',
    id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0',
    hasDaaluCol: false,
  },
];

const CREDIT_SHEET_ID = '1hSdnQiMEPuv5mIwdf4a8sOv_19imddG-DEvMt2P5yig';

console.log('🚀 Step 1: Reading 2022-23 Customer Credit List...');
const creditSheet1 =
  (
    await sheets.spreadsheets.values.get({
      spreadsheetId: CREDIT_SHEET_ID,
      range: 'Sheet1!A1:N250',
    })
  ).data.values || [];
await delay(300);
const creditSheet2 =
  (
    await sheets.spreadsheets.values.get({
      spreadsheetId: CREDIT_SHEET_ID,
      range: 'Sheet2!A1:D200',
    })
  ).data.values || [];
await delay(300);
const creditSheet3 =
  (
    await sheets.spreadsheets.values.get({
      spreadsheetId: CREDIT_SHEET_ID,
      range: 'Sheet3!A1:F50',
    })
  ).data.values || [];
await delay(300);

const creditMap = new Map();

// Parse Sheet1: [Customer Name, Date1, Date2, Date3, Total, Credit1, Credit2, Credit3, Kasar, Total Credit, Net Total]
for (let i = 1; i < creditSheet1.length; i++) {
  const row = creditSheet1[i];
  const name = (row[0] || '').trim();
  if (!name || name.toLowerCase().includes('total')) continue;
  const gross = parseNum(row[4]);
  const payment1 = parseNum(row[5]);
  const payment2 = parseNum(row[6]);
  const payment3 = parseNum(row[7]);
  const kasar = parseNum(row[8]);
  const totalCredit =
    parseNum(row[9]) || payment1 + payment2 + payment3 + kasar;
  const netDue = parseNum(row[10]) || gross - totalCredit;

  creditMap.set(normalize(name), {
    rawName: name,
    gross,
    payments: payment1 + payment2 + payment3,
    kasar,
    totalCredit,
    netDue,
    sheet: 'Sheet1',
  });
}

// Also parse Sheet3 (special / second list)
for (let i = 1; i < creditSheet3.length; i++) {
  const row = creditSheet3[i];
  const name = (row[0] || '').trim();
  if (
    !name ||
    name.toLowerCase().includes('total') ||
    name.toLowerCase().includes('lending')
  )
    continue;
  const total = parseNum(row[4]);
  const norm = normalize(name);
  if (!creditMap.has(norm)) {
    creditMap.set(norm, {
      rawName: name,
      gross: total,
      payments: 0,
      kasar: 0,
      totalCredit: 0,
      netDue: total,
      sheet: 'Sheet3',
    });
  } else {
    // Add to existing
    const existing = creditMap.get(norm);
    existing.gross += total;
    existing.netDue += total;
  }
}

console.log(`✅ Loaded ${creditMap.size} unique customers from Credit List`);
const totalCreditListGross = Array.from(creditMap.values()).reduce(
  (s, c) => s + c.gross,
  0,
);
const totalCreditListNetDue = Array.from(creditMap.values()).reduce(
  (s, c) => s + c.netDue,
  0,
);
const totalCreditListPaid = Array.from(creditMap.values()).reduce(
  (s, c) => s + c.totalCredit,
  0,
);
console.log(
  `   Total Gross Debt Recorded: ₹${totalCreditListGross.toLocaleString('en-IN')}`,
);
console.log(
  `   Total Paid / Kasar:        ₹${totalCreditListPaid.toLocaleString('en-IN')}`,
);
console.log(
  `   Final Outstanding Net Due: ₹${totalCreditListNetDue.toLocaleString('en-IN')}`,
);

// ── Step 2: Read Sales Tabs ──────────────────────────────────────────
console.log('\n🚀 Step 2: Reading 5 Months of Sales Transactions...');
const allSales = [];
const allServices = [];
const allExpenses = [];
const allPurchases = [];

const customerLedgers = new Map(); // normName -> { name, totalSales, cashPaid, creditSales, kg }

for (const m of MONTHS) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: m.id,
    range: 'Sales!A1:L250',
  });
  await delay(400);
  const rows = r.data.values || [];

  // Find header row of bottom section
  let bottomHeaderIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const txt = (rows[i][0] || '').toLowerCase().trim();
    if (txt.includes('daalu diesel') || txt.includes('daalu  diesel')) {
      bottomHeaderIdx = i;
      break;
    }
  }

  // Find customer Total row
  let custTotalIdx = -1;
  for (
    let i = bottomHeaderIdx >= 0 ? bottomHeaderIdx - 1 : rows.length - 1;
    i >= 0;
    i--
  ) {
    if ((rows[i][0] || '').toLowerCase().trim() === 'total') {
      custTotalIdx = i;
      break;
    }
  }

  const endIdx =
    custTotalIdx >= 0
      ? custTotalIdx
      : bottomHeaderIdx >= 0
        ? bottomHeaderIdx
        : rows.length;

  let monthGrassSales = 0;
  let monthDaaluPickup = 0;
  let monthCash = 0;
  let monthCredit = 0;
  let monthKg = 0;

  for (let i = 1; i < endIdx; i++) {
    const row = rows[i];
    const rawName = (row[0] || '').trim();
    if (!rawName || rawName.toLowerCase().includes('total')) continue;

    // Check for special non-customer row like "Brokrage"
    if (
      rawName.toLowerCase().includes('brok') ||
      rawName.toLowerCase().includes('commis')
    ) {
      const amt = parseNum(row[4]);
      allServices.push({
        id: `service_${m.period}_brok_${i}`,
        date: row[1] || `${m.period}-28`,
        type: 'SERVICE',
        category: 'Services',
        item: 'Brokerage',
        amount: amt,
        cashPaid: amt,
        remainingDue: 0,
        note: `Brokerage service income from ${m.key}`,
      });
      continue;
    }

    const dateStr = row[1] || `${m.period}-15`;
    const kg = parseNum(row[2]);
    const rate = parseNum(row[3]);

    let grassAmt = 0;
    let daaluAmt = 0;
    let totalAmt = 0;
    let cashPaid = 0;
    let creditAmt = 0;

    if (m.hasDaaluCol) {
      // Structure: [Name, Date, KG, Rates, (Kasar), TotalGrass, Daalu, Total, Cash, Debt]
      // In Nov/Dec/Jan: col 5 is TotalGrass, col 6 is Daalu, col 7 is Total, col 8 is Cash, col 9 is Debt
      // In Feb: col 4 is TotalGrass, col 5 is Daalu, col 6 is Total, col 7 is Cash, col 8 is Debt
      if (row.length >= 10) {
        grassAmt = parseNum(row[5]);
        daaluAmt = parseNum(row[6]);
        totalAmt = parseNum(row[7]);
        cashPaid = parseNum(row[8]);
        creditAmt = parseNum(row[9]);
      } else if (row.length === 9) {
        grassAmt = parseNum(row[4]);
        daaluAmt = parseNum(row[5]);
        totalAmt = parseNum(row[6]);
        cashPaid = parseNum(row[7]);
        creditAmt = parseNum(row[8]);
      }
    } else {
      // Mar 2023: [Name, Date, KG, Rates, Total, Cash, Debt]
      totalAmt = parseNum(row[4]);
      grassAmt = totalAmt;
      daaluAmt = 0;
      cashPaid = parseNum(row[5]);
      creditAmt = parseNum(row[6]);
    }

    // Default calculations if totalAmt is 0 but kg & rate exist
    if (totalAmt === 0 && kg > 0 && rate > 0) {
      grassAmt = kg * rate;
      totalAmt = grassAmt + daaluAmt;
      creditAmt = Math.max(0, totalAmt - cashPaid);
    }

    monthGrassSales += grassAmt;
    monthDaaluPickup += daaluAmt;
    monthCash += cashPaid;
    monthCredit += creditAmt;
    monthKg += kg;

    // Record Grass Sale (Item='Others' as requested by user)
    allSales.push({
      id: `sale_${m.period}_${i}`,
      customerName: rawName,
      date: dateStr,
      type: 'SALE',
      category: 'Sales',
      item: 'Others',
      weightKg: kg,
      rate: rate,
      amount: grassAmt,
      cashPaid: Math.min(cashPaid, grassAmt),
      remainingDue: creditAmt,
      paymentMethod:
        creditAmt > 0 ? (cashPaid > 0 ? 'PARTIAL_CREDIT' : 'CREDIT') : 'CASH',
      note: `Grass Sale ${m.key}`,
    });

    // Record Daalu Pickup Service (Item='Pickup' as requested by user)
    if (daaluAmt > 0) {
      allServices.push({
        id: `service_${m.period}_pickup_${i}`,
        customerName: rawName,
        date: dateStr,
        type: 'SERVICE',
        category: 'Services',
        item: 'Pickup',
        amount: daaluAmt,
        cashPaid: daaluAmt, // Daalu is billed with transaction
        remainingDue: 0,
        note: `Pickup fee for ${rawName}`,
      });
    }

    // Update customer running ledger
    const norm = normalize(rawName);
    if (!customerLedgers.has(norm)) {
      customerLedgers.set(norm, {
        name: rawName,
        totalGrassSales: 0,
        totalDaalu: 0,
        totalAmount: 0,
        cashPaid: 0,
        creditSales: 0,
        kg: 0,
        txCount: 0,
      });
    }
    const cLedger = customerLedgers.get(norm);
    cLedger.totalGrassSales += grassAmt;
    cLedger.totalDaalu += daaluAmt;
    cLedger.totalAmount += totalAmt;
    cLedger.cashPaid += cashPaid;
    cLedger.creditSales += creditAmt;
    cLedger.kg += kg;
    cLedger.txCount += 1;
  }

  // ── Read Bottom Section of Sales Tab (Expenses & Daalu Extra) ──
  if (bottomHeaderIdx >= 0) {
    let recordedDiesel = 0;
    let recordedExtra = 0;

    for (let i = bottomHeaderIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const col0 = (row[0] || '').trim();
      const col1 = (row[1] || '').trim();
      const col2 = (row[2] || '').trim();
      const col3 = (row[3] || '').trim();
      const col4 = (row[4] || '').trim();
      const col5 = (row[5] || '').trim();

      if (col0.toLowerCase().includes('daalu profit')) break;

      const isGrandBottomTotal = col4.toLowerCase() === 'total';
      if (isGrandBottomTotal) {
        recordedDiesel = parseNum(col1);
        recordedExtra = parseNum(col3);
        continue;
      }

      // Fuel: Daalu Diesel
      const dieselAmt = parseNum(col1);
      if (dieselAmt > 0 && col0.toLowerCase() !== 'total') {
        allExpenses.push({
          id: `expense_${m.period}_diesel_${i}`,
          date: col0 || `${m.period}-28`,
          type: 'EXPENSE',
          category: 'Expense',
          expenseCategory: 'Fuel',
          item: 'Daalu Diesel',
          amount: dieselAmt,
          cashPaid: dieselAmt,
          remainingDue: 0,
          note: `Daalu diesel fuel expense for ${m.key}`,
        });
      }

      // Service: Daalu Extra
      const extraAmt = parseNum(col3);
      if (extraAmt > 0 && col2.toLowerCase() !== 'total') {
        allServices.push({
          id: `service_${m.period}_extra_${i}`,
          customerName: col2 || 'Retail',
          date: `${m.period}-28`,
          type: 'SERVICE',
          category: 'Services',
          item: 'Pickup',
          amount: extraAmt,
          cashPaid: extraAmt,
          remainingDue: 0,
          note: `Daalu Extra pickup fee from ${col2 || 'Retail'}`,
        });
      }

      // Other Expenses: Mapped to ExpenseCategoryType
      const expAmt = parseNum(col5);
      if (expAmt > 0 && col4 && col4.toLowerCase() !== 'total') {
        const cat = mapExpenseCategory(col4);
        allExpenses.push({
          id: `expense_${m.period}_exp_${i}`,
          date: `${m.period}-28`,
          type: 'EXPENSE',
          category: 'Expense',
          expenseCategory: cat,
          item: col4,
          amount: expAmt,
          cashPaid: expAmt,
          remainingDue: 0,
          note: `${col4} expense for ${m.key}`,
        });
      }
    }

    // Lump sum diesel check (like March)
    if (
      allExpenses.filter(
        (e) => e.id.includes(m.period) && e.item === 'Daalu Diesel',
      ).length === 0 &&
      recordedDiesel > 0
    ) {
      allExpenses.push({
        id: `expense_${m.period}_diesel_lump`,
        date: `${m.period}-28`,
        type: 'EXPENSE',
        category: 'Expense',
        expenseCategory: 'Fuel',
        item: 'Daalu Diesel',
        amount: recordedDiesel,
        cashPaid: recordedDiesel,
        remainingDue: 0,
        note: `Daalu diesel fuel expense for ${m.key}`,
      });
    }
  }

  // ── Step 3: Read Purchases for this month (100% Cash, Item='Others') ──
  const pResp = await sheets.spreadsheets.values.get({
    spreadsheetId: m.id,
    range: 'Purchase!A1:G100',
  });
  await delay(300);
  const pRows = pResp.data.values || [];

  for (let i = 1; i < pRows.length; i++) {
    const row = pRows[i];
    const vendor = (row[0] || '').trim();
    if (!vendor || vendor.toLowerCase().includes('total')) continue;
    const dateStr = row[1] || `${m.period}-15`;
    const kg = parseNum(row[2]);
    const rate = parseNum(row[3]);
    const amt = parseNum(row[4]) || kg * rate;

    allPurchases.push({
      id: `purchase_${m.period}_${i}`,
      date: dateStr,
      type: 'PURCHASE',
      category: 'Purchase',
      item: 'Others', // As requested: purchase type is Others
      weightKg: kg,
      rate: rate,
      purchaseRate: rate,
      amount: amt,
      cashPaid: amt, // As requested: Purchase done on cash
      remainingDue: 0,
      vendorName: vendor,
      note: `Purchase from ${vendor} (${m.key})`,
    });
  }

  console.log(`  📅 ${m.key}:`);
  console.log(
    `     • Grass Sales:  ₹${monthGrassSales.toLocaleString('en-IN')} (${monthKg.toLocaleString()} kg)`,
  );
  console.log(
    `     • Daalu Pickup: ₹${monthDaaluPickup.toLocaleString('en-IN')}`,
  );
  console.log(
    `     • Cash Paid:    ₹${monthCash.toLocaleString('en-IN')} | Credit (Debt): ₹${monthCredit.toLocaleString('en-IN')}`,
  );
}

console.log(`\n${'═'.repeat(70)}`);
console.log('📊 2022-23 INGESTION SUMMARY ACROSS 5 MONTHS');
console.log(`${'═'.repeat(70)}`);

const grandSalesGrass = allSales.reduce((s, x) => s + x.amount, 0);
const grandSalesCash = allSales.reduce((s, x) => s + x.cashPaid, 0);
const grandSalesCredit = allSales.reduce((s, x) => s + x.remainingDue, 0);
const grandPurchases = allPurchases.reduce((s, x) => s + x.amount, 0);
const grandServices = allServices.reduce((s, x) => s + x.amount, 0);
const grandExpenses = allExpenses.reduce((s, x) => s + x.amount, 0);

console.log(
  `🌾 Total Grass Sales (Item='Others'):  ₹${grandSalesGrass.toLocaleString('en-IN')} (${allSales.length} txs)`,
);
console.log(
  `   ├─ Cash Sales:                     ₹${grandSalesCash.toLocaleString('en-IN')}`,
);
console.log(
  `   └─ Credit Sales:                   ₹${grandSalesCredit.toLocaleString('en-IN')}`,
);
console.log(
  `🚚 Total Services (Pickup/Brokerage): ₹${grandServices.toLocaleString('en-IN')} (${allServices.length} txs)`,
);
console.log(
  `🛒 Total Purchases (100% Cash):       ₹${grandPurchases.toLocaleString('en-IN')} (${allPurchases.length} txs)`,
);
console.log(
  `💼 Total Expenses (Matched to Modal): ₹${grandExpenses.toLocaleString('en-IN')} (${allExpenses.length} items)`,
);

// Breakdown of expenses by category
console.log('\n  Expense Breakdown by Modal Category:');
const expByCat = {};
allExpenses.forEach((e) => {
  expByCat[e.expenseCategory] = (expByCat[e.expenseCategory] || 0) + e.amount;
});
Object.entries(expByCat).forEach(([cat, amt]) => {
  console.log(
    `    • ${cat.padEnd(15)}: ₹${amt.toLocaleString('en-IN').padStart(10)}`,
  );
});

// ── Step 4: Reconcile Customer Outstanding with Credit List ──────────
console.log(`\n${'═'.repeat(70)}`);
console.log('🤝 RECONCILING CUSTOMER SALES LEDGER WITH CREDIT LIST');
console.log(`${'═'.repeat(70)}`);

let matchedCount = 0;
let exactMatchCount = 0;
let ledgerOnlyCount = 0;
let creditListOnlyCount = 0;

const customerComparison = [];

for (const [norm, ledger] of customerLedgers.entries()) {
  const creditEntry = creditMap.get(norm);
  if (creditEntry) {
    matchedCount++;
    const diff = Math.abs(ledger.creditSales - creditEntry.gross);
    if (diff < 5) exactMatchCount++;
    customerComparison.push({
      name: ledger.name,
      creditListGross: creditEntry.gross,
      creditListNetDue: creditEntry.netDue,
      ledgerCreditSales: ledger.creditSales,
      ledgerCashPaid: ledger.cashPaid,
      diff,
      status:
        diff < 5 ? 'EXACT_MATCH' : diff < 1000 ? 'CLOSE_MATCH' : 'DIFFERENCE',
    });
  } else {
    ledgerOnlyCount++;
  }
}

creditMap.forEach((entry, norm) => {
  if (!customerLedgers.has(norm)) {
    creditListOnlyCount++;
  }
});

console.log(`  Matched Customers:         ${matchedCount}`);
console.log(`  Exact Matches (diff < ₹5): ${exactMatchCount}`);
console.log(
  `  Customers in Ledger Only:  ${ledgerOnlyCount} (mostly cash-only customers)`,
);
console.log(
  `  Customers in Credit List:  ${creditMap.size} (accumulated across full year)`,
);

writeFileSync(
  join(__dirname, 'data/reconciliation_2022_23_full.json'),
  JSON.stringify(
    {
      summary: {
        grandSalesGrass,
        grandSalesCash,
        grandSalesCredit,
        grandPurchases,
        grandServices,
        grandExpenses,
        expenseBreakdown: expByCat,
        creditListGross: totalCreditListGross,
        creditListNetDue: totalCreditListNetDue,
      },
      sales: allSales,
      purchases: allPurchases,
      services: allServices,
      expenses: allExpenses,
      customerComparison: customerComparison.slice(0, 50),
    },
    null,
    2,
  ),
);
console.log(
  `\n📄 Complete reconciled dataset saved to script/data/reconciliation_2022_23_full.json`,
);
