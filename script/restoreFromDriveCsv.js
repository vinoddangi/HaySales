import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target Google Drive Folder ID
const DRIVE_FOLDER_ID = '1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e';

// Initialize Firebase Admin
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Authenticate Google Drive
const driveAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth: driveAuth });

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function downloadFileFromDrive(fileName) {
  const res = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and name = '${fileName}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = res.data.files;
  if (!files || files.length === 0) {
    console.warn(`⚠️ File not found in Google Drive: ${fileName}`);
    return null;
  }

  const fileId = files[0].id;
  const fileRes = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' },
  );

  return fileRes.data;
}

async function restoreFromGoogleDrive() {
  console.log('🚀 Starting Database Restore from Google Drive CSV Folder...');
  const BATCH_SIZE = 400;

  const backupDir = join(__dirname, 'data', 'backups');
  const mockCsvDir = join(__dirname, '..', 'src', 'mock', 'csv');
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  if (!existsSync(mockCsvDir)) mkdirSync(mockCsvDir, { recursive: true });

  const targetFiles = [
    'customers.csv',
    'sales.csv',
    'payments.csv',
    'services.csv',
    'purchases.csv',
    'expenses.csv',
  ];

  const downloadedData = {};

  for (const fileName of targetFiles) {
    console.log(`📥 Downloading ${fileName} from Google Drive...`);
    const content = await downloadFileFromDrive(fileName);
    if (content) {
      downloadedData[fileName] = content;
      writeFileSync(join(backupDir, fileName), content, 'utf-8');
      writeFileSync(join(mockCsvDir, fileName), content, 'utf-8');
    }
  }

  // 1. Restore Customers
  if (downloadedData['customers.csv']) {
    console.log('👥 Restoring Customers to Firestore...');
    const rows = parseCsv(downloadedData['customers.csv']);
    const headers = rows[0].map((h) => h.toLowerCase());
    const idIdx = headers.indexOf('customerid');
    const nameIdx = headers.indexOf('customername');
    const mobIdx = headers.indexOf('mobile');
    const vilIdx = headers.indexOf('village');
    const limitIdx = headers.indexOf('creditlimit');
    const outIdx = headers.indexOf('outstandingamount');

    let batch = db.batch();
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const docId = idIdx !== -1 && r[idIdx] ? r[idIdx] : String(i);
      const name = nameIdx !== -1 ? r[nameIdx] : `Customer ${i}`;
      const ref = db.collection('customers').doc(docId);

      batch.set(
        ref,
        {
          name,
          mobile: mobIdx !== -1 ? r[mobIdx] : '',
          village: vilIdx !== -1 ? r[vilIdx] : '',
          creditLimit: limitIdx !== -1 ? Number(r[limitIdx]) || 35000 : 35000,
          outstandingAmount: outIdx !== -1 ? Number(r[outIdx]) || 0 : 0,
        },
        { merge: true },
      );

      count++;
      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();
    console.log(`✅ Restored ${count} customers.`);
  }

  // 2. Restore Sales, Payments, Services
  for (const type of ['sales', 'payments', 'services']) {
    const fileName = `${type}.csv`;
    if (!downloadedData[fileName]) continue;

    console.log(`📑 Restoring ${type} transactions to Firestore...`);
    const rows = parseCsv(downloadedData[fileName]);
    const headers = rows[0].map((h) => h.toLowerCase());

    const idIdx = headers.indexOf(
      type === 'sales'
        ? 'transactionid'
        : type === 'payments'
          ? 'paymentid'
          : 'serviceid',
    );
    const custIdIdx = headers.indexOf('customerid');
    const nameIdx = headers.indexOf('customername');
    const dateIdx = headers.indexOf('date');
    const amtIdx = headers.indexOf(
      type === 'payments'
        ? 'amountpaid'
        : type === 'sales'
          ? 'totalamount'
          : 'amount',
    );
    const wtIdx = headers.indexOf('weightkg');
    const rateIdx = headers.indexOf('rate');
    const cashIdx = headers.indexOf('cashpaid');
    const dueIdx = headers.indexOf('remainingdue');
    const itemIdx = headers.indexOf('item');
    const noteIdx = headers.indexOf('notes');

    let batch = db.batch();
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const custId =
        custIdIdx !== -1 && r[custIdIdx]
          ? r[custIdIdx]
          : type === 'services'
            ? '307'
            : '1';
      const docId =
        idIdx !== -1 && r[idIdx] ? r[idIdx] : `tx_${type}_${Date.now()}_${i}`;
      const ref = db
        .collection('customers')
        .doc(custId)
        .collection('transactions')
        .doc(docId);

      const record = {
        type:
          type === 'sales'
            ? 'SALE'
            : type === 'payments'
              ? 'PAYMENT'
              : 'SERVICE',
        customerId: custId,
        customerName: nameIdx !== -1 ? r[nameIdx] : '',
        date:
          dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
        amount: amtIdx !== -1 ? Number(r[amtIdx]) || 0 : 0,
        note: noteIdx !== -1 ? r[noteIdx] : '',
      };

      if (type === 'sales') {
        record.item = itemIdx !== -1 && r[itemIdx] ? r[itemIdx] : 'Others';
        record.weightKg = wtIdx !== -1 ? Number(r[wtIdx]) || 0 : 0;
        record.rate = rateIdx !== -1 ? Number(r[rateIdx]) || 0 : 0;
        record.cashPaid = cashIdx !== -1 ? Number(r[cashIdx]) || 0 : 0;
        record.remainingDue = dueIdx !== -1 ? Number(r[dueIdx]) || 0 : 0;
      } else if (type === 'payments') {
        record.paymentAmount = record.amount;
      } else if (type === 'services') {
        record.item = itemIdx !== -1 && r[itemIdx] ? r[itemIdx] : 'Pickup';
        record.cashPaid = record.amount;
      }

      batch.set(ref, record, { merge: true });
      count++;
      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();
    console.log(`✅ Restored ${count} ${type} transactions.`);
  }

  // 3. Restore Purchases & Expenses
  for (const type of ['purchases', 'expenses']) {
    const fileName = `${type}.csv`;
    if (!downloadedData[fileName]) continue;

    console.log(`🌾 Restoring ${type} to Firestore...`);
    const rows = parseCsv(downloadedData[fileName]);
    const headers = rows[0].map((h) => h.toLowerCase());

    const idIdx = headers.indexOf(
      type === 'purchases' ? 'purchaseid' : 'expenseid',
    );
    const dateIdx = headers.indexOf('date');
    const catIdx = headers.indexOf(
      type === 'purchases' ? 'category' : 'expensecategory',
    );
    const itemIdx = headers.indexOf('item');
    const wtIdx = headers.indexOf('weightkg');
    const rateIdx = headers.indexOf('purchaserate');
    const amtIdx = headers.indexOf('amount');
    const vendorIdx = headers.indexOf('vendorname');
    const noteIdx = headers.indexOf('notes');

    let batch = db.batch();
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const docId =
        idIdx !== -1 && r[idIdx] ? r[idIdx] : `${type}_${Date.now()}_${i}`;
      const ref = db.collection('purchases').doc(docId);

      const record = {
        type: type === 'purchases' ? 'PURCHASE' : 'EXPENSE',
        date:
          dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
        item: itemIdx !== -1 && r[itemIdx] ? r[itemIdx] : 'Others',
        amount: amtIdx !== -1 ? Number(r[amtIdx]) || 0 : 0,
        note: noteIdx !== -1 ? r[noteIdx] : '',
      };

      if (type === 'purchases') {
        record.category = catIdx !== -1 && r[catIdx] ? r[catIdx] : 'Purchase';
        record.weightKg = wtIdx !== -1 ? Number(r[wtIdx]) || 0 : 0;
        record.purchaseRate = rateIdx !== -1 ? Number(r[rateIdx]) || 0 : 0;
        record.vendorName = vendorIdx !== -1 ? r[vendorIdx] : '';
      } else {
        record.category = 'Expense';
        record.expenseCategory =
          catIdx !== -1 && r[catIdx] ? r[catIdx] : 'General';
      }

      batch.set(ref, record, { merge: true });
      count++;
      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();
    console.log(`✅ Restored ${count} ${type} records.`);
  }

  console.log(
    '🎉 Full Database Restore from Google Drive completed successfully!',
  );
}

restoreFromGoogleDrive().catch((err) => {
  console.error('❌ Restore from Google Drive failed:', err);
  process.exit(1);
});
