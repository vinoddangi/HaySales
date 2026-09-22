import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const SERVICES_OUTPUT_FILE = join(DATA_DIR, 'merged_services_audit.json');
const EXPENSES_OUTPUT_FILE = join(DATA_DIR, 'merged_expenses_audit.json');

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

const GRASS_FILES = [
  {
    period: '2026_01',
    label: 'Jan 2026',
    spreadsheetId: '1Pitzwi6T1G9q9APSKiXZ6DtnoSiDgJQ8xmdi1haqT_k',
    title: 'Jan Grass 2026',
  },
  {
    period: '2026_02',
    label: 'Feb 2026',
    spreadsheetId: '1yvZSTJYxM1mZkD749dZQotOsYUl1dVHBphQdrQvnmaQ',
    title: 'Feb Grass 2026',
  },
  {
    period: '2026_03',
    label: 'Mar 2026',
    spreadsheetId: '1ZGH6k6vJlLdDHAmSAMM3TlIKO1Zvwu_QfPAes3akeBM',
    title: 'March Grass 2026',
  },
  {
    period: '2026_04',
    label: 'Apr 2026',
    spreadsheetId: '1jAfkLxU2OPZ4Kd4I9UpgODT8ZiokThe75KRgliK2m_4',
    title: 'April Grass 2026',
  },
  {
    period: '2026_05',
    label: 'May 2026',
    spreadsheetId: '15Idcr9ni3IvwRi5zqebJK37tjkOlh33nMTWCqdWyuE8',
    title: 'May Grass 2026',
  },
  {
    period: '2026_06',
    label: 'Jun 2026',
    spreadsheetId: '1DKRIqV8FsvMLrWiTdJhKCKvGblCbF-kXj8SUEtrkQpI',
    title: 'Jun Grass 2026',
  },
  {
    period: '2026_07',
    label: 'Jul 2026',
    spreadsheetId: '15qc64Q1Uebuunoeca9X1N8nS8o2GDgKzv8KEsGp5R6I',
    title: 'July Grass 2026',
  },
  {
    period: '2026_08',
    label: 'Aug 2026',
    spreadsheetId: '1FfEgoNS-rnosJWvD0-go6OvUWFa5NOyOnYj9DBXisxo',
    title: 'Aug Grass 2026',
  },
];

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

function mapExpenseCategory(name) {
  const norm = String(name || '')
    .toLowerCase()
    .trim();
  if (norm.includes('intrest') || norm.includes('interest')) return 'Interest';
  if (norm.includes('diesel') || norm.includes('fuel')) return 'Fuel';
  if (norm.includes('labor') || norm.includes('labour')) return 'Labor';
  if (norm.includes('food') || norm.includes('drink')) return 'Food / Drink';
  if (norm.includes('tool')) return 'Tools';
  return 'Others';
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(fn, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (
        (err.code === 429 ||
          err.status === 429 ||
          err.message?.includes('Quota exceeded')) &&
        attempt < retries
      ) {
        const waitTime = attempt * 3000;
        console.warn(
          `  ⚠️ Rate limit hit. Backing off for ${waitTime / 1000}s (Attempt ${attempt}/${retries})...`,
        );
        await delay(waitTime);
      } else if (attempt < retries) {
        await delay(2000);
      } else {
        throw err;
      }
    }
  }
}

