import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target Google Drive Folder ID provided by user
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

function formatCsvDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (d.toISOString) return d.toISOString();
  if (d._seconds) return new Date(d._seconds * 1000).toISOString();
  if (d.seconds) return new Date(d.seconds * 1000).toISOString();
  return String(d);
}

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'object' &&
    ('seconds' in value || '_seconds' in value || 'toDate' in value)
  ) {
    value = formatCsvDate(value);
  }
  const str = String(value);
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertToCsv(data, columns) {
  const headerRow = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const rows = data.map((item) =>
    columns.map((col) => escapeCsvCell(col.accessor(item))).join(','),
  );
  return [headerRow, ...rows].join('\r\n');
}

async function uploadCsvToDrive(
  fileName,
  csvContent,
  folderId = DRIVE_FOLDER_ID,
) {
  console.log(
    `📤 Uploading "${fileName}" to Google Drive folder (${folderId})...`,
  );

  // Check if file with same name exists in folder; if so, update or create
  const listRes = await drive.files.list({
    q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
    fields: 'files(id, name)',
  });

  const existing = (listRes.data.files || [])[0];

  if (existing) {
    const updateRes = await drive.files.update({
      fileId: existing.id,
      media: {
        mimeType: 'text/csv',
        body: Readable.from([csvContent]),
      },
      fields: 'id, name, webViewLink',
    });
    console.log(
      `✅ Updated existing file: ${fileName} (ID: ${updateRes.data.id})`,
    );
    return updateRes.data;
  } else {
    const createRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: 'text/csv',
      },
      media: {
        mimeType: 'text/csv',
        body: Readable.from([csvContent]),
      },
      fields: 'id, name, webViewLink',
    });
    console.log(`✅ Uploaded new file: ${fileName} (ID: ${createRes.data.id})`);
    return createRes.data;
  }
}

export async function runDriveBackup() {
  console.log('🚀 Starting Full Database CSV Backup to Google Drive...\n');
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0];
  const timeStamp = now.toISOString().replace(/[:.]/g, '-');

  // 1. Fetch Customers & Customer Transactions (Sales, Payments, Services)
  console.log('📦 Fetching customers and transactions from Firestore...');
  const custSnap = await db.collection('customers').get();
  console.log(`Found ${custSnap.size} customers.`);

  const customers = [];
  const sales = [];
  const payments = [];
  const services = [];

  for (const docSnap of custSnap.docs) {
    const cData = docSnap.data();
    const cust = {
      id: docSnap.id,
      name: cData.name || '',
      mobile: cData.mobile || '',
      village: cData.village || '',
      creditLimit: cData.creditLimit || 35000,
      outstandingAmount: cData.outstandingAmount || 0,
    };
    customers.push(cust);

    const txSnap = await docSnap.ref.collection('transactions').get();
    txSnap.forEach((tDoc) => {
      const data = tDoc.data();
      const rawType = (data.type || data.category || 'SALE').toString().toUpperCase();
      let type = 'SALE';
      if (rawType.includes('SERVICE')) type = 'SERVICE';
      else if (rawType.includes('PAYMENT')) type = 'PAYMENT';
      else if (rawType.includes('OPENING')) type = 'OPENING_BALANCE';
      else if (rawType.includes('EXPENSE')) type = 'EXPENSE';
      else if (rawType.includes('PURCHASE')) type = 'PURCHASE';

      const t = {
        id: tDoc.id,
        customerId: cust.id,
        customerName: cust.name,
        ...data,
        type,
      };
      if (type === 'SALE') sales.push(t);
      else if (type === 'PAYMENT') payments.push(t);
      else if (type === 'SERVICE') services.push(t);
    });
  }

  // 2. Fetch Purchases & Expenses
  console.log('📦 Fetching purchases and expenses from Firestore...');
  const purchSnap = await db.collection('purchases').get();
  const purchases = [];
  const expenses = [];

  purchSnap.forEach((pDoc) => {
    const data = pDoc.data();
    const rawType = (data.type || data.category || 'PURCHASE').toString().toUpperCase();
    const type = rawType.includes('EXPENSE') ? 'EXPENSE' : 'PURCHASE';
    const p = { id: pDoc.id, ...data, type };
    if (type === 'EXPENSE') expenses.push(p);
    else purchases.push(p);
  });

