import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DRIVE_FOLDER_ID = '1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e';
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});
const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

export async function syncDatabaseToDriveFolder() {
  console.log(
    `📂 Checking Google Drive folder "${DRIVE_FOLDER_ID}" for spreadsheets...`,
  );

  const listRes = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink)',
  });

  const files = listRes.data.files || [];
  console.log(`Found ${files.length} file(s) in folder.`);

  if (files.length === 0) {
    console.log(
      '\n💡 Note: Google Drive Service Accounts cannot create new root files due to Google Drive quota policy.',
    );
    console.log(
      '👉 Please create a blank Google Sheet or spreadsheet inside the folder:',
    );
    console.log(`   https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`);
    console.log(
      '   Once created, run this script or trigger sync from the app to populate all tabs automatically!',
    );
    return;
  }

  // Find target spreadsheet
  const targetSheet =
    files.find((f) => f.mimeType.includes('spreadsheet')) || files[0];
  console.log(
    `🎯 Syncing database to spreadsheet: "${targetSheet.name}" (${targetSheet.id})...`,
  );

  // 1. Fetch live data
  const custSnap = await db.collection('customers').get();
  const purchSnap = await db.collection('purchases').get();

  const customerRows = [
    [
      'CustomerID',
      'CustomerName',
      'Mobile',
      'Village',
      'CreditLimit',
      'OutstandingAmount',
    ],
  ];
  const salesRows = [
    [
      'TransactionID',
      'CustomerID',
      'CustomerName',
      'Date',
      'Item',
      'WeightKg',
      'Rate',
      'TotalAmount',
      'CashPaid',
      'RemainingDue',
      'Notes',
    ],
  ];
  const paymentRows = [
    ['PaymentID', 'CustomerID', 'CustomerName', 'Date', 'AmountPaid', 'Notes'],
  ];
  const purchaseRows = [
    [
      'PurchaseID',
      'Date',
      'Category',
      'Item',
      'WeightKg',
      'PurchaseRate',
      'Amount',
      'VendorName',
      'Notes',
    ],
  ];
  const expenseRows = [
    ['ExpenseID', 'Date', 'ExpenseCategory', 'Item', 'Amount', 'Notes'],
  ];

  for (const doc of custSnap.docs) {
    const c = doc.data();
    customerRows.push([
      doc.id,
      c.name || '',
      c.mobile || '',
      c.village || '',
      c.creditLimit || 35000,
      c.outstandingAmount || 0,
    ]);

    const txSnap = await doc.ref.collection('transactions').get();
    txSnap.forEach((tDoc) => {
      const t = tDoc.data();
      if (t.type === 'SALE') {
        salesRows.push([
          tDoc.id,
          doc.id,
          c.name || '',
          t.date || '',
          t.item || 'Others',
          t.weightKg || 0,
          t.rate || 0,
          t.amount || 0,
          t.cashPaid || 0,
          t.remainingDue || 0,
          t.note || '',
        ]);
      } else if (t.type === 'PAYMENT') {
        paymentRows.push([
          tDoc.id,
          doc.id,
          c.name || '',
          t.date || '',
          t.amount || t.paymentAmount || 0,
          t.note || '',
        ]);
      }
    });
  }

  purchSnap.forEach((pDoc) => {
    const p = pDoc.data();
    if (p.type === 'EXPENSE') {
      expenseRows.push([
        pDoc.id,
        p.date || '',
        p.expenseCategory || 'Others',
        p.item || 'Others',
        p.amount || 0,
        p.note || '',
      ]);
    } else {
      purchaseRows.push([
        pDoc.id,
        p.date || '',
        p.category || 'Purchase',
        p.item || 'Others',
        p.weightKg || 0,
        p.purchaseRate || p.rate || 0,
        p.amount || 0,
        p.vendorName || '',
        p.note || '',
      ]);
    }
  });

  // Ensure tabs exist
  const meta = await sheets.spreadsheets.get({ spreadsheetId: targetSheet.id });
  const existingSheets = new Set(
    (meta.data.sheets || []).map((s) => s.properties.title),
  );

  const requiredTabs = [
    'Customers',
    'Sales',
    'Payments',
    'Purchases',
    'Expenses',
  ];
  const addRequests = [];
  requiredTabs.forEach((title) => {
    if (!existingSheets.has(title)) {
      addRequests.push({ addSheet: { properties: { title } } });
    }
  });

  if (addRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: targetSheet.id,
      requestBody: { requests: addRequests },
    });
  }

  // Populate data
  const datasets = [
    { title: 'Customers', values: customerRows },
    { title: 'Sales', values: salesRows },
    { title: 'Payments', values: paymentRows },
    { title: 'Purchases', values: purchaseRows },
    { title: 'Expenses', values: expenseRows },
  ];

  for (const ds of datasets) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: targetSheet.id,
      range: `${ds.title}!A1:Z`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSheet.id,
      range: `${ds.title}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: ds.values },
    });
    console.log(`✅ Synced ${ds.values.length - 1} rows to tab "${ds.title}".`);
  }

  console.log(
    `\n🎉 Successfully synced all database tables to Google Drive spreadsheet!`,
  );
  console.log(
    `🔗 Link: ${targetSheet.webViewLink || `https://docs.google.com/spreadsheets/d/${targetSheet.id}`}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncDatabaseToDriveFolder().catch((err) => {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  });
}
