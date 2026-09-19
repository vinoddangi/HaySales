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

async function mergeCustomersFromSheets() {
  console.log('🔄 Starting Customer Merge & Sync from Google Sheets...');
  const sheets = google.sheets({ version: 'v4', auth });

  const MASTER_SPREADSHEET_ID = '1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c';

  // 1. Fetch Master Customers (Customers!A:Z)
  console.log(
    `📊 Reading Master Customers from ${MASTER_SPREADSHEET_ID} [Customers!A:Z]...`,
  );
  const masterResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: 'Customers!A:Z',
  });
  const masterAllRows = masterResponse.data.values || [];
  if (masterAllRows.length <= 1) {
    console.log('⚠️ No customer rows found in sheet.');
    return;
  }

  // Detect column headers dynamically
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
  console.log(`Found ${masterRows.length} customer rows in sheet.`);

  // 2. Fetch existing customers from Firestore
  console.log('📥 Fetching existing Firestore customers...');
  const existingCustSnapshot = await db.collection('customers').get();

  const existingMap = new Map(); // normalizedName -> { docId, data, docRef }
  let maxNumericId = 0;

  existingCustSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const norm = normalizeName(data.name);
    if (norm) {
      existingMap.set(norm, {
        docId: doc.id,
        data,
        ref: doc.ref,
      });
    }
    const numId = parseInt(doc.id, 10);
    if (!isNaN(numId) && numId > maxNumericId) {
      maxNumericId = numId;
    }
  });

  console.log(
    `Found ${existingMap.size} existing customer records in Firestore.`,
  );

  // 3. Process each customer from the sheet and merge/insert
  let updatedCount = 0;
  let createdCount = 0;
  let unchangedCount = 0;

  const CHUNK_SIZE = 200;
  let operations = [];

  for (const row of masterRows) {
    const rawName = (row[nameColIdx] || '').trim();
    if (!rawName) continue;
    const norm = normalizeName(rawName);

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
    const creditLimit =
      creditLimitRaw !== undefined && String(creditLimitRaw).trim() !== ''
        ? parseRupeeValue(creditLimitRaw, 35000)
        : undefined;

    if (existingMap.has(norm)) {
      // Existing customer -> Merge new details if changed or missing
      const existing = existingMap.get(norm);
      const updates = {};

      if (mobileRaw && existing.data.mobile !== mobileRaw) {
        updates.mobile = mobileRaw;
      }
      if (villageRaw && existing.data.village !== villageRaw) {
        updates.village = villageRaw;
      }
      if (
        creditLimit !== undefined &&
        existing.data.creditLimit !== creditLimit
      ) {
        updates.creditLimit = creditLimit;
      }

      if (Object.keys(updates).length > 0) {
        operations.push({
          type: 'update',
          ref: existing.ref,
          data: updates,
          name: rawName,
        });
        updatedCount++;
      } else {
        unchangedCount++;
      }
    } else {
      // Newly added customer in sheet -> Insert into Firestore
      maxNumericId++;
      const newDocId = String(maxNumericId);
      const newDocRef = db.collection('customers').doc(newDocId);

      const newCustomerData = {
        name: rawName,
        creditLimit: creditLimit ?? 35000,
        outstandingAmount: 0,
      };
      if (mobileRaw) newCustomerData.mobile = mobileRaw;
      if (villageRaw) newCustomerData.village = villageRaw;

      operations.push({
        type: 'set',
        ref: newDocRef,
        data: newCustomerData,
        name: rawName,
      });

      // Register in map so duplicate rows within the same sheet don't generate 2 docs
      existingMap.set(norm, {
        docId: newDocId,
        data: newCustomerData,
        ref: newDocRef,
      });

      createdCount++;
    }
  }

  // 4. Commit operations in batches
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    for (const op of chunk) {
      if (op.type === 'update') {
        batch.update(op.ref, op.data);
      } else if (op.type === 'set') {
        batch.set(op.ref, op.data);
      }
    }

    await batch.commit();
    console.log(
      `  ✓ Committed merge batch: ${Math.min(i + CHUNK_SIZE, operations.length)}/${operations.length} actions.`,
    );
  }

  console.log('\n🎉 Customer Merge & Sync Finished!');
  console.log(`➕ Added new customers: ${createdCount}`);
  console.log(`✏️ Updated existing customers: ${updatedCount}`);
  console.log(`👌 Unchanged customers: ${unchangedCount}`);
}

mergeCustomersFromSheets().catch((err) => {
  console.error('❌ Merge failed:', err);
  process.exit(1);
});
