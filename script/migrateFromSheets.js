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
  keyFile: serviceAccountPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

function parseRupeeValue(val) {
  if (!val) return 0;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

async function migrateFromSheets() {
  console.log('🚀 Starting Migration from Google Sheets...');
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';

  console.log(`📊 Reading spreadsheet ${spreadsheetId} [Sheet1!A2:K]...`);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A2:K',
  });

  const rows = response.data.values || [];
  if (rows.length === 0) {
    console.log('⚠️ No data found in the spreadsheet.');
    return;
  }

  console.log(`Found ${rows.length} rows in Google Sheet.`);

  // 1. Process customers and opening balances
  const CHUNK_SIZE = 200;
  let customerIndex = 1;
  let seededCustomersCount = 0;
  let seededOpeningDuesCount = 0;

  // Process rows in manageable batches
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    for (const row of chunk) {
      const name = (row[0] || '').trim();
      const mobile = row[1] ? String(row[1]).trim() : undefined;
      const outstandingRaw = row[10];

      if (!name) continue;

      const dueAmount = parseRupeeValue(outstandingRaw);
      const docId = String(customerIndex);
      const custDocRef = db.collection('customers').doc(docId);

      // Set customer doc
      batch.set(custDocRef, {
        name: name,
        mobile: mobile || undefined,
        creditLimit: 35000,
        outstandingAmount: dueAmount,
      });

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
      `  ✓ Committed migration batch: ${Math.min(i + CHUNK_SIZE, rows.length)}/${rows.length} rows.`,
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
