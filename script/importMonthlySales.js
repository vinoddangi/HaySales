import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const ALIAS_FILE = join(DATA_DIR, 'customer_alias_dictionary.json');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const MERGED_SALES_FILE = join(DATA_DIR, 'merged_sales_audit.json');

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

// All 8 Monthly Grass 2026 Sheets
const GRASS_SALES_FILES = [
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

const IGNORED_NAMES = new Set([
  'retail',
  'dhuva retail',
  'expenses',
  'intrest',
  'daalu diesel + depreciation',
  'total',
]);

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

function parseSaleDate(dateStr, period) {
  if (!dateStr || String(dateStr).trim() === '') {
    const [y, m] = period.split('_');
    return new Date(`${y}-${m}-15T10:00:00.000Z`);
  }

  const str = String(dateStr).trim();

  // Handle "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T10:00:00.000Z`);
  }

  // Handle "DD/MM/YYYY"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].slice(0, 4);
    return new Date(`${y}-${m}-${d}T10:00:00.000Z`);
  }

  // Handle "1 Jan 2026" or "15 March 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  const [y, m] = period.split('_');
  return new Date(`${y}-${m}-15T10:00:00.000Z`);
}

async function importMonthlySales() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(
    '🌾 Starting Monthly Customer Sales Ingestion (MMM Grass 2026)...',
  );
  if (isDryRun) {
    console.log('🧪 MODE: DRY-RUN (No database writes)\n');
  }

  // 1. Load Local Alias Dictionary
  if (!existsSync(ALIAS_FILE)) {
    console.error(
      '❌ Alias dictionary missing. Please run "npm run db:build:registry" first.',
    );
    process.exit(1);
  }
  const aliasDict = JSON.parse(readFileSync(ALIAS_FILE, 'utf-8'));

  // Load Local Customer Registry
  const localRegistry = existsSync(REGISTRY_FILE)
    ? JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
    : [];
  const customerDocMap = new Map(); // canonicalNorm -> docId

  localRegistry.forEach((c, idx) => {
    const docId = String(idx + 1);
    customerDocMap.set(normalize(c.canonicalName), docId);
    if (c.aliases) {
      c.aliases.forEach((a) => customerDocMap.set(normalize(a), docId));
    }
  });

  console.log(
    `✅ Loaded ${customerDocMap.size} customer mappings from local registry.\n`,
  );

  let grandTotalSalesCount = 0;
  let grandTotalSalesKg = 0;
  let grandTotalSalesRevenue = 0;
  let grandTotalCashPaid = 0;
  let grandTotalCreditDebt = 0;

  const allAuditedSales = [];

  // 2. Iterate across all 8 Grass 2026 spreadsheets
  for (const gf of GRASS_SALES_FILES) {
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`🌾 Processing: [${gf.label}] (${gf.title})...`);

    try {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: gf.spreadsheetId,
      });
      const salesTab = meta.data.sheets.find((s) =>
        s.properties.title.toLowerCase().includes('sales'),
      );

      if (!salesTab) {
        console.warn(`  ⚠️ No Sales tab found in ${gf.title}`);
        continue;
      }

      const sheetTitle = salesTab.properties.title;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: gf.spreadsheetId,
        range: sheetTitle + '!A1:Z',
      });
      const rows = res.data.values || [];

      if (rows.length <= 1) {
        console.log(`   No sales rows found.`);
        continue;
      }

      const header = rows[0].map((h) => String(h).trim().toLowerCase());
      let dateColIdx = header.findIndex((h) => h.includes('date'));
      let custColIdx = header.findIndex(
        (h) => h.includes('customer') || h.includes('name'),
      );
      let kgColIdx = header.findIndex(
        (h) => h.includes('kg') || h.includes('weight'),
      );
      let rateColIdx = header.findIndex(
        (h) => h.includes('rate') || h.includes('price'),
      );
      let totalColIdx = header.findIndex(
        (h) => h.includes('total') || h.includes('amount'),
      );
      let cashColIdx = header.findIndex((h) => h.includes('cash'));
      let debtColIdx = header.findIndex(
        (h) => h.includes('debt') || h.includes('outstanding'),
      );

      if (dateColIdx === -1) dateColIdx = 0;
      if (custColIdx === -1) custColIdx = 1;
      if (kgColIdx === -1) kgColIdx = 2;
      if (rateColIdx === -1) rateColIdx = 3;
      if (totalColIdx === -1) totalColIdx = 4;
      if (cashColIdx === -1) cashColIdx = 5;
      if (debtColIdx === -1) debtColIdx = 6;

      let monthSalesCount = 0;
      let monthSalesKg = 0;
      let monthSalesAmount = 0;
      let monthCashPaid = 0;
      let monthDebt = 0;

      const salesBatch = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawName = (row[custColIdx] || '').trim();
        if (!rawName) continue;

        const norm = normalize(rawName);
        if (IGNORED_NAMES.has(norm)) continue;

        const lookup = aliasDict[norm];
        const canonicalName = lookup ? lookup.canonicalName : rawName;
        const canonicalNorm = normalize(canonicalName);

        const docId =
          customerDocMap.get(canonicalNorm) ||
          `cust_${allAuditedSales.length + 1}`;

        const date = parseSaleDate(row[dateColIdx], gf.period);
        const weightKg = parseRupeeValue(row[kgColIdx], 0);
        const rate = parseRupeeValue(row[rateColIdx], 0);
        const totalAmount = parseRupeeValue(row[totalColIdx], 0);
        const cashPaid = parseRupeeValue(row[cashColIdx], 0);
        const remainingDue =
          debtColIdx !== -1 && row[debtColIdx] !== undefined
            ? parseRupeeValue(
                row[debtColIdx],
                Math.max(0, totalAmount - cashPaid),
              )
            : Math.max(0, totalAmount - cashPaid);

        monthSalesCount++;
        monthSalesKg += weightKg;
        monthSalesAmount += totalAmount;
        monthCashPaid += cashPaid;
        monthDebt += remainingDue;

        const saleRecord = {
          docId,
          canonicalName,
          rawNameInSheet: rawName,
          item: 'Others',
          weightKg,
          rate,
          amount: totalAmount,
          cashPaid,
          remainingDue,
          date: date.toISOString(),
          period: gf.period,
          month: gf.label,
          sourceFile: gf.title,
          rowNumber: i + 1,
        };

        salesBatch.push(saleRecord);
        allAuditedSales.push(saleRecord);
      }

      console.log(
        `   📦 Sales Count: ${monthSalesCount} | Weight: ${monthSalesKg.toLocaleString(
          'en-IN',
        )} kg | Revenue: ₹${monthSalesAmount.toLocaleString('en-IN')}`,
      );
      console.log(
        `      (Immediate Cash: ₹${monthCashPaid.toLocaleString(
          'en-IN',
        )} | Credit Debt: ₹${monthDebt.toLocaleString('en-IN')})`,
      );

      grandTotalSalesCount += monthSalesCount;
      grandTotalSalesKg += monthSalesKg;
      grandTotalSalesRevenue += monthSalesAmount;
      grandTotalCashPaid += monthCashPaid;
      grandTotalCreditDebt += monthDebt;

      if (!isDryRun && salesBatch.length > 0) {
        const CHUNK_SIZE = 200;
        for (let i = 0; i < salesBatch.length; i += CHUNK_SIZE) {
          const chunk = salesBatch.slice(i, i + CHUNK_SIZE);
          const batch = db.batch();

          for (const s of chunk) {
            const txDocId = `sale_${s.period}_${s.rowNumber}`;
            const txRef = db
              .collection('customers')
              .doc(s.docId)
              .collection('transactions')
              .doc(txDocId);

            batch.set(txRef, {
              type: 'SALE',
              item: s.item,
              weightKg: s.weightKg,
              rate: s.rate,
              amount: s.amount,
              cashPaid: s.cashPaid,
              remainingDue: s.remainingDue,
              date: new Date(s.date),
              note: `Sale from ${s.sourceFile} (Row ${s.rowNumber})`,
            });
          }

          await batch.commit();
        }
        console.log(
          `   ✓ Committed ${salesBatch.length} sales records to Firestore.`,
        );
      }
    } catch (err) {
      console.error(`   ❌ Failed to process ${gf.label}:`, err.message);
    }
  }

  // 3. Save Local Audit File
  console.log('\n💾 Saving local merged sales audit file...');
  writeFileSync(
    MERGED_SALES_FILE,
    JSON.stringify(
      {
        totalSalesCount: grandTotalSalesCount,
        totalWeightKg: grandTotalSalesKg,
        totalRevenue: grandTotalSalesRevenue,
        totalCashPaid: grandTotalCashPaid,
        totalCreditDebt: grandTotalCreditDebt,
        generatedAt: new Date().toISOString(),
        sales: allAuditedSales,
      },
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`📁 Saved Sales Audit Ledger: ${MERGED_SALES_FILE}`);

  console.log(
    '\n═══════════════════════════════════════════════════════════════',
  );
  console.log('🎉 2026 SALES INGESTION SUMMARY:');
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log(`📦 Total Sales Transactions: ${grandTotalSalesCount}`);
  console.log(
    `⚖️ Total Weight Sold: ${grandTotalSalesKg.toLocaleString('en-IN')} kg`,
  );
  console.log(
    `💰 Total Revenue: ₹${grandTotalSalesRevenue.toLocaleString('en-IN')}`,
  );
  console.log(
    `💵 Immediate Cash Received: ₹${grandTotalCashPaid.toLocaleString('en-IN')}`,
  );
  console.log(
    `📝 Customer Credit Lending: ₹${grandTotalCreditDebt.toLocaleString('en-IN')}`,
  );

  if (isDryRun) {
    console.log(
      '\n💡 Dry-run complete. Run "npm run db:sales:import" to commit sales records to Firestore.',
    );
  }
}

importMonthlySales().catch((err) => {
  console.error('❌ Sales import failed:', err);
  process.exit(1);
});