function formatDateForCsv(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toISOString();
  }
  if (typeof dateVal === 'object' && typeof dateVal._seconds === 'number') {
    return new Date(dateVal._seconds * 1000).toISOString();
  }
  if (typeof dateVal === 'object' && typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000).toISOString();
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? String(dateVal) : d.toISOString();
}

  // 3. Convert all datasets to CSV format
  const customerCsv = convertToCsv(customers, [
    { header: 'CustomerID', accessor: (c) => c.id },
    { header: 'CustomerName', accessor: (c) => c.name },
    { header: 'Mobile', accessor: (c) => c.mobile },
    { header: 'Village', accessor: (c) => c.village },
    { header: 'CreditLimit', accessor: (c) => c.creditLimit },
    { header: 'OutstandingAmount', accessor: (c) => c.outstandingAmount },
  ]);

  const salesCsv = convertToCsv(sales, [
    { header: 'TransactionID', accessor: (t) => t.id },
    { header: 'CustomerID', accessor: (t) => t.customerId },
    { header: 'CustomerName', accessor: (t) => t.customerName },
    { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
    { header: 'Item', accessor: (t) => t.item || 'Others' },
    { header: 'WeightKg', accessor: (t) => t.weightKg || 0 },
    { header: 'Rate', accessor: (t) => t.rate || 0 },
    { header: 'TotalAmount', accessor: (t) => t.amount || 0 },
    { header: 'CashPaid', accessor: (t) => t.cashPaid || 0 },
    { header: 'RemainingDue', accessor: (t) => t.remainingDue || 0 },
    { header: 'Notes', accessor: (t) => t.note || '' },
  ]);

  const paymentsCsv = convertToCsv(payments, [
    { header: 'PaymentID', accessor: (t) => t.id },
    { header: 'CustomerID', accessor: (t) => t.customerId },
    { header: 'CustomerName', accessor: (t) => t.customerName },
    { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
    { header: 'AmountPaid', accessor: (t) => t.amount || t.paymentAmount || 0 },
    { header: 'Notes', accessor: (t) => t.note || '' },
  ]);

  const purchasesCsv = convertToCsv(purchases, [
    { header: 'PurchaseID', accessor: (t) => t.id },
    { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
    { header: 'Category', accessor: (t) => t.category || 'Purchase' },
    { header: 'Item', accessor: (t) => t.item || 'Others' },
    { header: 'WeightKg', accessor: (t) => t.weightKg || 0 },
    { header: 'PurchaseRate', accessor: (t) => t.purchaseRate || t.rate || 0 },
    { header: 'Amount', accessor: (t) => t.amount || 0 },
    { header: 'VendorName', accessor: (t) => t.vendorName || '' },
    { header: 'Notes', accessor: (t) => t.note || '' },
  ]);

  const expensesCsv = convertToCsv(expenses, [
    { header: 'ExpenseID', accessor: (t) => t.id },
    { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
    {
      header: 'ExpenseCategory',
      accessor: (t) => t.expenseCategory || 'Others',
    },
    { header: 'Item', accessor: (t) => t.item || 'Others' },
    { header: 'Amount', accessor: (t) => t.amount || 0 },
    { header: 'Notes', accessor: (t) => t.note || '' },
  ]);

  const servicesCsv = convertToCsv(services, [
    { header: 'ServiceID', accessor: (t) => t.id },
    { header: 'CustomerID', accessor: (t) => t.customerId || '307' },
    {
      header: 'CustomerName',
      accessor: (t) => t.customerName || 'Retail Customer',
    },
    { header: 'Date', accessor: (t) => formatDateForCsv(t.date) },
    { header: 'Item', accessor: (t) => t.item || 'Pickup' },
    { header: 'Amount', accessor: (t) => t.amount || 0 },
    { header: 'Notes', accessor: (t) => t.note || '' },
  ]);

  // Save local copy in script/data/backups/
  const localBackupDir = join(__dirname, 'data', 'backups');
  if (!existsSync(localBackupDir))
    mkdirSync(localBackupDir, { recursive: true });

  writeFileSync(join(localBackupDir, 'customers.csv'), customerCsv, 'utf-8');
  writeFileSync(join(localBackupDir, 'sales.csv'), salesCsv, 'utf-8');
  writeFileSync(join(localBackupDir, 'payments.csv'), paymentsCsv, 'utf-8');
  writeFileSync(join(localBackupDir, 'purchases.csv'), purchasesCsv, 'utf-8');
  writeFileSync(join(localBackupDir, 'expenses.csv'), expensesCsv, 'utf-8');
  writeFileSync(join(localBackupDir, 'services.csv'), servicesCsv, 'utf-8');

  // 4. Upload all CSVs to Google Drive folder
  console.log('\n☁️ Uploading CSV files to Google Drive folder "db-backup"...');
  await uploadCsvToDrive('customers.csv', customerCsv);
  await uploadCsvToDrive('sales.csv', salesCsv);
  await uploadCsvToDrive('payments.csv', paymentsCsv);
  await uploadCsvToDrive('purchases.csv', purchasesCsv);
  await uploadCsvToDrive('expenses.csv', expensesCsv);
  await uploadCsvToDrive('services.csv', servicesCsv);

  // Also upload dated archive copies for version history
  await uploadCsvToDrive(`customers_${dateStamp}.csv`, customerCsv);
  await uploadCsvToDrive(`sales_${dateStamp}.csv`, salesCsv);
  await uploadCsvToDrive(`purchases_${dateStamp}.csv`, purchasesCsv);
  await uploadCsvToDrive(`payments_${dateStamp}.csv`, paymentsCsv);

  // 5. Update Firestore metadata/backup_status
  await db
    .collection('metadata')
    .doc('backup_status')
    .set(
      {
        lastDriveBackupAt: now.toISOString(),
        driveFolderId: DRIVE_FOLDER_ID,
        driveFolderUrl: `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`,
        backedUpFiles: [
          'customers.csv',
          'sales.csv',
          'payments.csv',
          'purchases.csv',
          'expenses.csv',
          'services.csv',
        ],
        totalRecords: {
          customers: customers.length,
          sales: sales.length,
          payments: payments.length,
          purchases: purchases.length,
          expenses: expenses.length,
          services: services.length,
        },
      },
      { merge: true },
    );

  console.log('\n🎉 Successfully completed Google Drive CSV Backup!');
  console.log(
    `🔗 Folder URL: https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDriveBackup().catch((err) => {
    console.error('❌ Backup to Google Drive failed:', err);
    process.exit(1);
  });
}
