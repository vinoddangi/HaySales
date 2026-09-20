import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUG_CREDIT_LIST_ID = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';
const OPENING_CREDIT_LIST_ID = '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M';

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

function parseRupee(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val)
    .replace(/[^0-9.-]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function reconcileWithCorrectOpening() {
  console.log(
    `🔍 Loading Net Opening Balances from [${OPENING_CREDIT_LIST_ID}] (Sheet2 Prv. Total)...`,
  );

  const openRes = await sheets.spreadsheets.values.get({
    spreadsheetId: OPENING_CREDIT_LIST_ID,
    range: `Sheet2!A1:F300`,
  });
  const openRows = openRes.data.values || [];

  const openingBalanceMap = new Map();
  let totalOpeningSum = 0;

  for (let i = 1; i < openRows.length; i++) {
    const r = openRows[i];
    const name = r[1]?.trim();
    if (!name || name === 'Total') continue;
    const prvTotal = parseRupee(r[2]);
    openingBalanceMap.set(normalize(name), prvTotal);
    totalOpeningSum += prvTotal;
  }

  console.log(
    `✅ Loaded ${openingBalanceMap.size} customer opening balances totaling: ₹${totalOpeningSum.toLocaleString('en-IN')}`,
  );

  // Load alias dictionary
  const aliasPath = join(__dirname, 'data', 'customer_alias_dictionary.json');
  const aliasDict = existsSync(aliasPath)
    ? JSON.parse(readFileSync(aliasPath, 'utf-8'))
    : {};

  // Fetch Firestore customers & 2026 transactions
  const custSnap = await db.collection('customers').get();
  const dbCustomerMap = new Map();

  for (const doc of custSnap.docs) {
    const custData = doc.data();
    const custName = custData.name || doc.id;
    const norm = normalize(custName);
    const txSnap = await doc.ref.collection('transactions').get();

    let totalSales = 0;
    let totalPayments = 0;
    let salesCount = 0;
    let paymentsCount = 0;

    for (const t of txSnap.docs) {
      const td = t.data();
      if (td.type === 'SALE') {
        salesCount++;
        totalSales += td.totalAmount || td.amount || 0;
      } else if (td.type === 'PAYMENT') {
        paymentsCount++;
        totalPayments += td.amount || 0;
      }
    }

    // Get net opening debt from Customer Credit List-202601
    const openingDebt = openingBalanceMap.get(norm) || 0;
    const calculatedOutstanding = openingDebt + totalSales - totalPayments;

    const entry = {
      id: doc.id,
      name: custName,
      openingDebt,
      totalSales,
      totalPayments,
      calculatedOutstanding,
      salesCount,
      paymentsCount,
    };

    dbCustomerMap.set(norm, entry);
    for (const [alias, canonical] of Object.entries(aliasDict)) {
      if (normalize(canonical) === norm) {
        dbCustomerMap.set(normalize(alias), entry);
      }
    }
  }

  // Fetch August Sheet (1FyT2...) Sheet1
  const augRes = await sheets.spreadsheets.values.get({
    spreadsheetId: AUG_CREDIT_LIST_ID,
    range: `Sheet1!A1:K300`,
  });
  const augRows = augRes.data.values || [];

  const results = [];
  let totalSheetColK = 0;
  let totalDbCalculated = 0;

  for (let i = 1; i < augRows.length; i++) {
    const row = augRows[i];
    const rawName = row[0]?.trim();
    if (!rawName || rawName === 'Total') continue;

    const sheetColumnK = parseRupee(row[10]);
    totalSheetColK += sheetColumnK;

    const norm = normalize(rawName);
    const dbEntry = dbCustomerMap.get(norm);

    if (dbEntry) {
      const diff =
        Math.round((sheetColumnK - dbEntry.calculatedOutstanding) * 100) / 100;
      totalDbCalculated += dbEntry.calculatedOutstanding;

      results.push({
        rowIndex: i + 1,
        rawName,
        matchedName: dbEntry.name,
        sheetColumnK,
        dbOpeningDebt: dbEntry.openingDebt,
        dbTotalSales: dbEntry.totalSales,
        dbTotalPayments: dbEntry.totalPayments,
        dbCalculatedOutstanding: dbEntry.calculatedOutstanding,
        diff,
        status: Math.abs(diff) < 1 ? 'EXACT_MATCH' : 'DISCREPANCY',
      });
    } else {
      results.push({
        rowIndex: i + 1,
        rawName,
        matchedName: null,
        sheetColumnK,
        dbOpeningDebt: 0,
        dbTotalSales: 0,
        dbTotalPayments: 0,
        dbCalculatedOutstanding: 0,
        diff: sheetColumnK,
        status: 'NOT_FOUND_IN_DB',
      });
    }
  }

  const exact = results.filter((r) => r.status === 'EXACT_MATCH');
  const discrepancies = results.filter((r) => r.status === 'DISCREPANCY');

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`📊 RECONCILIATION SUMMARY (WITH REVISED OPENING DEBT):`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`Total Checked: ${results.length}`);
  console.log(`✅ Exact Matches (Diff = ₹0): ${exact.length}`);
  console.log(`⚠️ Discrepancies: ${discrepancies.length}`);
  console.log(
    `💰 Sheet Column K Total: ₹${totalSheetColK.toLocaleString('en-IN')}`,
  );
  console.log(
    `💰 DB Calculated Total (Matched): ₹${totalDbCalculated.toLocaleString('en-IN')}`,
  );

  console.log(`\n🔍 TOP 20 REMAINING DISCREPANCIES:`);
  const sorted = [...discrepancies].sort(
    (a, b) => Math.abs(b.diff) - Math.abs(a.diff),
  );
  sorted.slice(0, 20).forEach((d, idx) => {
    console.log(
      `${idx + 1}. ${d.rawName}: Sheet Col K = ₹${d.sheetColumnK.toLocaleString('en-IN')}, DB = ₹${d.dbCalculatedOutstanding.toLocaleString('en-IN')} (Open: ₹${d.dbOpeningDebt.toLocaleString('en-IN')}, Sales: ₹${d.dbTotalSales.toLocaleString('en-IN')}, Paid: ₹${d.dbTotalPayments.toLocaleString('en-IN')}), Diff = ${d.diff > 0 ? '+' : ''}₹${d.diff.toLocaleString('en-IN')}`,
    );
  });

  // Save report
  writeFileSync(
    join(__dirname, 'data', 'reconciled_with_opening_audit.json'),
    JSON.stringify(
      {
        totalChecked: results.length,
        exactCount: exact.length,
        discCount: discrepancies.length,
        exact,
        discrepancies: sorted,
      },
      null,
      2,
    ),
  );
}

reconcileWithCorrectOpening().catch((err) => console.error(err));
