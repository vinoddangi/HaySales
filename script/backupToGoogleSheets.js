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

// Authenticate Google Sheets API with full read/write permissions
const auth = new google.auth.GoogleAuth({
  keyFile: serviceAccountPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';

async function backupToGoogleSheets() {
  console.log('📦 Starting Firestore Backup to Google Sheets...');
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Fetch spreadsheet metadata to check existing tabs
  const spreadsheetMeta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const existingSheetTitles = new Set(
    (spreadsheetMeta.data.sheets || []).map((s) => s.properties.title),
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const customersTabName = `Backup_Customers_${timestamp.slice(0, 10)}`;
  const txTabName = `Backup_Transactions_${timestamp.slice(0, 10)}`;
  const purchasesTabName = `Backup_Purchases_${timestamp.slice(0, 10)}`;

  // 2. Create tabs if they don't exist
  const addSheetRequests = [];
  [customersTabName, txTabName, purchasesTabName].forEach((title) => {
    if (!existingSheetTitles.has(title)) {
      addSheetRequests.push({
        addSheet: {
          properties: { title },
        },
      });
    }
  });

  if (addSheetRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: addSheetRequests },
    });
    console.log(`✓ Created backup tabs in spreadsheet.`);
  }

  // 3. Fetch all Customers & their subcollection transactions
  console.log('📥 Fetching Firestore customers and transactions...');
  const custSnapshot = await db.collection('customers').get();

  const customerRows = [
    [
      'Customer ID',
      'Name',
      'Mobile',
      'Outstanding Amount (₹)',
      'Credit Limit (₹)',
    ],
  ];

  const transactionRows = [
    [
      'Transaction ID',
      'Customer ID',
      'Customer Name',
      'Subcollection / Folder',
      'Type',
      'Item / Service',
      'Weight (kg)',
      'Total Amount (₹)',
      'Cash Paid (₹)',
      'Remaining Due (₹)',
      'Payment Amount (₹)',
      'Date',
      'Note',
    ],
  ];

  for (const doc of custSnapshot.docs) {
    const data = doc.data();
    const custName = data.name || data.Name || '';
    customerRows.push([
      doc.id,
      custName,
      data.mobile || data.Mobile || '',
      data.outstandingAmount ?? 0,
      data.creditLimit ?? 35000,
    ]);

    // Fetch all subcollections on this customer doc (e.g. 'transactions', 'Transaction-2025', 'Transaction-2026', etc.)
    const subCollections = await doc.ref.listCollections();
    for (const subCol of subCollections) {
      const subTxSnap = await subCol.get();
      subTxSnap.forEach((txDoc) => {
        const tx = txDoc.data();
        let txDateStr = '';
        if (tx.date) {
          if (typeof tx.date === 'object' && tx.date.seconds) {
            txDateStr = new Date(tx.date.seconds * 1000).toISOString();
          } else {
            txDateStr = new Date(tx.date).toISOString();
          }
        }

        transactionRows.push([
          txDoc.id,
          doc.id,
          custName,
          subCol.id, // Collection/Year partition name
          tx.type || '',
          tx.item || '',
          tx.weightKg ?? '',
          tx.amount ?? '',
          tx.cashPaid ?? '',
          tx.remainingDue ?? '',
          tx.paymentAmount ?? '',
          txDateStr,
          tx.note || '',
        ]);
      });
    }
  }

  // 4. Fetch Purchases & Farm Expenses
  console.log('📥 Fetching purchases and farm expenses...');
  const purchasesSnapshot = await db.collection('purchases').get();
  const purchasesRows = [
    [
      'ID',
      'Type',
      'Category',
      'Expense Category / Item',
      'Weight (kg)',
      'Amount (₹)',
      'Cash Paid (₹)',
      'Supplier / Payee Name',
      'Date',
      'Note / Remarks',
    ],
  ];

  purchasesSnapshot.forEach((doc) => {
    const data = doc.data();
    let pDateStr = '';
    if (data.date) {
      if (typeof data.date === 'object' && data.date.seconds) {
        pDateStr = new Date(data.date.seconds * 1000).toISOString();
      } else {
        pDateStr = new Date(data.date).toISOString();
      }
    }

    purchasesRows.push([
      doc.id,
      data.type || '',
      data.category || '',
      data.expenseCategory || data.item || '',
      data.weightKg ?? '',
      data.amount ?? '',
      data.cashPaid ?? '',
      data.vendorName || '',
      pDateStr,
      data.note || '',
    ]);
  });

  // 5. Upload data to Google Sheets
  console.log('📤 Uploading Customers to Google Sheets...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${customersTabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: customerRows },
  });

  console.log('📤 Uploading Transactions to Google Sheets...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${txTabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: transactionRows },
  });

  console.log('📤 Uploading Purchases & Expenses to Google Sheets...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${purchasesTabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: purchasesRows },
  });

  console.log('\n🎉 Google Sheets Backup Complete!');
  console.log(
    `📊 Spreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
  );
  console.log(
    `- Customers: ${customerRows.length - 1} rows in '${customersTabName}'`,
  );
  console.log(
    `- Transactions: ${transactionRows.length - 1} rows in '${txTabName}'`,
  );
  console.log(
    `- Purchases / Expenses: ${purchasesRows.length - 1} rows in '${purchasesTabName}'`,
  );
}

backupToGoogleSheets().catch((err) => {
  console.error('❌ Google Sheets Backup failed:', err);
  process.exit(1);
});
