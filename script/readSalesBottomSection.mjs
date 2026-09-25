/**
 * Read the bottom section of each month's Sales tab to extract:
 * - Daalu Diesel cost (expense for running the pickup trucks)
 * - Daalu service income (total pickup fees collected)
 * - Expenses (interest, loader, petrol, etc.)
 * - Daalu Profit = Daalu Income - Diesel Cost
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

async function readFull(id, tab) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${tab}!A1:L300`,
  });
  return r.data.values || [];
}

const MONTHS = [
  { key: 'Nov-2022', id: '1hrs0IxXvTS146ukGPyQ3zts2dsgnq_vAQYiR4TQUuGo' },
  { key: 'Dec-2022', id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE' },
  { key: 'Jan-2023', id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q' },
  { key: 'Feb-2023', id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M' },
  { key: 'Mar-2023', id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0' },
];

const allResults = [];

for (const m of MONTHS) {
  const rows = await readFull(m.id, 'Sales');
  await delay(400);

  // Find the "Total" row that ends customer transactions (look for row with "Total" in col A and numeric total)
  let separatorIdx = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (
      (r[0] || '').toLowerCase() === 'total' &&
      r[4] &&
      parseNum(r[4]) > 10000
    ) {
      separatorIdx = i;
      break;
    }
  }

  // Everything after the Total row = bottom metadata section
  const bottomRows = separatorIdx >= 0 ? rows.slice(separatorIdx + 1) : [];

  // Also scan for "Brokrage"/"Brokerage"/"Commission" entries in customer section
  const customerRows =
    separatorIdx >= 0 ? rows.slice(1, separatorIdx) : rows.slice(1);
  const specialSales = customerRows.filter((r) => {
    const name = (r[0] || '').toLowerCase();
    return (
      name.includes('brok') ||
      name.includes('commis') ||
      name.includes('service')
    );
  });

  console.log(`\n${'═'.repeat(70)}`);
  console.log(
    `📅  ${m.key}  (${rows.length} rows, separator at R${separatorIdx + 1})`,
  );
  console.log(`${'─'.repeat(70)}`);

  // Parse bottom section
  let daaluDiesel = 0;
  let daaluIncome = 0;
  let daaluProfit = 0;
  const expenses = [];
  let headerLabels = [];

  // Print all non-empty bottom rows raw, then parse
  console.log('  BOTTOM SECTION (raw):');
  bottomRows.forEach((r, i) => {
    if (r.some((c) => c && c.toString().trim())) {
      console.log(`    R${separatorIdx + 2 + i}: ${JSON.stringify(r)}`);
    }
  });

  // Parse: look for header row like ["Daalu diesel","Amount","Daalu","Amount","Expenses","Amount"]
  let headerRow = bottomRows.find((r) => {
    const a = (r[0] || '').toLowerCase();
    return a.includes('daalu') || a.includes('diesel') || a.includes('expense');
  });
  // Look for totals row right after header
  if (headerRow) {
    const headerIdx = bottomRows.indexOf(headerRow);
    // Scan subsequent rows for numeric values
    for (let j = headerIdx + 1; j < bottomRows.length; j++) {
      const r = bottomRows[j];
      const label0 = (r[0] || '').toLowerCase();
      const label4 = (r[4] || '').toLowerCase();

      // Daalu diesel total (col 1)
      if (label0 === 'total' && parseNum(r[1]) > 0)
        daaluDiesel = parseNum(r[1]);

      // Daalu income total (col 3)
      if (label0 === 'total' && parseNum(r[3]) > 0)
        daaluIncome = parseNum(r[3]);

      // Daalu profit
      if (label0.includes('daalu profit') || label0.includes('daalu  profit')) {
        daaluProfit = parseNum(r[1]);
      }

      // Expenses (col 4=label, col 5=amount) — skip "Total" rows
      if (
        r[4] &&
        parseNum(r[5]) > 0 &&
        !label4.includes('total') &&
        !label4.includes('expense')
      ) {
        expenses.push({ label: r[4].trim(), amount: parseNum(r[5]) });
      }
    }
  }

  // Special entries in customer section (e.g. Brokrage)
  if (specialSales.length > 0) {
    console.log('  SPECIAL ENTRIES IN CUSTOMER SECTION:');
    specialSales.forEach((r) => console.log(`    ${JSON.stringify(r)}`));
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  console.log(
    `  ┌── PARSED BOTTOM DATA ──────────────────────────────────────────┐`,
  );
  console.log(
    `  │ Daalu Diesel Cost (expense):     ₹${daaluDiesel.toLocaleString('en-IN').padStart(10)}                    │`,
  );
  console.log(
    `  │ Daalu Service Income (collected):₹${daaluIncome.toLocaleString('en-IN').padStart(10)}                    │`,
  );
  console.log(
    `  │ Daalu Net Profit:                ₹${daaluProfit.toLocaleString('en-IN').padStart(10)}  (Income - Diesel) │`,
  );
  if (expenses.length > 0) {
    console.log(`  │ Expenses:`);
    expenses.forEach((e) =>
      console.log(
        `  │   • ${e.label.padEnd(25)} ₹${e.amount.toLocaleString('en-IN').padStart(8)}`,
      ),
    );
    console.log(
      `  │   Total Expenses:               ₹${totalExpenses.toLocaleString('en-IN').padStart(10)}`,
    );
  }
  if (specialSales.length > 0) {
    specialSales.forEach((r) => {
      const amt = parseNum(r[4]);
      console.log(
        `  │ ${r[0]} (service income):  ₹${amt.toLocaleString('en-IN').padStart(10)}                    │`,
      );
    });
  }
  console.log(
    `  └───────────────────────────────────────────────────────────────┘`,
  );

  allResults.push({
    month: m.key,
    daaluDieselCost: daaluDiesel,
    daaluServiceIncome: daaluIncome,
    daaluNetProfit: daaluProfit || daaluIncome - daaluDiesel,
    expenses,
    totalExpenses,
    specialSalesEntries: specialSales.map((r) => ({
      name: r[0],
      date: r[1],
      amount: parseNum(r[4]),
      cash: parseNum(r[5]),
      credit: parseNum(r[6]),
    })),
  });
}

// ── Grand summary ─────────────────────────────────────────────
console.log(`\n${'═'.repeat(70)}`);
console.log(`5-MONTH BOTTOM SECTION TOTALS (Nov 2022 – Mar 2023)`);
console.log(`${'═'.repeat(70)}`);

const grandDiesel = allResults.reduce((s, r) => s + r.daaluDieselCost, 0);
const grandDaaluInc = allResults.reduce((s, r) => s + r.daaluServiceIncome, 0);
const grandDaaluProf = allResults.reduce((s, r) => s + r.daaluNetProfit, 0);
const grandExpenses = allResults.reduce((s, r) => s + r.totalExpenses, 0);

// Aggregate all expense items
const expenseMap = {};
allResults.forEach((r) =>
  r.expenses.forEach((e) => {
    expenseMap[e.label] = (expenseMap[e.label] || 0) + e.amount;
  }),
);

console.log(`┌────────────────────────────────────────────────────────────┐`);
console.log(`│  SERVICE (Pickup/Daalu)                                    │`);
console.log(
  `│  Total Daalu Diesel Cost:     ₹${grandDiesel.toLocaleString('en-IN').padStart(10)}                 │`,
);
console.log(
  `│  Total Daalu Service Income:  ₹${grandDaaluInc.toLocaleString('en-IN').padStart(10)}                 │`,
);
console.log(
  `│  Net Pickup Profit:           ₹${grandDaaluProf.toLocaleString('en-IN').padStart(10)}                 │`,
);
console.log(`├────────────────────────────────────────────────────────────┤`);
console.log(`│  EXPENSES (from Sales tab bottom)                          │`);
Object.entries(expenseMap).forEach(([label, amt]) => {
  console.log(
    `│    ${label.padEnd(28)} ₹${amt.toLocaleString('en-IN').padStart(10)}            │`,
  );
});
console.log(
  `│  Total Expenses:              ₹${grandExpenses.toLocaleString('en-IN').padStart(10)}                 │`,
);
console.log(`└────────────────────────────────────────────────────────────┘`);

console.log(`\n  Transaction classification for ingestion:`);
console.log(
  `  • Daalu Diesel Cost  → EXPENSE  (running cost for pickup trucks)`,
);
console.log(
  `  • Daalu Service Inc  → SERVICE INCOME (cross-checks with Daalu col in Sales tab)`,
);
console.log(`  • Expenses (Intrest, Loader, Petrol) → EXPENSE`);
console.log(
  `  • Brokrage entries   → SERVICE INCOME (brokerage commission earned)`,
);

writeFileSync(
  join(__dirname, 'data/bottom_section_expenses_services_2022_23.json'),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      summary: { grandDiesel, grandDaaluInc, grandDaaluProf, grandExpenses },
      months: allResults,
    },
    null,
    2,
  ),
);
console.log(
  '\n📄 Saved → script/data/bottom_section_expenses_services_2022_23.json',
);
