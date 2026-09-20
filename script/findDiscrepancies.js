import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPREADSHEET_ID = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';
const BASELINE_DEBT_SPREADSHEET_ID =
  '1o6D4OtAPEDLGNVZXWSz5zPX6xwdhosm-Yez5B-t8lXg';

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

async function findDiscrepancies() {
  console.log(
    `🔍 Reconciling Sheet [${SPREADSHEET_ID}] Column K vs Firestore Calculated Outstanding...\n`,
  );

  // 1. Fetch Sheet1 values from Target Spreadsheet
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet1!A1:K300`,
  });
  const sheetRows = sheetRes.data.values || [];
  const header = sheetRows[0] || [];
  console.log(`Sheet1 Headers:`, header);

  // 2. Fetch Baseline 2025 Debt Sheet (if any)
  let baselineDebtMap = new Map();
  try {
    const baseRes = await sheets.spreadsheets.values.get({
      spreadsheetId: BASELINE_DEBT_SPREADSHEET_ID,
      range: `Sheet1!A2:K300`,
    });
    for (const r of baseRes.data.values || []) {
      const name = r[0]?.trim();
      const debt = parseRupee(r[1] || r[4] || r[10]);
      if (name && debt > 0) {
        baselineDebtMap.set(normalize(name), debt);
      }
    }
  } catch (err) {
    console.log('Note: Baseline debt sheet could not be fetched:', err.message);
  }

  // 3. Load Alias Dictionary and Registry
  const aliasPath = join(__dirname, 'data', 'customer_alias_dictionary.json');
  const aliasDict = existsSync(aliasPath)
    ? JSON.parse(readFileSync(aliasPath, 'utf-8'))
    : {};

  // 4. Fetch all customers and transactions from Firestore
  const custSnap = await db.collection('customers').get();
  console.log(`Found ${custSnap.size} customers in Firestore.`);

  const dbCustomerMap = new Map();

  for (const doc of custSnap.docs) {
    const custData = doc.data();
    const custName = custData.name || doc.id;
    const txSnap = await doc.ref.collection('transactions').get();

    let totalSales = 0;
    let totalCashReceivedOnSales = 0;
    let totalPayments = 0;
    let salesCount = 0;
    let paymentsCount = 0;

    const salesList = [];
    const paymentsList = [];

    for (const t of txSnap.docs) {
      const td = t.data();
      if (td.type === 'SALE') {
        salesCount++;
        totalSales += td.totalAmount || td.amount || 0;
        totalCashReceivedOnSales += td.cashPaid || 0;
        salesList.push({
          period: td.period,
          month: td.month,
          amount: td.totalAmount || td.amount,
          item: td.item,
          weightKg: td.weightKg,
        });
      } else if (td.type === 'PAYMENT') {
        paymentsCount++;
        totalPayments += td.amount || 0;
        paymentsList.push({
          period: td.period,
          month: td.month,
          amount: td.amount,
        });
      }
    }

    const openingDebt =
      custData.openingDebt ||
      custData.balance ||
      baselineDebtMap.get(normalize(custName)) ||
      0;
    const calculatedOutstanding = openingDebt + totalSales - totalPayments;

    const entry = {
      id: doc.id,
      name: custName,
      openingDebt,
      totalSales,
      totalCashReceivedOnSales,
      totalPayments,
      calculatedOutstanding,
      salesCount,
      paymentsCount,
      salesList,
      paymentsList,
    };

    dbCustomerMap.set(normalize(custName), entry);
    // Also index aliases
    for (const [alias, canonical] of Object.entries(aliasDict)) {
      if (normalize(canonical) === normalize(custName)) {
        dbCustomerMap.set(normalize(alias), entry);
      }
    }
  }

  // 5. Compare each row in Sheet1 Column K with DB
  const results = [];
  let totalSheetColumnK = 0;
  let totalDbOutstandingMatched = 0;

  for (let i = 1; i < sheetRows.length; i++) {
    const row = sheetRows[i];
    const rawName = row[0]?.trim();
    if (!rawName || rawName === 'Total') continue;

    const sheetPrvDebt = parseRupee(row[1]);
    const sheetDate2 = parseRupee(row[2]);
    const sheetDate3 = parseRupee(row[3]);
    const sheetTotalDebt = parseRupee(row[4]); // Column E

    const sheetPrvCredit = parseRupee(row[5]);
    const sheetCredit2 = parseRupee(row[6]);
    const sheetCredit3 = parseRupee(row[7]);
    const sheetKasar = parseRupee(row[8]);
    const sheetTotalCredit = parseRupee(row[9]); // Column J

    const sheetColumnK = parseRupee(row[10]); // Column K (Net Total Outstanding)
    totalSheetColumnK += sheetColumnK;

    const normName = normalize(rawName);
    const dbEntry = dbCustomerMap.get(normName);

    if (dbEntry) {
      const diff =
        Math.round((sheetColumnK - dbEntry.calculatedOutstanding) * 100) / 100;
      totalDbOutstandingMatched += dbEntry.calculatedOutstanding;

      results.push({
        rowIndex: i + 1,
        rawName,
        matchedDbName: dbEntry.name,
        sheetColumnK,
        sheetPrvDebt,
        sheetDate2,
        sheetDate3,
        sheetTotalDebt,
        sheetPrvCredit,
        sheetCredit2,
        sheetCredit3,
        sheetKasar,
        sheetTotalCredit,
        dbOpeningDebt: dbEntry.openingDebt,
        dbTotalSales: dbEntry.totalSales,
        dbTotalPayments: dbEntry.totalPayments,
        dbCalculatedOutstanding: dbEntry.calculatedOutstanding,
        diff,
        status: Math.abs(diff) < 1 ? 'EXACT_MATCH' : 'DISCREPANCY',
        salesCount: dbEntry.salesCount,
        paymentsCount: dbEntry.paymentsCount,
      });
    } else {
      results.push({
        rowIndex: i + 1,
        rawName,
        matchedDbName: null,
        sheetColumnK,
        sheetPrvDebt,
        sheetDate2,
        sheetDate3,
        sheetTotalDebt,
        sheetPrvCredit,
        sheetCredit2,
        sheetCredit3,
        sheetKasar,
        sheetTotalCredit,
        dbOpeningDebt: 0,
        dbTotalSales: 0,
        dbTotalPayments: 0,
        dbCalculatedOutstanding: 0,
        diff: sheetColumnK,
        status: 'NOT_FOUND_IN_DB',
        salesCount: 0,
        paymentsCount: 0,
      });
    }
  }

  const exactMatches = results.filter((r) => r.status === 'EXACT_MATCH');
  const discrepancies = results.filter((r) => r.status === 'DISCREPANCY');
  const notInDb = results.filter((r) => r.status === 'NOT_FOUND_IN_DB');

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`📊 RECONCILIATION SUMMARY:`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`Total Sheet Customers Checked: ${results.length}`);
  console.log(`✅ Exact Matches (Diff = ₹0): ${exactMatches.length}`);
  console.log(`⚠️ Discrepancies: ${discrepancies.length}`);
  console.log(`❌ In Sheet but not in DB: ${notInDb.length}`);
  console.log(
    `\n💰 Total Sheet Column K Sum: ₹${totalSheetColumnK.toLocaleString('en-IN')}`,
  );

  // Discrepancy Breakdown Categories
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(
    `🔍 TOP 20 DISCREPANCIES (Sheet Column K vs DB Calculated Outstanding):`,
  );
  console.log(`═══════════════════════════════════════════════════════════`);

  const sortedDiscrepancies = [...discrepancies].sort(
    (a, b) => Math.abs(b.diff) - Math.abs(a.diff),
  );

  sortedDiscrepancies.slice(0, 25).forEach((d, idx) => {
    console.log(`${idx + 1}. ${d.rawName} (Row ${d.rowIndex}):`);
    console.log(
      `   - Sheet Column K: ₹${d.sheetColumnK.toLocaleString('en-IN')} (Debt: ₹${d.sheetTotalDebt.toLocaleString('en-IN')}, Paid: ₹${d.sheetTotalCredit.toLocaleString('en-IN')}, PrvDebt: ₹${d.sheetPrvDebt.toLocaleString('en-IN')})`,
    );
    console.log(
      `   - DB Outstanding: ₹${d.dbCalculatedOutstanding.toLocaleString('en-IN')} (Sales: ₹${d.dbTotalSales.toLocaleString('en-IN')}, Payments: ₹${d.dbTotalPayments.toLocaleString('en-IN')}, OpenDebt: ₹${d.dbOpeningDebt.toLocaleString('en-IN')})`,
    );
    console.log(
      `   - Difference: ${d.diff > 0 ? '+' : ''}₹${d.diff.toLocaleString('en-IN')}\n`,
    );
  });

  // Save audit report
  const auditReport = {
    spreadsheetId: SPREADSHEET_ID,
    generatedAt: new Date().toISOString(),
    totalSheetCustomers: results.length,
    exactMatchesCount: exactMatches.length,
    discrepanciesCount: discrepancies.length,
    notInDbCount: notInDb.length,
    totalSheetColumnK,
    discrepancies: sortedDiscrepancies,
    exactMatches,
    notInDb,
  };

  const reportPath = join(__dirname, 'data', 'column_k_discrepancy_audit.json');
  writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log(`📁 Detailed discrepancy report saved to: ${reportPath}`);
}

findDiscrepancies().catch((err) => {
  console.error('Error finding discrepancies:', err);
  process.exit(1);
});
