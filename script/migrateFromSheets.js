import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  console.log('🚀 Starting Migration from Google Sheets...');
  const sheets = google.sheets({ version: 'v4', auth });

  const MASTER_SPREADSHEET_ID = '1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c';
  const DEBT_SPREADSHEET_ID = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';

  // 1. Fetch Master Customers (Customers!A:Z)
  console.log(
    `📊 Reading Master Customers from ${MASTER_SPREADSHEET_ID} [Customers!A:Z]...`,
  );
  const masterResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: 'Customers!A:Z',
  });
  const masterAllRows = masterResponse.data.values || [];

  // Detect column header indices dynamically
  const headerRow = masterAllRows[0] || [];
  let nameColIdx = 0;
  let mobileColIdx = -1;
  let villageColIdx = -1;
  let creditLimitColIdx = -1;

  headerRow.forEach((col, idx) => {
    const header = String(col).trim().toLowerCase();
    if (header.includes('name')) nameColIdx = idx;
    else if (
      header.includes('mobile') ||
      header.includes('phone') ||
      header.includes('contact')
    )
      mobileColIdx = idx;
    else if (
      header.includes('village') ||
      header.includes('city') ||
      header.includes('address')
    )
      villageColIdx = idx;
    else if (header.includes('credit') || header.includes('limit'))
      creditLimitColIdx = idx;
  });

  console.log(
    `Column Mapping -> Name: ${nameColIdx}, Phone: ${mobileColIdx}, Village: ${villageColIdx}, CreditLimit: ${creditLimitColIdx}`,
  );

  const masterRows = masterAllRows.slice(1);
  console.log(`Found ${masterRows.length} customers in master list.`);

  // 2. Fetch Outstanding / Debt Sheet (Sheet1!A2:K)
  console.log(
    `📊 Reading Outstanding Dues from ${DEBT_SPREADSHEET_ID} [Sheet1!A2:K]...`,
  );
  const debtResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: DEBT_SPREADSHEET_ID,
    range: 'Sheet1!A2:K',
  });
  const debtRows = debtResponse.data.values || [];
  console.log(`Found ${debtRows.length} rows in debt sheet.`);

  // Map outstanding amounts by normalized customer name
  const debtMap = new Map();
  for (const row of debtRows) {
    const rawName = (row[0] || '').trim();
    if (!rawName) continue;
    const due = parseRupeeValue(row[10], 0);
    debtMap.set(normalizeName(rawName), due);
  }

  // Combine customer records maintaining order and extracting metadata
  const customerList = [];
  const seenNormalized = new Set();

  for (const row of masterRows) {
    const rawName = (row[nameColIdx] || '').trim();
    if (!rawName) continue;
    const norm = normalizeName(rawName);
    if (!seenNormalized.has(norm)) {
      seenNormalized.add(norm);

      const mobileRaw =
        mobileColIdx !== -1 && row[mobileColIdx]
          ? String(row[mobileColIdx]).trim()
          : '';
      const villageRaw =
        villageColIdx !== -1 && row[villageColIdx]
          ? String(row[villageColIdx]).trim()
          : '';
      const creditLimitRaw =
        creditLimitColIdx !== -1 ? row[creditLimitColIdx] : undefined;
      const creditLimit = parseRupeeValue(creditLimitRaw, 35000);

      customerList.push({
        name: rawName,
        mobile: mobileRaw || undefined,
        village: villageRaw || undefined,
        creditLimit: creditLimit,
      });
    }
  }

  // Also include any customers who are in the debt sheet but not in master list
  const extraFromDebtSheet = [];
  for (const row of debtRows) {
    const rawName = (row[0] || '').trim();
    if (!rawName) continue;
    const norm = normalizeName(rawName);
    if (!seenNormalized.has(norm)) {
      seenNormalized.add(norm);
      const dueAmount = debtMap.get(norm) || 0;
      extraFromDebtSheet.push({ name: rawName, dueAmount });
      customerList.push({
        name: rawName,
        mobile: undefined,
        village: undefined,
        creditLimit: 35000,
      });
    }
  }

  if (extraFromDebtSheet.length > 0) {
    console.log(`\n⚠️ [Scenario Detected] Found ${extraFromDebtSheet.length} customer(s) in Debt Sheet NOT present in Master Sheet:`);
    extraFromDebtSheet.forEach((c, idx) => {
      console.log(`   ${idx + 1}. "${c.name}" (Outstanding Due: ₹${c.dueAmount}) -> Added to migration list`);
    });
  } else {
    console.log(`\n✅ All debt sheet customers matched the Master list.`);
  }

  console.log(`\n📋 Total unique customers to seed: ${customerList.length}`);

  // 3. Process customers and opening balances into Firestore
  const CHUNK_SIZE = 200;
  let customerIndex = 1;
  let seededCustomersCount = 0;
  let seededOpeningDuesCount = 0;

  for (let i = 0; i < customerList.length; i += CHUNK_SIZE) {
    const chunk = customerList.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    for (const cust of chunk) {
      const norm = normalizeName(cust.name);
      const dueAmount = debtMap.get(norm) || 0;
      const docId = String(customerIndex);
      const custDocRef = db.collection('customers').doc(docId);

      // Build customer doc
      const customerDocData = {
        name: cust.name,
        creditLimit: cust.creditLimit || 35000,
        outstandingAmount: dueAmount,
      };
      if (cust.mobile) customerDocData.mobile = cust.mobile;
      if (cust.village) customerDocData.village = cust.village;

      batch.set(custDocRef, customerDocData);

      // If customer has opening outstanding due, seed opening_balance transaction
      if (dueAmount > 0) {
        const txRef = custDocRef
          .collection('transactions')
          .doc('opening_balance');
        batch.set(txRef, {
          type: 'OPENING_BALANCE',
          item: 'Previous Outstanding',
          amount: dueAmount,
          cashPaid: 0,
          remainingDue: dueAmount,
          date: new Date(),
          note: 'Initial balance from Google Sheet',
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

  console.log('\n🎉 Migration Successfully Finished!');
  console.log(`👥 Created ${seededCustomersCount} customer records.`);
  console.log(
    `💰 Created ${seededOpeningDuesCount} initial opening balance transactions.`,
  );
}

migrateFromSheets().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
