import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

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

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

async function reconcile() {
  const snapshotPath = path.join(
    __dirname,
    '../src/data/initialDatabaseSnapshot.json',
  );
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  const dbTransactions = snapshot.transactions || [];
  const dbSales = dbTransactions.filter((t) => t.type === 'SALE');
  const dbServices = dbTransactions.filter((t) => t.type === 'SERVICE');

  console.log(
    '\n========================================================================================',
  );
  console.log(
    '🔍 LIVE RECONCILIATION: GOOGLE SHEETS VS OUR DATABASE (ALL 8 MONTHS)',
  );
  console.log(
    '========================================================================================\n',
  );

  const results = [];

  for (const gf of GRASS_SALES_FILES) {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: gf.spreadsheetId,
    });
    const salesTab = meta.data.sheets.find((s) =>
      s.properties.title.toLowerCase().includes('sales'),
    );
    if (!salesTab) {
      console.log(`❌ ${gf.label}: No Sales Tab`);
      continue;
    }

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: gf.spreadsheetId,
      range: salesTab.properties.title + '!A1:Z',
    });
    const rows = res.data.values || [];
    const header = (rows[0] || []).map((h) => String(h).trim().toLowerCase());
    let custCol = header.findIndex(
      (h) => h.includes('customer') || h.includes('name'),
    );
    let kgCol = header.findIndex(
      (h) => h.includes('kg') || h.includes('weight'),
    );
    let rateCol = header.findIndex(
      (h) => h.includes('rate') || h.includes('price'),
    );
    let totalCol = header.findIndex(
      (h) => h.includes('total') || h.includes('amount'),
    );
    let cashCol = header.findIndex((h) => h.includes('cash'));
    let debtCol = header.findIndex(
      (h) => h.includes('debt') || h.includes('outstanding'),
    );

    if (custCol === -1) custCol = 1;
    if (kgCol === -1) kgCol = 2;
    if (rateCol === -1) rateCol = 3;
    if (totalCol === -1) totalCol = 4;
    if (cashCol === -1) cashCol = 5;
    if (debtCol === -1) debtCol = 6;

    let sheetCount = 0;
    let sheetKg = 0;
    let sheetAmount = 0;
    let sheetCash = 0;
    let sheetDebt = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = (r[custCol] || '').trim();
      if (!name) continue;
      if (
        [
          'expenses',
          'intrest',
          'daalu diesel + depreciation',
          'total',
        ].includes(name.toLowerCase())
      )
        continue;

      const kg = parseRupeeValue(r[kgCol], 0);
      const amount = parseRupeeValue(r[totalCol], 0);
      const cash = parseRupeeValue(r[cashCol], 0);
      const debt = parseRupeeValue(r[debtCol], Math.max(0, amount - cash));

      sheetCount++;
      sheetKg += kg;
      sheetAmount += amount;
      sheetCash += cash;
      sheetDebt += debt;
    }

    // Filter DB transactions for this period
    const dbMonthSales = dbSales.filter((t) => {
      return (
        (t.id && t.id.includes(`_${gf.period}_`)) ||
        (t.note && t.note.includes(gf.title))
      );
    });

    const dbCount = dbMonthSales.length;
    const dbKg = dbMonthSales.reduce((acc, t) => acc + (t.weightKg || 0), 0);
    const dbAmount = dbMonthSales.reduce((acc, t) => acc + (t.amount || 0), 0);
    const dbCash = dbMonthSales.reduce((acc, t) => acc + (t.cashPaid || 0), 0);
    const dbDebt = dbMonthSales.reduce(
      (acc, t) => acc + (t.remainingDue || 0),
      0,
    );

    const countMatch =
      sheetCount === dbCount ? '✅ MATCH' : `❌ DIFF (${sheetCount - dbCount})`;
    const kgMatch =
      Math.round(sheetKg) === Math.round(dbKg)
        ? '✅ MATCH'
        : `❌ DIFF (${(sheetKg - dbKg).toFixed(1)})`;
    const amtMatch =
      Math.round(sheetAmount) === Math.round(dbAmount)
        ? '✅ MATCH'
        : `❌ DIFF (₹${sheetAmount - dbAmount})`;

    results.push({
      Month: gf.label,
      'Sheet Rows': sheetCount,
      'DB Rows': dbCount,
      'Rows Check': countMatch,
      'Sheet Total Kg': sheetKg.toLocaleString('en-IN') + ' kg',
      'DB Total Kg': dbKg.toLocaleString('en-IN') + ' kg',
      'Kg Check': kgMatch,
      'Sheet Revenue': '₹' + sheetAmount.toLocaleString('en-IN'),
      'DB Revenue': '₹' + dbAmount.toLocaleString('en-IN'),
      'Revenue Check': amtMatch,
      rawSheetCount: sheetCount,
      rawDbCount: dbCount,
      rawSheetKg: sheetKg,
      rawDbKg: dbKg,
      rawSheetAmt: sheetAmount,
      rawDbAmt: dbAmount,
    });
  }

  console.table(
    results.map((r) => ({
      Month: r.Month,
      'Sheet Rows': r['Sheet Rows'],
      'DB Rows': r['DB Rows'],
      Rows: r['Rows Check'],
      'Sheet Total (Kg)': r['Sheet Total Kg'],
      'DB Total (Kg)': r['DB Total Kg'],
      Kg: r['Kg Check'],
      'Sheet Total (₹)': r['Sheet Revenue'],
      'DB Total (₹)': r['DB Revenue'],
      Revenue: r['Revenue Check'],
    })),
  );

  const totalSheetCount = results.reduce((a, b) => a + b.rawSheetCount, 0);
  const totalDbCount = results.reduce((a, b) => a + b.rawDbCount, 0);
  const totalSheetKg = results.reduce((a, b) => a + b.rawSheetKg, 0);
  const totalDbKg = results.reduce((a, b) => a + b.rawDbKg, 0);
  const totalSheetAmt = results.reduce((a, b) => a + b.rawSheetAmt, 0);
  const totalDbAmt = results.reduce((a, b) => a + b.rawDbAmt, 0);

  console.log(
    '\n========================================================================================',
  );
  console.log(
    '🏆 GRAND TOTAL RECONCILIATION SUMMARY ACROSS ALL 8 SPREADSHEETS:',
  );
  console.log(
    '========================================================================================',
  );
  console.log(
    `📦 Transactions Count :  Sheets = ${totalSheetCount}  |  Database = ${totalDbCount}  |  ${totalSheetCount === totalDbCount ? '✅ 100% PERFECT MATCH' : '❌ MISMATCH'}`,
  );
  console.log(
    `⚖️ Total Weight (Kg)  :  Sheets = ${totalSheetKg.toLocaleString('en-IN')} kg  |  Database = ${totalDbKg.toLocaleString('en-IN')} kg  |  ${Math.round(totalSheetKg) === Math.round(totalDbKg) ? '✅ 100% PERFECT MATCH' : '❌ MISMATCH'}`,
  );
  console.log(
    `💰 Total Revenue (₹)  :  Sheets = ₹${totalSheetAmt.toLocaleString('en-IN')}  |  Database = ₹${totalDbAmt.toLocaleString('en-IN')}  |  ${Math.round(totalSheetAmt) === Math.round(totalDbAmt) ? '✅ 100% PERFECT MATCH' : '❌ MISMATCH'}`,
  );
  console.log(
    '========================================================================================\n',
  );
}

reconcile().catch(console.error);