async function importServicesAndExpenses() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log('🚀 INGESTING 2026 SERVICES (PICKUP) & EXPENSES AUDIT');
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  if (isDryRun) {
    console.log('🧪 MODE: DRY-RUN (No database writes)\n');
  }

  const allServices = [];
  const allExpenses = [];

  let grandTotalServicesRevenue = 0;
  let grandTotalExpensesAmount = 0;

  for (const gf of GRASS_FILES) {
    console.log(`\n🌾 Processing [${gf.label}] (${gf.title})...`);

    const [y, m] = gf.period.split('_');
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    const periodDate = new Date(
      `${y}-${m}-${String(lastDay).padStart(2, '0')}T18:30:00.000Z`,
    );

    try {
      // 1. Read Sales tab bottom summary table (rows 195:205)
      const resSales = await fetchWithRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId: gf.spreadsheetId,
          range: 'Sales!A195:F205',
        }),
      );
      const salesRows = resSales.data.values || [];

      let monthServicesCount = 0;
      let monthServicesAmount = 0;
      let monthExpensesCount = 0;
      let monthExpensesAmount = 0;

      for (let i = 0; i < salesRows.length; i++) {
        const row = salesRows[i];
        const rowIdx = 195 + i;
        if (rowIdx < 198) continue; // Skip sales totals and table header row

        const colAAmount = parseRupeeValue(row[0], 0);
        const colBExpenseName = (row[1] || '').trim();
        const colCIncomeName = (row[2] || '').trim();
        const colDIncomeAmount = parseRupeeValue(row[3], 0);

        // Expense extraction from Column A & B
        if (
          colAAmount > 0 &&
          colBExpenseName &&
          colBExpenseName.toLowerCase() !== 'total' &&
          colBExpenseName.toLowerCase() !== 'expenses' &&
          !colBExpenseName.toLowerCase().includes('kg')
        ) {
          const expenseCategory = mapExpenseCategory(colBExpenseName);
          const expenseRecord = {
            id: `expense_${gf.period}_s${rowIdx}`,
            type: 'EXPENSE',
            category: 'Expense',
            expenseCategory,
            originalNameInSheet: colBExpenseName,
            amount: colAAmount,
            date: periodDate.toISOString(),
            period: gf.period,
            month: gf.label,
            sourceFile: gf.title,
            sourceTab: 'Sales',
            rowNumber: rowIdx,
            note: `${colBExpenseName} (Recorded in Sales tab bottom summary)`,
          };

          allExpenses.push(expenseRecord);
          monthExpensesCount++;
          monthExpensesAmount += colAAmount;
          console.log(
            `   🏷️ Expense: ${colBExpenseName} -> ₹${colAAmount.toLocaleString('en-IN')} [Category: ${expenseCategory}]`,
          );
        }

        // Income / Service extraction from Column C & D (e.g. Daalu = Pickup)
        if (
          colDIncomeAmount > 0 &&
          colCIncomeName &&
          colCIncomeName.toLowerCase() !== 'total' &&
          colCIncomeName.toLowerCase() !== 'income' &&
          !colCIncomeName.toLowerCase().includes('kg')
        ) {
          const serviceName =
            colCIncomeName.toLowerCase() === 'daalu'
              ? 'Pickup'
              : colCIncomeName;

          const serviceRecord = {
            id: `service_${gf.period}_s${rowIdx}`,
            type: 'SERVICE',
            category: 'Services',
            item: serviceName,
            originalNameInSheet: colCIncomeName,
            amount: colDIncomeAmount,
            date: periodDate.toISOString(),
            period: gf.period,
            month: gf.label,
            sourceFile: gf.title,
            sourceTab: 'Sales',
            rowNumber: rowIdx,
            note: `${serviceName} Service Income from ${gf.title}`,
          };

          allServices.push(serviceRecord);
          monthServicesCount++;
          monthServicesAmount += colDIncomeAmount;
          console.log(
            `   🚚 Service (Income): ${serviceName} (${colCIncomeName}) -> ₹${colDIncomeAmount.toLocaleString('en-IN')}`,
          );
        }
      }

      // 2. Read Opening/Closing Cell C2 (Payment Discount)
      const resOp = await fetchWithRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId: gf.spreadsheetId,
          range: 'Opening/Closing!C2',
        }),
      );
      const discountC2 = parseRupeeValue(resOp.data.values?.[0]?.[0], 0);

      if (discountC2 > 0) {
        const discountRecord = {
          id: `expense_discount_${gf.period}`,
          type: 'EXPENSE',
          category: 'Expense',
          expenseCategory: 'Discount',
          originalNameInSheet: 'Payment Discount',
          amount: discountC2,
          date: periodDate.toISOString(),
          period: gf.period,
          month: gf.label,
          sourceFile: gf.title,
          sourceTab: 'Opening/Closing',
          rowNumber: 2,
          cell: 'C2',
          note: `Payment Discount from Opening/Closing Sheet (${gf.label} C2)`,
        };

        allExpenses.push(discountRecord);
        monthExpensesCount++;
        monthExpensesAmount += discountC2;
        console.log(
          `   🏷️ Payment Discount (C2): ₹${discountC2.toLocaleString('en-IN')} [Category: Others]`,
        );
      }

      grandTotalServicesRevenue += monthServicesAmount;
      grandTotalExpensesAmount += monthExpensesAmount;
    } catch (err) {
      console.error(`   ❌ Failed to process ${gf.label}:`, err.message);
    }
  }

  // Save Local JSON Audit Files
  console.log('\n💾 Saving local services & expenses audit files...');

  writeFileSync(
    SERVICES_OUTPUT_FILE,
    JSON.stringify(
      {
        totalServicesCount: allServices.length,
        totalServicesRevenue: grandTotalServicesRevenue,
        generatedAt: new Date().toISOString(),
        services: allServices,
      },
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`📁 Saved Services Audit Ledger: ${SERVICES_OUTPUT_FILE}`);

  writeFileSync(
    EXPENSES_OUTPUT_FILE,
    JSON.stringify(
      {
        totalExpensesCount: allExpenses.length,
        totalExpensesAmount: grandTotalExpensesAmount,
        generatedAt: new Date().toISOString(),
        expenses: allExpenses,
      },
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`📁 Saved Expenses Audit Ledger: ${EXPENSES_OUTPUT_FILE}`);

  console.log(
    '\n═══════════════════════════════════════════════════════════════',
  );
  console.log('🎉 2026 SERVICES & EXPENSES AUDIT SUMMARY:');
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log(`🚚 Total Services Transactions: ${allServices.length}`);
  console.log(
    `💰 Total Services Revenue: ₹${grandTotalServicesRevenue.toLocaleString('en-IN')}`,
  );
  console.log(`🏷️ Total Expenses Recorded: ${allExpenses.length}`);
  console.log(
    `💸 Total Expenses Amount: ₹${grandTotalExpensesAmount.toLocaleString('en-IN')}`,
  );

  if (!isDryRun && (allServices.length > 0 || allExpenses.length > 0)) {
    console.log('\n🔥 Writing Services and Expenses to Firestore...');

    // 1. Find Retail customer ID from local registry
    let retailCustomerId = '307';
    const CUSTOMER_REGISTRY_FILE = join(
      DATA_DIR,
      'local_customer_registry.json',
    );
    try {
      const reg = JSON.parse(readFileSync(CUSTOMER_REGISTRY_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(reg)) {
        if (
          v.canonicalNorm === 'retail' ||
          v.canonicalName?.toLowerCase() === 'retail'
        ) {
          retailCustomerId = String(v.id || v.masterIndex || k);
          break;
        }
      }
    } catch (e) {
      console.warn('Using default Retail ID: 307');
    }

    console.log(`👤 Retail Customer ID resolved: ${retailCustomerId}`);

    const batch = db.batch();

    // 3. Write Services to Retail Customer subcollection (including opening Daalu)
    if (retailCustomerId) {
      // Opening Daalu prior to 2026
      const openingDaaluRef = db
        .collection('customers')
        .doc(retailCustomerId)
        .collection('transactions')
        .doc('service_opening_daalu_2026');
      batch.set(openingDaaluRef, {
        type: 'SERVICE',
        category: 'Services',
        item: 'Pickup',
        amount: 269360,
        cashPaid: 269360,
        remainingDue: 0,
        date: new Date('2026-01-01T00:00:00.000Z'),
        note: 'Opening Daalu (Pickup) balance prior to 2026 (Jan Grass 2026 Opening/Closing)',
      });

      for (const s of allServices) {
        const docRef = db
          .collection('customers')
          .doc(retailCustomerId)
          .collection('transactions')
          .doc(s.id);
        batch.set(docRef, {
          type: s.type,
          category: s.category,
          item: s.item,
          amount: s.amount,
          cashPaid: s.amount,
          remainingDue: 0,
          date: new Date(s.date),
          note: s.note,
        });
      }
    }

    // 4. Write Opening Stock to /purchases collection
    const openingStockRef = db
      .collection('purchases')
      .doc('purchase_opening_stock_2026');
    batch.set(openingStockRef, {
      type: 'PURCHASE',
      category: 'Purchase',
      item: 'Others',
      weightKg: 13528,
      purchaseRate: 10.43,
      amount: 141097.04,
      date: new Date('2026-01-01T00:00:00.000Z'),
      note: 'Opening Stock for 2026 from Jan Grass 2026 Opening/Closing Sheet (13,528 kg @ ₹10.43)',
    });

    // 5. Write Opening Expenses to /purchases collection
    const openingExpRef = db
      .collection('purchases')
      .doc('expense_opening_expenses_2026');
    batch.set(openingExpRef, {
      type: 'EXPENSE',
      category: 'Expense',
      expenseCategory: 'Others',
      amount: 395350,
      date: new Date('2026-01-01T00:00:00.000Z'),
      note: 'Opening farm operational expenses prior to 2026 (Jan Grass 2026 Opening/Closing)',
    });

    // 6. Write Expenses to root /purchases collection
    for (const e of allExpenses) {
      const docRef = db.collection('purchases').doc(e.id);
      batch.set(docRef, {
        type: e.type,
        category: e.category,
        expenseCategory: e.expenseCategory,
        amount: e.amount,
        date: new Date(e.date),
        note: e.note,
      });
    }

    await batch.commit();
    console.log(
      `✓ Committed ${allServices.length + 1} services to Retail customer and ${allExpenses.length + 2} purchases/expenses to /purchases in Firestore.`,
    );
  }
}

importServicesAndExpenses().catch((err) => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
