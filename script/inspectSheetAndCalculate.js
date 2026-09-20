import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPREADSHEET_ID = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

function parseRupee(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val)
    .replace(/[₹,\s]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeName(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`🔍 Inspecting Spreadsheet ID: ${SPREADSHEET_ID}...`);
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheet1Res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet1!A1:Z1000`,
  });
  const sheet2Res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet2!A1:Z1000`,
  });

  const sheet1Rows = sheet1Res.data.values || [];
  const sheet2Rows = sheet2Res.data.values || [];

  console.log(`Sheet1 rows: ${sheet1Rows.length}`);
  console.log(`Sheet2 rows: ${sheet2Rows.length}`);

  // Load local customer registry
  const localCustPath = join(__dirname, 'data', 'local_customer_registry.json');
  const localCustomers = JSON.parse(readFileSync(localCustPath, 'utf-8'));

  // Load sales audit
  const salesAuditPath = join(__dirname, 'data', 'merged_sales_audit.json');
  const salesAuditJson = JSON.parse(readFileSync(salesAuditPath, 'utf-8'));
  const salesAudit = salesAuditJson.sales || [];

  // Load payments audit
  const paymentsAuditPath = join(
    __dirname,
    'data',
    'merged_payments_audit.json',
  );
  const paymentsAuditJson = JSON.parse(
    readFileSync(paymentsAuditPath, 'utf-8'),
  );
  const paymentsAudit = paymentsAuditJson.payments || [];

  // Load purchases audit
  const purchasesAuditPath = join(
    __dirname,
    'data',
    'merged_purchases_audit.json',
  );
  const purchasesAuditJson = JSON.parse(
    readFileSync(purchasesAuditPath, 'utf-8'),
  );
  const purchasesAudit = purchasesAuditJson.records || [];

  console.log(
    `Local customer registry has: ${localCustomers.length} customers`,
  );
  console.log(`Sales audit has: ${salesAudit.length} sales`);
  console.log(`Payments audit has: ${paymentsAudit.length} payments`);
  console.log(`Purchases audit has: ${purchasesAudit.length} purchases`);

  // Parse Sheet1 customers and balances
  const header1 = sheet1Rows[0] || [];
  console.log(`Sheet1 Headers:`, header1);

  const sheet1Customers = [];
  let sheet1TotalPrvDebt = 0;
  let sheet1TotalPrvCredit = 0;
  let sheet1TotalKasar = 0;
  let sheet1TotalOutstanding = 0;

  for (let i = 1; i < sheet1Rows.length; i++) {
    const r = sheet1Rows[i];
    const name = r[0]?.trim();
    if (!name || name === 'Total') continue;

    const prvDebt = parseRupee(r[1]);
    const date2Debt = parseRupee(r[2]);
    const date3Debt = parseRupee(r[3]);
    const totalDebt = parseRupee(r[4]);

    const prvCredit = parseRupee(r[5]);
    const credit2 = parseRupee(r[6]);
    const credit3 = parseRupee(r[7]);
    const kasar = parseRupee(r[8]);
    const totalCredit = parseRupee(r[9]);
    const finalTotal = parseRupee(r[10]);

    sheet1TotalPrvDebt += prvDebt;
    sheet1TotalPrvCredit += prvCredit;
    sheet1TotalKasar += kasar;
    sheet1TotalOutstanding += finalTotal;

    sheet1Customers.push({
      rowIndex: i + 1,
      name,
      prvDebt,
      date2Debt,
      date3Debt,
      totalDebt,
      prvCredit,
      credit2,
      credit3,
      kasar,
      totalCredit,
      finalTotal,
    });
  }

  // Parse Sheet2 customers and balances
  const header2 = sheet2Rows[0] || [];
  console.log(`Sheet2 Headers:`, header2);

  const sheet2Customers = [];
  let sheet2TotalPrv = 0;
  let sheet2TotalNewDebt = 0;
  let sheet2TotalNewCash = 0;
  let sheet2Total = 0;

  for (let i = 1; i < sheet2Rows.length; i++) {
    const r = sheet2Rows[i];
    const name = r[1]?.trim();
    if (!name || name === 'Total') continue;

    const prvTotal = parseRupee(r[2]);
    const newDebt = parseRupee(r[3]);
    const newCash = parseRupee(r[4]);
    const total = parseRupee(r[5]);

    sheet2TotalPrv += prvTotal;
    sheet2TotalNewDebt += newDebt;
    sheet2TotalNewCash += newCash;
    sheet2Total += total;

    sheet2Customers.push({
      rowIndex: i + 1,
      name,
      prvTotal,
      newDebt,
      newCash,
      total,
    });
  }

  console.log(`\n--- Sheet1 Aggregates ---`);
  console.log(`Count: ${sheet1Customers.length}`);
  console.log(`Total Prv Debt: ₹${sheet1TotalPrvDebt.toLocaleString('en-IN')}`);
  console.log(
    `Total Prv Credit: ₹${sheet1TotalPrvCredit.toLocaleString('en-IN')}`,
  );
  console.log(`Total Kasar: ₹${sheet1TotalKasar.toLocaleString('en-IN')}`);
  console.log(
    `Total Final Outstanding: ₹${sheet1TotalOutstanding.toLocaleString('en-IN')}`,
  );

  console.log(`\n--- Sheet2 Aggregates ---`);
  console.log(`Count: ${sheet2Customers.length}`);
  console.log(`Total Prv Total: ₹${sheet2TotalPrv.toLocaleString('en-IN')}`);
  console.log(`Total New Debt: ₹${sheet2TotalNewDebt.toLocaleString('en-IN')}`);
  console.log(`Total New Cash: ₹${sheet2TotalNewCash.toLocaleString('en-IN')}`);
  console.log(`Total Outstanding: ₹${sheet2Total.toLocaleString('en-IN')}`);

  // Now calculate DB balances from local customer registry + sales + payments
  // Build lookup map by normalized customer name
  const dbCustomerMap = new Map();
  for (const c of localCustomers) {
    dbCustomerMap.set(normalizeName(c.name), {
      ...c,
      salesCount: 0,
      salesAmount: 0,
      paymentsCount: 0,
      paymentsAmount: 0,
      openingDebt: parseRupee(c.openingDebt || c.balance || 0),
      salesDescriptions: new Set(),
      paymentDescriptions: new Set(),
    });
  }

  // Aggregate Sales
  for (const s of salesAudit) {
    const norm = normalizeName(
      s.canonicalName || s.customerName || s.rawNameInSheet,
    );
    let entry = dbCustomerMap.get(norm);
    if (!entry) {
      entry = {
        id: s.customerId || `cust-${norm}`,
        name: s.canonicalName || s.customerName || s.rawNameInSheet,
        salesCount: 0,
        salesAmount: 0,
        paymentsCount: 0,
        paymentsAmount: 0,
        openingDebt: 0,
        salesDescriptions: new Set(),
        paymentDescriptions: new Set(),
      };
      dbCustomerMap.set(norm, entry);
    }
    const saleAmt = s.amount || s.totalAmount || 0;
    entry.salesCount += 1;
    entry.salesAmount += saleAmt;
    if (s.item)
      entry.salesDescriptions.add(
        `Item: ${s.item} (${s.weightKg || 0}kg @ ₹${s.rate || 0})`,
      );
    if (s.sourceFile) entry.salesDescriptions.add(`Source: ${s.sourceFile}`);
  }

  // Aggregate Payments
  for (const p of paymentsAudit) {
    const norm = normalizeName(
      p.canonicalName || p.customerName || p.rawNameInSheet,
    );
    let entry = dbCustomerMap.get(norm);
    if (!entry) {
      entry = {
        id: p.customerId || `cust-${norm}`,
        name: p.canonicalName || p.customerName || p.rawNameInSheet,
        salesCount: 0,
        salesAmount: 0,
        paymentsCount: 0,
        paymentsAmount: 0,
        openingDebt: 0,
        salesDescriptions: new Set(),
        paymentDescriptions: new Set(),
      };
      dbCustomerMap.set(norm, entry);
    }
    const payAmt = p.amount || 0;
    entry.paymentsCount += 1;
    entry.paymentsAmount += payAmt;
    if (p.sourceFile) entry.paymentDescriptions.add(`Source: ${p.sourceFile}`);
  }

  // Descriptions across all transactions
  const allSalesDescriptions = new Map();
  for (const s of salesAudit) {
    const desc = `${s.item || 'Others'} (${s.sourceFile || ''})`;
    allSalesDescriptions.set(desc, (allSalesDescriptions.get(desc) || 0) + 1);
  }

  const allPaymentDescriptions = new Map();
  for (const p of paymentsAudit) {
    const desc = `Payment via ${p.sourceFile || 'Credit List'}`;
    allPaymentDescriptions.set(
      desc,
      (allPaymentDescriptions.get(desc) || 0) + 1,
    );
  }

  const allPurchasesDescriptions = new Map();
  for (const pr of purchasesAudit) {
    const desc = `${pr.originalItemInSheet || pr.item || 'Purchase'} (${pr.sourceFile || ''})`;
    allPurchasesDescriptions.set(
      desc,
      (allPurchasesDescriptions.get(desc) || 0) + 1,
    );
  }

  // Compute total outstanding across DB
  let dbTotalOpeningDebt = 0;
  let dbTotalSales = 0;
  let dbTotalPayments = 0;
  let dbTotalOutstanding = 0;

  const dbCustomerList = [];
  for (const [norm, c] of dbCustomerMap.entries()) {
    const outstanding = c.openingDebt + c.salesAmount - c.paymentsAmount;
    dbTotalOpeningDebt += c.openingDebt;
    dbTotalSales += c.salesAmount;
    dbTotalPayments += c.paymentsAmount;
    dbTotalOutstanding += outstanding;

    dbCustomerList.push({
      id: c.id,
      name: c.name,
      openingDebt: c.openingDebt,
      salesAmount: c.salesAmount,
      salesCount: c.salesCount,
      paymentsAmount: c.paymentsAmount,
      paymentsCount: c.paymentsCount,
      outstanding,
      salesDescriptions: Array.from(c.salesDescriptions),
      paymentDescriptions: Array.from(c.paymentDescriptions),
    });
  }

  console.log(`\n--- DB Customer Ledger Summary ---`);
  console.log(`Total Customers in DB/Registry: ${dbCustomerList.length}`);
  console.log(
    `Total Opening Debt (Jan 1, 2026): ₹${dbTotalOpeningDebt.toLocaleString('en-IN')}`,
  );
  console.log(`Total 2026 Sales: ₹${dbTotalSales.toLocaleString('en-IN')}`);
  console.log(
    `Total 2026 Payments Received: ₹${dbTotalPayments.toLocaleString('en-IN')}`,
  );
  console.log(
    `Total Net Outstanding: ₹${dbTotalOutstanding.toLocaleString('en-IN')}`,
  );

  // Compare Sheet1 with DB
  const matched = [];
  const inSheetNotInDb = [];
  const inDbNotInSheet = [];

  for (const s1 of sheet1Customers) {
    const norm = normalizeName(s1.name);
    const dbEntry = dbCustomerMap.get(norm);
    if (dbEntry) {
      matched.push({
        name: s1.name,
        sheetTotal: s1.finalTotal,
        sheetPrvDebt: s1.prvDebt,
        sheetPrvCredit: s1.prvCredit,
        dbOpeningDebt: dbEntry.openingDebt,
        dbSales: dbEntry.salesAmount,
        dbPayments: dbEntry.paymentsAmount,
        dbOutstanding:
          dbEntry.openingDebt + dbEntry.salesAmount - dbEntry.paymentsAmount,
      });
    } else {
      inSheetNotInDb.push(s1);
    }
  }

  console.log(`\n--- Comparison Summary ---`);
  console.log(`Matched between Sheet & DB: ${matched.length}`);
  console.log(`In Sheet1 but NOT in DB: ${inSheetNotInDb.length}`);

  // Save report
  const report = {
    spreadsheetId: SPREADSHEET_ID,
    title: meta.data.properties.title,
    sheet1Summary: {
      totalRows: sheet1Customers.length,
      totalPrvDebt: sheet1TotalPrvDebt,
      totalPrvCredit: sheet1TotalPrvCredit,
      totalKasar: sheet1TotalKasar,
      totalOutstanding: sheet1TotalOutstanding,
    },
    sheet2Summary: {
      totalRows: sheet2Customers.length,
      totalPrvTotal: sheet2TotalPrv,
      totalNewDebt: sheet2TotalNewDebt,
      totalNewCash: sheet2TotalNewCash,
      totalOutstanding: sheet2Total,
    },
    dbSummary: {
      totalCustomers: dbCustomerList.length,
      totalOpeningDebt: dbTotalOpeningDebt,
      totalSales: dbTotalSales,
      totalPayments: dbTotalPayments,
      totalOutstanding: dbTotalOutstanding,
    },
    allSalesDescriptions: Object.fromEntries(allSalesDescriptions),
    allPaymentDescriptions: Object.fromEntries(allPaymentDescriptions),
    allPurchasesDescriptions: Object.fromEntries(allPurchasesDescriptions),
    sheet1Customers,
    sheet2Customers,
    dbCustomerList: dbCustomerList.sort(
      (a, b) => b.outstanding - a.outstanding,
    ),
  };

  writeFileSync(
    join(__dirname, 'data', 'credit_sheet_and_db_comparison.json'),
    JSON.stringify(report, null, 2),
  );

  console.log(
    `\n✅ Full comparison written to script/data/credit_sheet_and_db_comparison.json`,
  );
}

main().catch((err) => {
  console.error('Error:', err.message);
});
