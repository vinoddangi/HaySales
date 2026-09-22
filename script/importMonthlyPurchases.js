import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const MERGED_PURCHASES_FILE = join(DATA_DIR, 'merged_purchases_audit.json');

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
const GRASS_PURCHASE_FILES = [
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

function normalizeCropItem(raw) {
  const norm = String(raw || '')
    .toLowerCase()
    .trim();
  if (norm.includes('tuvar') || norm.includes('tuar')) return 'Tuvar';
  if (norm.includes('chana')) return 'Chana';
  if (
    norm.includes('b. kutty') ||
    norm.includes('b.kutty') ||
    norm.includes('bajri')
  )
    return 'B. Kutty';
  if (
    norm.includes('m. kutty') ||
    norm.includes('m.kutty') ||
    norm.includes('makai')
  )
    return 'M. Kutty';
  if (norm.includes('isabgol')) return 'Isabgol';
  return 'Others';
}

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

function parsePurchaseDate(dateStr, period) {
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

  // Handle "2 Jul 2026" or "15 March 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  const [y, m] = period.split('_');
  return new Date(`${y}-${m}-15T10:00:00.000Z`);
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

async function importMonthlyPurchases() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(
    '📦 Starting Monthly Stock Purchase & Expense Ingestion (MMM Grass 2026)...',
  );
  if (isDryRun) {
    console.log('🧪 MODE: DRY-RUN (No database writes)\n');
  }

  if (!isDryRun) {
    console.log('🧹 Purging existing /purchases collection in Firestore...');
    const snap = await db.collection('purchases').get();
    if (!snap.empty) {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < snap.docs.length; i += CHUNK_SIZE) {
        const chunk = snap.docs.slice(i, i + CHUNK_SIZE);
        const batch = db.batch();
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      console.log(`✓ Cleaned ${snap.size} documents from /purchases.`);
    }
  }

  let grandTotalPurchasesCount = 0;
  let grandTotalPurchasesKg = 0;
  let grandTotalPurchasesCost = 0;
  let grandTotalExpensesCount = 0;
  let grandTotalExpensesAmount = 0;

  const allAuditedPurchases = [];

  for (const gf of GRASS_PURCHASE_FILES) {
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`🌾 Processing Purchases: [${gf.label}] (${gf.title})...`);

    try {
      const meta = await fetchWithRetry(() =>
        sheets.spreadsheets.get({
          spreadsheetId: gf.spreadsheetId,
        }),
      );
      const purchaseTab = meta.data.sheets.find((s) =>
        s.properties.title.toLowerCase().includes('purchase'),
      );

      if (!purchaseTab) {
        console.warn(`  ⚠️ No Purchase tab found in ${gf.title}`);
        continue;
      }

      const sheetTitle = purchaseTab.properties.title;
      const res = await fetchWithRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId: gf.spreadsheetId,
          range: sheetTitle + '!A1:Z',
        }),
      );
      const rows = res.data.values || [];

      if (rows.length <= 1) {
        console.log(`   No purchase rows found.`);
        continue;
      }

      const header = rows[0].map((h) => String(h).trim().toLowerCase());
      let dateColIdx = header.findIndex((h) => h.includes('date'));
      let itemColIdx = header.findIndex(
        (h) => h.includes('item') || h.includes('type'),
      );
      let kgColIdx = header.findIndex(
        (h) => h.includes('kg') || h.includes('weight'),
      );
      let rateColIdx = header.findIndex(
        (h) =>
          h.includes('rate') || h.includes('price') || h.includes('avg price'),
      );
      let totalColIdx = header.findIndex(
        (h) => h.includes('total') || h.includes('amount'),
      );
      let notesColIdx = header.findIndex(
        (h) => h.includes('notes') || h.includes('note'),
      );

      if (dateColIdx === -1) dateColIdx = 0;
      if (itemColIdx === -1) itemColIdx = 1;
      if (kgColIdx === -1) kgColIdx = 2;
      if (rateColIdx === -1) rateColIdx = 3;
      if (totalColIdx === -1) totalColIdx = 4;

      let monthPurchaseCount = 0;
      let monthPurchaseKg = 0;
      let monthPurchaseCost = 0;
      let monthExpenseCount = 0;
      let monthExpenseAmount = 0;

      const batchRecords = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawDate = row[dateColIdx];
        const rawItem = (row[itemColIdx] || '').trim();
        const totalAmount = parseRupeeValue(row[totalColIdx], 0);
        const weightKg = parseRupeeValue(row[kgColIdx], 0);
        const rate = parseRupeeValue(row[rateColIdx], 0);
        const notes =
          notesColIdx !== -1 && row[notesColIdx]
            ? String(row[notesColIdx]).trim()
            : undefined;

        const rawDateStr = String(rawDate || '').trim();
        if (
          rawDateStr.toLowerCase() === 'total' ||
          rawItem.toLowerCase() === 'total' ||
          (!rawDate && !rawItem) ||
          totalAmount === 0
        ) {
          continue;
        }

        const date = parsePurchaseDate(rawDate, gf.period);
        const isExpense =
          rawItem.toLowerCase().includes('expense') ||
          rawItem.toLowerCase().includes('intrest') ||
          rawItem.toLowerCase().includes('interest') ||
          rawItem.toLowerCase().includes('daalu');

        if (isExpense) {
          monthExpenseCount++;
          monthExpenseAmount += totalAmount;

          const expenseRecord = {
            docId: `expense_${gf.period}_${i + 1}`,
            type: 'EXPENSE',
            category: 'Expense',
            expenseCategory: rawItem || 'Others',
            amount: totalAmount,
            date: date.toISOString(),
            period: gf.period,
            month: gf.label,
            sourceFile: gf.title,
            rowNumber: i + 1,
            note: notes || `Expense recorded from ${gf.title}`,
          };

          batchRecords.push(expenseRecord);
          allAuditedPurchases.push(expenseRecord);
        } else {
          monthPurchaseCount++;
          monthPurchaseKg += weightKg;
          monthPurchaseCost += totalAmount;

          const purchaseRecord = {
            docId: `purchase_${gf.period}_${i + 1}`,
            type: 'PURCHASE',
            category: 'Purchase',
            item: 'Others',
            originalItemInSheet: rawItem || 'Chana',
            weightKg,
            purchaseRate: rate,
            amount: totalAmount,
            date: date.toISOString(),
            sourceFile: gf.title,
            rowNumber: i + 1,
            note: notes || `Purchase recorded from ${gf.title}`,
          };

          batchRecords.push(purchaseRecord);
          allAuditedPurchases.push(purchaseRecord);
        }
      }

      // Process Opening/Closing tab for Cell C2 (Payment Discount)
      const opTab = meta.data.sheets.find(
        (s) =>
          s.properties.title.toLowerCase().includes('open') ||
          s.properties.title.toLowerCase().includes('close'),
      );

      if (opTab) {
        const opTitle = opTab.properties.title;
        const opRes = await fetchWithRetry(() =>
          sheets.spreadsheets.values.get({
            spreadsheetId: gf.spreadsheetId,
            range: `'${opTitle}'!A1:D5`,
          }),
        );
        const opRows = opRes.data.values || [];
        if (opRows.length >= 2 && opRows[1] && opRows[1][2]) {
          const discountVal = parseRupeeValue(opRows[1][2], 0);
          if (discountVal > 0) {
            const [y, m] = gf.period.split('_');
            const lastDay = new Date(Number(y), Number(m), 0).getDate();
            const discountDate = new Date(
              `${y}-${m}-${String(lastDay).padStart(2, '0')}T18:30:00.000Z`,
            );

            const discountRecord = {
              docId: `expense_discount_${gf.period}`,
              type: 'EXPENSE',
              category: 'Expense',
              expenseCategory: 'Discount',
              amount: discountVal,
              date: discountDate.toISOString(),
              period: gf.period,
              month: gf.label,
              sourceFile: gf.title,
              sourceTab: opTitle,
              rowNumber: 2,
              cell: 'C2',
              note: `Payment Discount from Opening/Closing Sheet (${gf.label} C2: ₹${discountVal.toLocaleString('en-IN')})`,
            };

            monthExpenseCount++;
            monthExpenseAmount += discountVal;
            batchRecords.push(discountRecord);
            allAuditedPurchases.push(discountRecord);
            console.log(
              `   🏷️ Payment Discount (C2): ₹${discountVal.toLocaleString('en-IN')}`,
            );
          }
        }
      }

      console.log(
        `   📦 Purchases: ${monthPurchaseCount} batches | Weight: ${monthPurchaseKg.toLocaleString(
          'en-IN',
        )} kg | Cost: ₹${monthPurchaseCost.toLocaleString('en-IN')}`,
      );
      if (monthExpenseCount > 0) {
        console.log(
          `   🏷️ Total Expenses: ${monthExpenseCount} entries | Amount: ₹${monthExpenseAmount.toLocaleString(
            'en-IN',
          )}`,
        );
      }

      grandTotalPurchasesCount += monthPurchaseCount;
      grandTotalPurchasesKg += monthPurchaseKg;
      grandTotalPurchasesCost += monthPurchaseCost;
      grandTotalExpensesCount += monthExpenseCount;
      grandTotalExpensesAmount += monthExpenseAmount;

      if (!isDryRun && batchRecords.length > 0) {
        const CHUNK_SIZE = 200;
        for (let i = 0; i < batchRecords.length; i += CHUNK_SIZE) {
          const chunk = batchRecords.slice(i, i + CHUNK_SIZE);
          const batch = db.batch();

          for (const item of chunk) {
            const docRef = db.collection('purchases').doc(item.docId);
            batch.set(docRef, {
              type: item.type,
              category: item.category,
              item: item.item,
              originalItemInSheet: item.originalItemInSheet,
              expenseCategory: item.expenseCategory,
              weightKg: item.weightKg,
              purchaseRate: item.purchaseRate,
              amount: item.amount,
              date: new Date(item.date),
              note: item.note,
            });
          }

          await batch.commit();
        }
        console.log(
          `   ✓ Committed ${batchRecords.length} purchase/expense records to Firestore.`,
        );
      }
    } catch (err) {
      console.error(`   ❌ Failed to process ${gf.label}:`, err.message);
    }
  }

  // Save Local Audit File
  console.log('\n💾 Saving local merged purchases audit file...');
  writeFileSync(
    MERGED_PURCHASES_FILE,
    JSON.stringify(
      {
        totalPurchasesCount: grandTotalPurchasesCount,
        totalPurchasesKg: grandTotalPurchasesKg,
        totalPurchasesCost: grandTotalPurchasesCost,
        totalExpensesCount: grandTotalExpensesCount,
        totalExpensesAmount: grandTotalExpensesAmount,
        generatedAt: new Date().toISOString(),
        records: allAuditedPurchases,
      },
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`📁 Saved Purchases Audit Ledger: ${MERGED_PURCHASES_FILE}`);

  console.log(
    '\n═══════════════════════════════════════════════════════════════',
  );
  console.log('🎉 2026 PURCHASES & EXPENSES INGESTION SUMMARY:');
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log(`📦 Total Purchases: ${grandTotalPurchasesCount} batches`);
  console.log(
    `⚖️ Total Stock Weight: ${grandTotalPurchasesKg.toLocaleString('en-IN')} kg`,
  );
  console.log(
    `💰 Total Stock Cost: ₹${grandTotalPurchasesCost.toLocaleString('en-IN')}`,
  );
  console.log(
    `🏷️ Total Expenses: ${grandTotalExpensesCount} entries (₹${grandTotalExpensesAmount.toLocaleString(
      'en-IN',
    )})`,
  );

  if (isDryRun) {
    console.log(
      '\n💡 Dry-run complete. Run "npm run db:purchases:import" to commit records to Firestore.',
    );
  }
}

importMonthlyPurchases().catch((err) => {
  console.error('❌ Purchases import failed:', err);
  process.exit(1);
});
