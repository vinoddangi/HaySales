import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUG_SHEET_ID = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';
const DATA_DIR = join(__dirname, 'data');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const SALES_FILE = join(DATA_DIR, 'merged_sales_audit.json');
const PAYMENTS_FILE = join(DATA_DIR, 'merged_payments_audit.json');
const OUTPUT_FILE = join(
  DATA_DIR,
  'customer_final_outstanding_comparison.json',
);

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

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

async function compareOutstanding() {
  console.log(
    '🔍 Calculating Customer Outstanding from Local JSON files & Comparing with Google Sheet Column K...\n',
  );

  // 1. Load Local Files
  const registry = JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'));
  const salesData = JSON.parse(readFileSync(SALES_FILE, 'utf-8'));
  const paymentsData = JSON.parse(readFileSync(PAYMENTS_FILE, 'utf-8'));

  const salesList = salesData.sales || [];
  const paymentsList = paymentsData.payments || [];

  console.log(`Loaded ${registry.length} registry customers`);
  console.log(
    `Loaded ${salesList.length} sales records (Revenue: ₹${salesData.totalRevenue.toLocaleString('en-IN')})`,
  );
  console.log(
    `Loaded ${paymentsList.length} payment records (Total Cash: ₹${(paymentsData.totalAmount || paymentsData.grandTotalPaymentAmount || paymentsList.reduce((s, p) => s + (p.amount || 0), 0)).toLocaleString('en-IN')})\n`,
  );

  // 2. Fetch August Google Sheet (1FyT2...) Sheet1
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: AUG_SHEET_ID,
    range: 'Sheet1!A1:K300',
  });
  const sheetRows = sheetRes.data.values || [];
  console.log(
    `Fetched ${sheetRows.length} rows from August Sheet [${AUG_SHEET_ID}]\n`,
  );

  // 3. Build Customer Balance Map from Local JSONs
  const customerMap = new Map(); // norm -> customer record
  registry.forEach((c, idx) => {
    const docId = String(idx + 1);
    const norm = normalize(c.canonicalName);
    const openingDebt = c.baselineOutstanding20251231 || c.openingDebt || 0;

    const record = {
      customerId: docId,
      customerName: c.canonicalName,
      openingDebt,
      totalSalesRevenue: 0,
      totalCashPaidOnSales: 0,
      totalSalesCreditDue: 0,
      totalPaymentsReceived: 0,
      calculatedOutstanding: openingDebt,
      salesTransactions: [],
      paymentTransactions: [],
    };

    customerMap.set(norm, record);
    if (c.aliases) {
      c.aliases.forEach((a) => {
        if (!customerMap.has(normalize(a))) {
          customerMap.set(normalize(a), record);
        }
      });
    }
  });

  // Aggregate Sales
  for (const s of salesList) {
    const norm = normalize(
      s.rawNameInSheet || s.canonicalName || s.customerName,
    );
    let cust = customerMap.get(norm);
    if (!cust) {
      cust = {
        customerId: s.customerId,
        customerName: s.customerName,
        openingDebt: 0,
        totalSalesRevenue: 0,
        totalCashPaidOnSales: 0,
        totalSalesCreditDue: 0,
        totalPaymentsReceived: 0,
        calculatedOutstanding: 0,
        salesTransactions: [],
        paymentTransactions: [],
      };
      customerMap.set(norm, cust);
    }
    cust.totalSalesRevenue += s.amount || 0;
    cust.totalCashPaidOnSales += s.cashPaid || 0;
    cust.totalSalesCreditDue +=
      s.remainingDue !== undefined
        ? s.remainingDue
        : Math.max(0, s.amount - s.cashPaid);
    cust.salesTransactions.push(s);
  }

  // Aggregate Payments
  for (const p of paymentsList) {
    const norm = normalize(
      p.rawNameInSheet || p.canonicalName || p.customerName,
    );
    let cust = customerMap.get(norm);
    if (!cust) {
      cust = {
        customerId: p.docId,
        customerName: p.canonicalName,
        openingDebt: 0,
        totalSalesRevenue: 0,
        totalCashPaidOnSales: 0,
        totalSalesCreditDue: 0,
        totalPaymentsReceived: 0,
        calculatedOutstanding: 0,
        salesTransactions: [],
        paymentTransactions: [],
      };
      customerMap.set(norm, cust);
    }
    cust.totalPaymentsReceived += (p.amount || 0) + (p.discount || 0);
    cust.paymentTransactions.push(p);
  }

  // Calculate Net Outstanding
  // Outstanding = Opening Debt + Sales Credit Remaining Due - Payments Received
  const uniqueCustomers = Array.from(new Set(customerMap.values()));
  let grandTotalOpeningDebt = 0;
  let grandTotalSalesRevenue = 0;
  let grandTotalSalesCreditDue = 0;
  let grandTotalPayments = 0;
  let grandTotalCalculatedOutstanding = 0;

  for (const c of uniqueCustomers) {
    c.calculatedOutstanding = Math.max(
      0,
      c.openingDebt + c.totalSalesCreditDue - c.totalPaymentsReceived,
    );
    grandTotalOpeningDebt += c.openingDebt;
    grandTotalSalesRevenue += c.totalSalesRevenue;
    grandTotalSalesCreditDue += c.totalSalesCreditDue;
    grandTotalPayments += c.totalPaymentsReceived;
    grandTotalCalculatedOutstanding += c.calculatedOutstanding;
  }

  // 4. Compare with August Google Sheet Column K
  // First, group August sheet rows by customer to handle split rows (e.g. Valagot Dipakbhai)
  const sheetCustomerMap = new Map();
  let totalSheetColumnK = 0;

  for (let i = 1; i < sheetRows.length; i++) {
    const r = sheetRows[i];
    const rawName = (r[0] || '').trim();
    if (!rawName || rawName === 'Total') continue;

    const sheetPrvDebt = parseRupee(r[1]);
    const sheetDate2 = parseRupee(r[2]);
    const sheetDate3 = parseRupee(r[3]);
    const sheetTotalDebt = parseRupee(r[4]);
    const sheetPrvCredit = parseRupee(r[5]);
    const sheetCredit2 = parseRupee(r[6]);
    const sheetCredit3 = parseRupee(r[7]);
    const sheetKasar = parseRupee(r[8]);
    const sheetTotalCredit = parseRupee(r[9]);
    const sheetColumnK = parseRupee(r[10]);

    totalSheetColumnK += sheetColumnK;
    const norm = normalize(rawName);

    if (!sheetCustomerMap.has(norm)) {
      sheetCustomerMap.set(norm, {
        rawName,
        norm,
        rows: [],
        totalColumnK: 0,
        totalDebt: 0,
        totalCredit: 0,
      });
    }

    const entry = sheetCustomerMap.get(norm);
    entry.rows.push({
      rowIndex: i + 1,
      sheetPrvDebt,
      sheetDate2,
      sheetDate3,
      sheetTotalDebt,
      sheetPrvCredit,
      sheetCredit2,
      sheetCredit3,
      sheetKasar,
      sheetTotalCredit,
      sheetColumnK,
    });
    entry.totalColumnK += sheetColumnK;
    entry.totalDebt += sheetTotalDebt;
    entry.totalCredit += sheetTotalCredit;
  }

  const comparisonResults = [];

  for (const [norm, sheetCust] of sheetCustomerMap.entries()) {
    const dbCust = customerMap.get(norm);
    const rowIndices = sheetCust.rows.map((r) => r.rowIndex).join(', ');

    if (dbCust) {
      const diff =
        Math.round(
          (sheetCust.totalColumnK - dbCust.calculatedOutstanding) * 100,
        ) / 100;
      comparisonResults.push({
        rowIndices: `Row(s) ${rowIndices}`,
        sheetCustomerName: sheetCust.rawName,
        canonicalName: dbCust.customerName,
        customerId: dbCust.customerId,
        sheetColumnK: sheetCust.totalColumnK,
        sheetTotalDebt: sheetCust.totalDebt,
        sheetTotalCredit: sheetCust.totalCredit,
        openingDebt: dbCust.openingDebt,
        salesRevenue: dbCust.totalSalesRevenue,
        salesCreditDue: dbCust.totalSalesCreditDue,
        paymentsReceived: dbCust.totalPaymentsReceived,
        calculatedOutstanding: dbCust.calculatedOutstanding,
        difference: diff,
        status:
          Math.abs(diff) <= 50
            ? 'EXACT_MATCH'
            : diff > 0
              ? 'SHEET_HIGHER'
              : 'DB_HIGHER',
        salesCount: dbCust.salesTransactions.length,
        paymentsCount: dbCust.paymentTransactions.length,
      });
    } else {
      comparisonResults.push({
        rowIndices: `Row(s) ${rowIndices}`,
        sheetCustomerName: sheetCust.rawName,
        canonicalName: null,
        customerId: null,
        sheetColumnK: sheetCust.totalColumnK,
        sheetTotalDebt: sheetCust.totalDebt,
        sheetTotalCredit: sheetCust.totalCredit,
        openingDebt: 0,
        salesRevenue: 0,
        salesCreditDue: 0,
        paymentsReceived: 0,
        calculatedOutstanding: 0,
        difference: sheetCust.totalColumnK,
        status: 'NOT_FOUND_IN_DB',
        salesCount: 0,
        paymentsCount: 0,
      });
    }
  }

  const exactMatches = comparisonResults.filter(
    (r) => r.status === 'EXACT_MATCH',
  );
  const discrepancies = comparisonResults.filter(
    (r) => r.status !== 'EXACT_MATCH',
  );
  const sortedDiscrepancies = [...discrepancies].sort(
    (a, b) => Math.abs(b.difference) - Math.abs(a.difference),
  );

  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`📊 FINAL RECONCILIATION SUMMARY:`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`Total Sheet Customers Checked: ${comparisonResults.length}`);
  console.log(
    `✅ Exact Matches (Diff = ₹0): ${exactMatches.length} (${Math.round((exactMatches.length / comparisonResults.length) * 100)}%)`,
  );
  console.log(`⚠️ Discrepancies: ${discrepancies.length}`);
  console.log(
    `💰 Sheet Column K Total Sum: ₹${totalSheetColumnK.toLocaleString('en-IN')}`,
  );
  console.log(
    `💰 Calculated Outstanding Sum (Matched): ₹${comparisonResults.reduce((sum, r) => sum + r.calculatedOutstanding, 0).toLocaleString('en-IN')}`,
  );
  console.log(
    `💰 Grand Total Calculated Outstanding (All 382 Customers): ₹${grandTotalCalculatedOutstanding.toLocaleString('en-IN')}`,
  );

  console.log(
    `\n🔍 TOP 20 DISCREPANCIES (Sheet Column K vs Calculated Outstanding):`,
  );
  sortedDiscrepancies.slice(0, 20).forEach((d, idx) => {
    console.log(`${idx + 1}. ${d.sheetCustomerName} (Row ${d.rowIndex}):`);
    console.log(
      `   - Sheet Column K: ₹${d.sheetColumnK.toLocaleString('en-IN')} (Debt: ₹${d.sheetTotalDebt.toLocaleString('en-IN')}, Paid: ₹${d.sheetTotalCredit.toLocaleString('en-IN')})`,
    );
    console.log(
      `   - Calculated:     ₹${d.calculatedOutstanding.toLocaleString('en-IN')} (OpenDebt: ₹${d.openingDebt.toLocaleString('en-IN')}, SalesDue: ₹${d.salesCreditDue.toLocaleString('en-IN')}, Paid: ₹${d.paymentsReceived.toLocaleString('en-IN')})`,
    );
    console.log(
      `   - Variance:       ${d.difference > 0 ? '+' : ''}₹${d.difference.toLocaleString('en-IN')}\n`,
    );
  });

  const finalReport = {
    generatedAt: new Date().toISOString(),
    spreadsheetId: AUG_SHEET_ID,
    summary: {
      totalSheetCustomers: comparisonResults.length,
      exactMatchesCount: exactMatches.length,
      discrepanciesCount: discrepancies.length,
      totalSheetColumnK,
      grandTotalCalculatedOutstanding,
    },
    exactMatches,
    discrepancies: sortedDiscrepancies,
    allCustomersCalculated: uniqueCustomers
      .map((c) => ({
        customerId: c.customerId,
        customerName: c.customerName,
        openingDebt: c.openingDebt,
        totalSalesRevenue: c.totalSalesRevenue,
        totalCashPaidOnSales: c.totalCashPaidOnSales,
        totalSalesCreditDue: c.totalSalesCreditDue,
        totalPaymentsReceived: c.totalPaymentsReceived,
        calculatedOutstanding: c.calculatedOutstanding,
        salesCount: c.salesTransactions.length,
        paymentsCount: c.paymentTransactions.length,
      }))
      .sort((a, b) => b.calculatedOutstanding - a.calculatedOutstanding),
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(finalReport, null, 2));
  console.log(`📁 Saved full comparison & customer outstanding list to:`);
  console.log(`   ${OUTPUT_FILE}`);
}

compareOutstanding().catch((err) => {
  console.error('Error comparing outstanding:', err);
  process.exit(1);
});
