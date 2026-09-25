/**
 * Robust extraction of bottom section of Sales tab for 2022-23:
 * - Daalu Diesel (Fuel Expense)
 * - Daalu Extra (Pickup Service Income)
 * - Monthly Expenses mapped to VALID_EXPENSE_CATEGORIES
 * - Sales and Purchases items set to 'Others'
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

export function parseNum(s) {
  return parseFloat((s || '').toString().replace(/[₹, ]/g, '')) || 0;
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
  },
  {
    key: 'Dec-2022',
    period: '2022-12',
    id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE',
  },
  {
    key: 'Jan-2023',
    period: '2023-01',
    id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q',
  },
  {
    key: 'Feb-2023',
    period: '2023-02',
    id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M',
  },
  {
    key: 'Mar-2023',
    period: '2023-03',
    id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0',
  },
];

const results = [];

for (const m of MONTHS) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: m.id,
    range: 'Sales!A1:L250',
  });
  await delay(400);
  const rows = r.data.values || [];

  // Find header row of bottom table: "Daalu diesel"
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const txt = (rows[i][0] || '').toLowerCase().trim();
    if (txt.includes('daalu diesel') || txt.includes('daalu  diesel')) {
      headerIdx = i;
      break;
    }
  }

  // Find customer grand total row (preceding the header)
  let custTotalRow = null;
  let custTotalIdx = -1;
  for (let i = headerIdx >= 0 ? headerIdx - 1 : rows.length - 1; i >= 0; i--) {
    if ((rows[i][0] || '').toLowerCase().trim() === 'total') {
      custTotalRow = rows[i];
      custTotalIdx = i;
      break;
    }
  }

  const monthExpenses = [];
  const monthDaaluDiesel = [];
  const monthDaaluExtra = [];
  let summaryDaaluProfit = 0;
  let recordedDieselTotal = 0;
  let recordedDaaluExtraTotal = 0;
  let recordedExpensesTotal = 0;

  if (headerIdx >= 0) {
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const col0 = (row[0] || '').trim();
      const col1 = (row[1] || '').trim();
      const col2 = (row[2] || '').trim();
      const col3 = (row[3] || '').trim();
      const col4 = (row[4] || '').trim();
      const col5 = (row[5] || '').trim();

      // Check for Daalu Profit row
      if (col0.toLowerCase().includes('daalu profit')) {
        summaryDaaluProfit = parseNum(row[1]);
        break;
      }

      // Check if this row is the summary Total row for all columns (e.g. Total | 8500 | Total | 32850 | Total | 11100)
      const isGrandBottomTotal = col4.toLowerCase() === 'total';
      if (isGrandBottomTotal) {
        recordedDieselTotal = parseNum(col1);
        recordedDaaluExtraTotal = parseNum(col3);
        recordedExpensesTotal = parseNum(col5);
        continue;
      }

      // 1. Daalu Diesel entries (Cols 0 & 1)
      const dieselAmt = parseNum(col1);
      if (dieselAmt > 0 && col0.toLowerCase() !== 'total') {
        monthDaaluDiesel.push({
          date: col0 || `${m.period}-28`,
          amount: dieselAmt,
          item: 'Daalu Diesel',
          category: 'Expense',
          expenseCategory: 'Fuel',
        });
      }

      // 2. Daalu Extra entries (Cols 2 & 3)
      const extraAmt = parseNum(col3);
      if (extraAmt > 0 && col2.toLowerCase() !== 'total') {
        monthDaaluExtra.push({
          description: col2 || 'Daalu Extra',
          amount: extraAmt,
          item: 'Pickup',
          category: 'Services',
        });
      }

      // 3. Other Expenses entries (Cols 4 & 5)
      const expAmt = parseNum(col5);
      if (expAmt > 0 && col4 && col4.toLowerCase() !== 'total') {
        const cat = mapExpenseCategory(col4);
        monthExpenses.push({
          date: `${m.period}-28`,
          item: col4,
          amount: expAmt,
          category: 'Expense',
          expenseCategory: cat,
        });
      }
    }

    // If individual diesel items weren't listed but a lump sum recorded total exists (like March)
    if (monthDaaluDiesel.length === 0 && recordedDieselTotal > 0) {
      monthDaaluDiesel.push({
        date: `${m.period}-28`,
        amount: recordedDieselTotal,
        item: 'Daalu Diesel',
        category: 'Expense',
        expenseCategory: 'Fuel',
      });
    }
  }

  // Calculate totals
  const totalDiesel = monthDaaluDiesel.reduce((s, x) => s + x.amount, 0);
  const totalExtraDaalu = monthDaaluExtra.reduce((s, x) => s + x.amount, 0);
  const totalExpenses = monthExpenses.reduce((s, x) => s + x.amount, 0);

  // Check special entries in customer rows (like Brokrage in March)
  const specialCustomerRows = [];
  if (custTotalIdx > 0) {
    for (let i = 1; i < custTotalIdx; i++) {
      const name = (rows[i][0] || '').toLowerCase();
      if (name.includes('brok') || name.includes('commis')) {
        specialCustomerRows.push({
          rowIdx: i,
          item: rows[i][0].trim(),
          date: rows[i][1] || `${m.period}-28`,
          amount: parseNum(rows[i][4]),
          cash: parseNum(rows[i][5]),
          credit: parseNum(rows[i][6]),
        });
      }
    }
  }

  results.push({
    month: m.key,
    period: m.period,
    custTotalRow,
    daaluDiesel: monthDaaluDiesel,
    totalDiesel,
    daaluExtra: monthDaaluExtra,
    totalExtraDaalu,
    expenses: monthExpenses,
    totalExpenses,
    summaryDaaluProfit,
    specialCustomerRows,
  });

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📅  ${m.key} Bottom Section Extracted`);
  console.log(`${'─'.repeat(70)}`);
  console.log(
    `  ⛽ Daalu Diesel (Fuel Expense): ₹${totalDiesel.toLocaleString('en-IN')}`,
  );
  monthDaaluDiesel.forEach((d) =>
    console.log(`     • ${d.date}: ₹${d.amount} (${d.expenseCategory})`),
  );
  console.log(
    `  📦 Daalu Extra (Pickup Income):  ₹${totalExtraDaalu.toLocaleString('en-IN')}`,
  );
  monthDaaluExtra.forEach((e) =>
    console.log(`     • ${e.description}: ₹${e.amount}`),
  );
  console.log(
    `  💼 Monthly Expenses:             ₹${totalExpenses.toLocaleString('en-IN')} (Recorded: ₹${recordedExpensesTotal.toLocaleString('en-IN')})`,
  );
  monthExpenses.forEach((e) =>
    console.log(`     • [${e.expenseCategory}] ${e.item}: ₹${e.amount}`),
  );
  if (specialCustomerRows.length > 0) {
    console.log(`  🤝 Special Rows in Sales:`);
    specialCustomerRows.forEach((sr) =>
      console.log(`     • ${sr.item}: ₹${sr.amount}`),
    );
  }
  console.log(
    `  💰 Daalu Profit (recorded):      ₹${summaryDaaluProfit.toLocaleString('en-IN')}`,
  );
}

writeFileSync(
  join(__dirname, 'data/bottom_section_extracted_2022_23.json'),
  JSON.stringify(results, null, 2),
);
console.log(
  `\n✅ Saved parsed data to script/data/bottom_section_extracted_2022_23.json`,
);
