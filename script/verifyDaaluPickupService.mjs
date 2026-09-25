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
  return parseFloat((s || '').toString().replace(/[₹, kg]/g, '')) || 0;
}

async function readTab(id, tab) {
  try {
    const r = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${tab}!A1:L600`,
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
    mainSales: 536753,
  },
  {
    key: 'Dec-2022',
    id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE',
    mainSales: 609293,
  },
  {
    key: 'Jan-2023',
    id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q',
    mainSales: 1586733,
  },
  {
    key: 'Feb-2023',
    id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M',
    mainSales: 1676843,
  },
  {
    key: 'Mar-2023',
    id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0',
    mainSales: 1751299,
  },
];

console.log('Verifying: Daalu = Pickup/Delivery Service Fee');
console.log('Main D.Sales = Total Grass only (Daalu excluded)');
console.log('Expected: Sum(TotalGrass column) = Main D.Sales ✅');
console.log('═'.repeat(72));

let grandGrass = 0,
  grandDaalu = 0,
  grandTotal = 0,
  grandCash = 0,
  grandCredit = 0;
const allMonthData = [];

for (const m of MONTHS) {
  const rows = await readTab(m.id, 'Sales');
  await delay(400);
  const hdr = rows[0] || [];

  // Detect column indices
  const grassIdx = hdr.findIndex((h) => /grass/i.test(h || ''));
  const daaluIdx = hdr.findIndex((h) => /daalu/i.test(h || ''));
  const totalIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'total');
  const cashIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'cash');
  const debtIdx = hdr.findIndex((h) => (h || '').toLowerCase() === 'debt');
  // For 2022 format without explicit Cash/Debt, fallback:
  const hasCashDebt = cashIdx >= 0 && debtIdx >= 0;

  let grassSum = 0,
    daaluSum = 0,
    totalSum = 0,
    cashSum = 0,
    creditSum = 0;
  const pickupCustomers = [];
  const txnRows = [];

  rows
    .slice(1)
    .filter(
      (r) =>
        r[0] &&
        r[0] !== 'Customer Name' &&
        !r[0].toLowerCase().includes('total') &&
        !r[0].match(/^\d/),
    )
    .forEach((r) => {
      const name = (r[0] || '').trim();
      const isRetail = name.toLowerCase() === 'retail';

      // Grass amount (col index 5 in 2022 format, or col 4 in 2023 format)
      const grass = parseNum(
        r[grassIdx >= 0 ? grassIdx : daaluIdx >= 0 ? 5 : 4],
      );
      const daalu = daaluIdx >= 0 ? parseNum(r[daaluIdx]) : 0;
      const total = parseNum(r[totalIdx >= 0 ? totalIdx : 7]);

      let cash = 0,
        credit = 0;
      if (hasCashDebt) {
        cash = parseNum(r[cashIdx]);
        credit = parseNum(r[debtIdx]);
      } else {
        // No explicit cash/debt col — retail=cash, others=credit
        if (isRetail) cash = total;
        else credit = total;
      }

      grassSum += grass;
      daaluSum += daalu;
      totalSum += total;
      cashSum += cash;
      creditSum += credit;

      if (daalu > 0)
        pickupCustomers.push({ name, daalu, date: r[1] || '', grass, total });

      txnRows.push({
        name,
        date: r[1] || '',
        kg: r[2] || '',
        grassSale: Math.round(grass),
        pickupFee: Math.round(daalu),
        totalCharged: Math.round(total),
        type: isRetail ? 'CASH' : 'CREDIT',
        cash: Math.round(cash),
        credit: Math.round(credit),
      });
    });

  // Verify: grassSum should match Main D.Sales
  const diff = Math.round(grassSum - m.mainSales);
  const ok = Math.abs(diff) < 5;

  grandGrass += grassSum;
  grandDaalu += daaluSum;
  grandTotal += totalSum;
  grandCash += cashSum;
  grandCredit += creditSum;

  allMonthData.push({
    month: m.key,
    grassSum: Math.round(grassSum),
    daaluSum: Math.round(daaluSum),
    totalSum: Math.round(totalSum),
    cashSum: Math.round(cashSum),
    creditSum: Math.round(creditSum),
    mainSales: m.mainSales,
    match: ok,
    diff,
    pickupCustomers,
    transactions: txnRows,
  });

  console.log(`\n📅  ${m.key}`);
  console.log(
    `  Columns: Grass[${grassIdx}] Daalu[${daaluIdx}] Total[${totalIdx}] Cash[${cashIdx}] Debt[${debtIdx}]`,
  );
  console.log(
    `  ┌── Sales Breakdown ──────────────────────────────────────────┐`,
  );
  console.log(
    `  │ Grass (hay/fodder sale):   ₹${Math.round(grassSum).toLocaleString('en-IN').padStart(12)}                  │`,
  );
  console.log(
    `  │ Daalu (pickup service):    ₹${Math.round(daaluSum).toLocaleString('en-IN').padStart(12)}  (${pickupCustomers.length} customers)  │`,
  );
  console.log(
    `  │ Total invoiced:            ₹${Math.round(totalSum).toLocaleString('en-IN').padStart(12)}                  │`,
  );
  console.log(
    `  ├── Payment Mode ─────────────────────────────────────────────┤`,
  );
  console.log(
    `  │ Cash collected:            ₹${Math.round(cashSum).toLocaleString('en-IN').padStart(12)}                  │`,
  );
  console.log(
    `  │ Credit (outstanding):      ₹${Math.round(creditSum).toLocaleString('en-IN').padStart(12)}                  │`,
  );
  console.log(
    `  ├── Reconcile with Main Tab ──────────────────────────────────┤`,
  );
  console.log(
    `  │ Main tab D.Sales:          ₹${m.mainSales.toLocaleString('en-IN').padStart(12)}                  │`,
  );
  console.log(
    `  │ Grass col matches Main:    ${ok ? '✅ MATCH' : `❌ Diff ₹${diff.toLocaleString('en-IN')}`}                       │`,
  );
  console.log(
    `  └─────────────────────────────────────────────────────────────┘`,
  );

  if (pickupCustomers.length > 0 && pickupCustomers.length <= 8) {
    console.log(`  Pickup customers this month:`);
    pickupCustomers.forEach((p) =>
      console.log(
        `    • ${p.name} — Pickup ₹${p.daalu.toLocaleString('en-IN')} + Grass ₹${Math.round(p.grass).toLocaleString('en-IN')} = ₹${Math.round(p.total).toLocaleString('en-IN')} (${p.date})`,
      ),
    );
  } else if (pickupCustomers.length > 8) {
    console.log(
      `  Pickup customers: ${pickupCustomers.length} (showing first 5)`,
    );
    pickupCustomers
      .slice(0, 5)
      .forEach((p) =>
        console.log(
          `    • ${p.name} — Pickup fee ₹${p.daalu.toLocaleString('en-IN')} (${p.date})`,
        ),
      );
  }
}

console.log('\n' + '═'.repeat(72));
console.log('5-MONTH GRAND TOTALS (Nov 2022 – Mar 2023)');
console.log('═'.repeat(72));
console.log(`┌──────────────────────────────────────────────────────────────┐`);
console.log(`│  REVENUE BREAKDOWN                                           │`);
console.log(
  `│  Grass/Fodder Sales:         ₹${Math.round(grandGrass).toLocaleString('en-IN').padStart(12)}                    │`,
);
console.log(
  `│  Pickup Service (Daalu):     ₹${Math.round(grandDaalu).toLocaleString('en-IN').padStart(12)}                    │`,
);
console.log(
  `│  Total Invoiced:             ₹${Math.round(grandTotal).toLocaleString('en-IN').padStart(12)}                    │`,
);
console.log(`├──────────────────────────────────────────────────────────────┤`);
console.log(`│  PAYMENT MODE                                                │`);
console.log(
  `│  Cash Collected:             ₹${Math.round(grandCash).toLocaleString('en-IN').padStart(12)}                    │`,
);
console.log(
  `│  Credit Outstanding:         ₹${Math.round(grandCredit).toLocaleString('en-IN').padStart(12)}                    │`,
);
console.log(`├──────────────────────────────────────────────────────────────┤`);
console.log(`│  PURCHASES (ALL CASH — confirmed by user)                    │`);
console.log(`│  Total Purchases:            ₹     57,60,159                 │`);
console.log(`└──────────────────────────────────────────────────────────────┘`);
console.log(`\n  Transaction types for ingestion:`);
console.log(`  • Grass amount  → SALE   (Cash or Credit per row)`);
console.log(`  • Daalu amount  → SERVICE (Pickup Fee, added to customer bill)`);
console.log(`  • Purchase      → EXPENSE (Always CASH, no credit)`);

writeFileSync(
  join(__dirname, 'data/daalu_pickup_service_split_2022_23.json'),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      grandTotals: {
        grassSales: Math.round(grandGrass),
        daaluService: Math.round(grandDaalu),
        totalInvoiced: Math.round(grandTotal),
        cashCollected: Math.round(grandCash),
        creditOutstanding: Math.round(grandCredit),
      },
      months: allMonthData,
    },
    null,
    2,
  ),
);
console.log('\n📄 Saved → script/data/daalu_pickup_service_split_2022_23.json');
