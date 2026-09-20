import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const LOCAL_REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');

// Read Service Account credentials securely
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin SDK
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Authenticate Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function migrateFromSheets() {
  console.log('🚀 Starting Jan-2026 Baseline Migration from Google Sheets...');

  let customerList = [];

  // Check if compiled local registry is available
  if (existsSync(LOCAL_REGISTRY_FILE)) {
    console.log(
      `📖 Loading customer baseline from local compiled registry: ${LOCAL_REGISTRY_FILE}...`,
    );
    const localData = JSON.parse(readFileSync(LOCAL_REGISTRY_FILE, 'utf-8'));
    customerList = localData.map((c) => ({
      name: c.canonicalName,
      mobile: c.mobile || undefined,
      village: c.village || undefined,
      creditLimit: c.creditLimit || 35000,
      dueAmount: c.baselineOutstanding20251231 || 0,
    }));
    console.log(
      `✅ Loaded ${customerList.length} verified customers from local registry.`,
    );
  } else {
    // Fallback: Fetch directly from Google Sheets
    const sheets = google.sheets({ version: 'v4', auth });
    const MASTER_SPREADSHEET_ID =
      process.env.MASTER_SPREADSHEET_ID ||
      '1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c';
    const BASELINE_DEBT_SPREADSHEET_ID =
      process.env.BASELINE_DEBT_SPREADSHEET_ID ||
      '1o6D4OtAPEDLGNVZXWSz5zPX6xwdhosm-Yez5B-t8lXg';

    console.log(
      `📊 Reading Master Customers from ${MASTER_SPREADSHEET_ID} [Customers!A:Z]...`,
    );
    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SPREADSHEET_ID,
      range: 'Customers!A:Z',
    });
    const masterAllRows = masterResponse.data.values || [];
    const masterRows = masterAllRows.slice(1);

    console.log(
      `📊 Reading 2025-12-31 Baseline Outstanding Dues from ${BASELINE_DEBT_SPREADSHEET_ID} [Sheet1!A2:K]...`,
    );
    const debtResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: BASELINE_DEBT_SPREADSHEET_ID,
      range: 'Sheet1!A2:K',
    });
    const debtRows = debtResponse.data.values || [];

    const debtMap = new Map();
    for (const row of debtRows) {
      const rawName = (row[0] || '').trim();
      if (!rawName) continue;
      const due = parseRupeeValue(row[10], 0);
      debtMap.set(normalizeName(rawName), due);
    }

    const seenNormalized = new Set();
    for (const row of masterRows) {
      const rawName = (row[0] || '').trim();
      if (!rawName) continue;
      const norm = normalizeName(rawName);
      if (!seenNormalized.has(norm)) {
        seenNormalized.add(norm);
        const dueAmount = debtMap.get(norm) || 0;
        customerList.push({
          name: rawName,
          mobile: (row[1] || '').trim() || undefined,
          village: (row[2] || '').trim() || undefined,
          creditLimit: parseRupeeValue(row[3], 35000),
          dueAmount,
        });
      }
    }
  }

  console.log(`\n📋 Total unique customers to seed: ${customerList.length}`);

  // Seed customers and Jan 1, 2026 opening balances into Firestore
  const CHUNK_SIZE = 200;
  let customerIndex = 1;
  let seededCustomersCount = 0;
  let seededOpeningDuesCount = 0;
  let totalOpeningDebtSum = 0;

  for (let i = 0; i < customerList.length; i += CHUNK_SIZE) {
    const chunk = customerList.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    for (const cust of chunk) {
      const dueAmount = cust.dueAmount || 0;
      totalOpeningDebtSum += dueAmount;
      const docId = String(customerIndex);
      const custDocRef = db.collection('customers').doc(docId);

      // Build customer document
      const customerDocData = {
        name: cust.name,
        creditLimit: cust.creditLimit || 35000,
        openingDebt: dueAmount,
        outstandingAmount: dueAmount,
      };
      if (cust.mobile) customerDocData.mobile = cust.mobile;
      if (cust.village) customerDocData.village = cust.village;

      batch.set(custDocRef, customerDocData);

      // If customer has opening outstanding due as of 2025-12-31, seed opening_balance_2026_01
      if (dueAmount > 0) {
        const txRef = custDocRef
          .collection('transactions')
          .doc('opening_balance_2026_01');
        batch.set(txRef, {
          type: 'OPENING_BALANCE',
          item: 'Previous Outstanding',
          amount: dueAmount,
          cashPaid: 0,
          remainingDue: dueAmount,
          date: new Date('2026-01-01T00:00:00.000Z'),
          note: 'Opening balance from 2025-12-31 credit ledger',
        });
        seededOpeningDuesCount++;
      }

      customerIndex++;
      seededCustomersCount++;
    }

    await batch.commit();
    console.log(
      `  ✓ Committed migration batch: ${Math.min(i + CHUNK_SIZE, customerList.length)}/${customerList.length} customers.`,
    );
  }

  // Seed monthly status and Jan-2026 baseline metadata
  const statusRef = db.collection('metadata').doc('monthly_status');
  await statusRef.set(
    {
      activeMonth: '2026_01',
      lastRolledMonth: '2025_12',
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  console.log('\n🎉 Jan-2026 Baseline Migration Successfully Finished!');
  console.log(`👥 Created ${seededCustomersCount} customer records.`);
  console.log(
    `💰 Created ${seededOpeningDuesCount} initial opening balance transactions (Total Customer Lending: ₹${totalOpeningDebtSum.toLocaleString('en-IN')}).`,
  );
  console.log(`📅 Active Period set to: 2026_01`);
}

migrateFromSheets().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
