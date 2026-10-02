import fs from 'fs';
import path from 'path';

// ── Data Normalization & Escape Helpers ───────────────────────────────────────
function parseNumber(val, defaultVal = 0) {
  if (val === undefined || val === null) return defaultVal;
  const str = String(val).trim();
  if (!str) return defaultVal;
  const cleaned = str.replace(/[₹$€,kgKG\s]/g, '').replace(/^-/, '-');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : defaultVal;
}

function formatDateYmd(val) {
  if (!val) return '2025-01-01';
  const str = String(val).trim();
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    let y = parseInt(ymdMatch[1], 10);
    let m = parseInt(ymdMatch[2], 10);
    let d = parseInt(ymdMatch[3], 10);
    if (y < 2025) {
      y = 2025;
      m = 1;
      d = 1;
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    let y = dObj.getFullYear();
    let m = dObj.getMonth() + 1;
    let day = dObj.getDate();
    if (y < 2025) {
      y = 2025;
      m = 1;
      day = 1;
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return '2025-01-01';
}

function cleanNotesAndIds(id, notes) {
  let cleanId = id ? id.replace(/_2024_/g, '_2025_').replace(/_2024/g, '_2025') : id;
  let cleanNotes = notes
    ? notes
        .replace(/20241231/g, '2025-01-01')
        .replace(/2024 Opening/g, '2025 Opening')
        .replace(/2024 Dec/g, '2025 Jan')
    : notes;
  return { cleanId, cleanNotes };
}

function escapeCsv(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── Main Pipeline: Generates Exact DB-Matching CSVs and Snapshot ─────────────
async function main() {
  console.log('🚀 Synchronizing Reconciled Database CSVs & Snapshot (Clean YYYY-MM-DD Dates & Integer amounts)...');

  const dataDir = path.resolve('data');
  const snapshotPath = path.resolve('src/data/initialDatabaseSnapshot.json');

  // 1. Read customers.csv
  const custLines = fs
    .readFileSync(path.join(dataDir, 'customers.csv'), 'utf8')
    .split('\n')
    .filter(Boolean);
  const custHeaders = custLines[0].split(',').map((h) => h.trim());
  const cIdIdx = custHeaders.indexOf('id');
  const cNameIdx = custHeaders.indexOf('name');
  const cMobIdx = custHeaders.indexOf('mobile');
  const cVilIdx = custHeaders.indexOf('village');
  const cLimIdx = custHeaders.indexOf('creditLimit');
  const cDueIdx = custHeaders.indexOf('openingDue');

  const customers = [];
  for (let i = 1; i < custLines.length; i++) {
    const cols = custLines[i].split(',');
    if (cols.length < 2) continue;
    customers.push({
      id: cols[cIdIdx],
      name: cols[cNameIdx],
      mobile: cols[cMobIdx] || undefined,
      village: cols[cVilIdx] || undefined,
      creditLimit: cLimIdx >= 0 && cols[cLimIdx] ? parseNumber(cols[cLimIdx], 35000) : 35000,
      openingDue: cDueIdx >= 0 && cols[cDueIdx] ? parseNumber(cols[cDueIdx], 0) : 0,
    });
  }

  // 2. Read customer_transactions.csv
  const ctLines = fs
    .readFileSync(path.join(dataDir, 'customer_transactions.csv'), 'utf8')
    .split('\n')
    .filter(Boolean);
  const ctHeaders = ctLines[0].split(',').map((h) => h.trim());
  const ctIdIdx = ctHeaders.indexOf('id');
  const ctDateIdx = ctHeaders.indexOf('date');
  const ctCustIdIdx = ctHeaders.indexOf('customerId');
  const ctCustNameIdx = ctHeaders.indexOf('customerName');
  const ctTypeIdx = ctHeaders.indexOf('type');
  const ctCatIdx = ctHeaders.indexOf('category');
  const ctCropIdx = ctHeaders.indexOf('cropCategory');
  const ctSrvIdx = ctHeaders.indexOf('serviceCategory');
  const ctWeightIdx = ctHeaders.indexOf('weight');
  const ctAmtIdx = ctHeaders.indexOf('amount');
  const ctPaidIdx = ctHeaders.indexOf('cashPaid');
  const ctDueIdx = ctHeaders.indexOf('remainingDue');
  const ctMethodIdx = ctHeaders.indexOf('paymentMethod');
  const ctNotesIdx = ctHeaders.indexOf('notes');

  const customerTransactions = [];
  for (let i = 1; i < ctLines.length; i++) {
    const cols = ctLines[i].split(',');
    if (cols.length < 5) continue;
    const weightVal = parseNumber(cols[ctWeightIdx], 0);
    const amountVal = parseNumber(cols[ctAmtIdx], 0);
    const resolvedCat =
      (ctCatIdx >= 0 ? cols[ctCatIdx] : '') ||
      (ctCropIdx >= 0 ? cols[ctCropIdx] : '') ||
      (ctSrvIdx >= 0 ? cols[ctSrvIdx] : '') ||
      '';

    const isPayment = cols[ctTypeIdx] === 'PAYMENT';
    const isOpening = cols[ctIdIdx]?.startsWith('opening_') || cols[ctTypeIdx] === 'OPENING_DUE';
    const finalType = isOpening ? 'OPENING_DUE' : cols[ctTypeIdx];
    
    let cashPaidVal;
    let remainingDueVal;
    if (ctPaidIdx >= 0 && cols[ctPaidIdx] !== '') {
      cashPaidVal = parseNumber(cols[ctPaidIdx], 0);
      remainingDueVal =
        ctDueIdx >= 0 && cols[ctDueIdx] !== ''
          ? parseNumber(cols[ctDueIdx], 0)
          : isPayment || finalType === 'OPENING_DUE'
            ? 0
            : Math.max(0, amountVal - cashPaidVal);
    } else {
      const isCash =
        cols[ctMethodIdx] === 'Cash' ||
        cols[ctCustIdIdx] === '525' ||
        isPayment;
      cashPaidVal = isCash ? amountVal : 0;
      remainingDueVal = isCash || isPayment ? 0 : amountVal;
    }

    const { cleanId, cleanNotes } = cleanNotesAndIds(cols[ctIdIdx], cols[ctNotesIdx]);
    customerTransactions.push({
      id: cleanId,
      date: formatDateYmd(cols[ctDateIdx]),
      customerId: cols[ctCustIdIdx],
      customerName: cols[ctCustNameIdx],
      type: finalType,
      ...(resolvedCat && !isOpening ? { category: resolvedCat } : {}),
      weight: weightVal > 0 ? weightVal : undefined,
      amount: amountVal,
      cashPaid: cashPaidVal,
      remainingDue: remainingDueVal,
      notes: cleanNotes || undefined,
    });
  }

  // 3. Read operation_transactions.csv
  const otLines = fs
    .readFileSync(path.join(dataDir, 'operation_transactions.csv'), 'utf8')
    .split('\n')
    .filter(Boolean);
  const otHeaders = otLines[0].split(',').map((h) => h.trim());
  const otIdIdx = otHeaders.indexOf('id');
  const otDateIdx = otHeaders.indexOf('date');
  const otTypeIdx = otHeaders.indexOf('type');
  const otCatIdx = otHeaders.indexOf('category');
  const otCropIdx = otHeaders.indexOf('cropCategory');
  const otExpIdx = otHeaders.indexOf('expenseCategory');
  const otVendorIdx = otHeaders.indexOf('vendorName');
  const otWeightIdx = otHeaders.indexOf('weight');
  const otAmtIdx = otHeaders.indexOf('amount');
  const otPaidIdx = otHeaders.indexOf('cashPaid');
  const otDueIdx = otHeaders.indexOf('remainingDue');
  const otMethodIdx = otHeaders.indexOf('paymentMethod');
  const otNotesIdx = otHeaders.indexOf('notes');

  const operationTransactions = [];
  for (let i = 1; i < otLines.length; i++) {
    const cols = otLines[i].split(',');
    if (cols.length < 4) continue;
    const weightVal = parseNumber(cols[otWeightIdx], 0);
    const amountVal = parseNumber(cols[otAmtIdx], 0);

    // Determine type (PURCHASE or EXPENSE)
    let rawType = otTypeIdx >= 0 ? cols[otTypeIdx] : '';
    let rawCat = otCatIdx >= 0 ? cols[otCatIdx] : '';
    if (!rawType) {
      if (rawCat === 'PURCHASE' || rawCat === 'EXPENSE') {
        rawType = rawCat;
        rawCat = '';
      } else {
        rawType = cols[otIdIdx]?.startsWith('purchase') ? 'PURCHASE' : 'EXPENSE';
      }
    }

    const resolvedCat =
      rawCat ||
      (otCropIdx >= 0 ? cols[otCropIdx] : '') ||
      (otExpIdx >= 0 ? cols[otExpIdx] : '') ||
      (rawType === 'PURCHASE' ? 'Others' : 'Others');

    let cashPaidVal;
    let remainingDueVal;
    if (otPaidIdx >= 0 && cols[otPaidIdx] !== '') {
      cashPaidVal = parseNumber(cols[otPaidIdx], 0);
      remainingDueVal =
        otDueIdx >= 0 && cols[otDueIdx] !== ''
          ? parseNumber(cols[otDueIdx], 0)
          : Math.max(0, amountVal - cashPaidVal);
    } else {
      const isCash =
        cols[otMethodIdx] === 'Cash' ||
        rawType === 'EXPENSE';
      cashPaidVal = isCash ? amountVal : 0;
      remainingDueVal = isCash ? 0 : amountVal;
    }

    const { cleanId, cleanNotes } = cleanNotesAndIds(cols[otIdIdx], cols[otNotesIdx]);
    operationTransactions.push({
      id: cleanId,
      date: formatDateYmd(cols[otDateIdx]),
      type: rawType,
      category: resolvedCat,
      vendorName: cols[otVendorIdx] || undefined,
      weight: weightVal > 0 ? weightVal : undefined,
      amount: amountVal,
      cashPaid: cashPaidVal,
      remainingDue: remainingDueVal,
      notes: cleanNotes || undefined,
    });
  }

  // Sort chronologically
  customerTransactions.sort(
    (a, b) => a.date.localeCompare(b.date),
  );
  operationTransactions.sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  // 4. Re-write CSV files with clean unified category column
  console.log('\n💾 Writing CSV files with unified category column and YYYY-MM-DD dates...');

  const custHeader = 'id,name,mobile,village,creditLimit,openingDue\n';
  const custCsv =
    custHeader +
    customers
      .map((c) =>
        [
          escapeCsv(c.id),
          escapeCsv(c.name),
          escapeCsv(c.mobile || ''),
          escapeCsv(c.village || ''),
          c.creditLimit !== undefined ? c.creditLimit : 35000,
          c.openingDue || 0,
        ].join(','),
      )
      .join('\n');
  fs.writeFileSync(path.join(dataDir, 'customers.csv'), custCsv, 'utf8');

  const ctHeader =
    'id,date,customerId,customerName,type,category,weight,amount,cashPaid,remainingDue,notes\n';
  const ctCsv =
    ctHeader +
    customerTransactions
      .map((t) =>
        [
          escapeCsv(t.id),
          escapeCsv(t.date),
          escapeCsv(t.customerId),
          escapeCsv(t.customerName),
          escapeCsv(t.type),
          escapeCsv(t.category || ''),
          t.weight !== undefined ? t.weight : '',
          t.amount,
          t.cashPaid !== undefined ? t.cashPaid : 0,
          t.remainingDue !== undefined ? t.remainingDue : 0,
          escapeCsv(t.notes || ''),
        ].join(','),
      )
      .join('\n');
  fs.writeFileSync(
    path.join(dataDir, 'customer_transactions.csv'),
    ctCsv,
    'utf8',
  );

  const otHeader =
    'id,date,type,category,vendorName,weight,amount,cashPaid,remainingDue,notes\n';
  const otCsv =
    otHeader +
    operationTransactions
      .map((t) =>
        [
          escapeCsv(t.id),
          escapeCsv(t.date),
          escapeCsv(t.type),
          escapeCsv(t.category || ''),
          escapeCsv(t.vendorName || ''),
          t.weight !== undefined ? t.weight : '',
          t.amount,
          t.cashPaid !== undefined ? t.cashPaid : 0,
          t.remainingDue !== undefined ? t.remainingDue : 0,
          escapeCsv(t.notes || ''),
        ].join(','),
      )
      .join('\n');
  fs.writeFileSync(
    path.join(dataDir, 'operation_transactions.csv'),
    otCsv,
    'utf8',
  );

  // 5. Update initialDatabaseSnapshot.json
  const finalSnapshot = {
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      ...(c.mobile ? { mobile: c.mobile } : {}),
      ...(c.village ? { village: c.village } : {}),
      ...(c.creditLimit !== undefined ? { creditLimit: c.creditLimit } : {}),
      ...(c.openingDue ? { openingDue: c.openingDue } : {}),
    })),
    customer_transactions: customerTransactions,
    operation_transactions: operationTransactions,
  };
  fs.writeFileSync(
    snapshotPath,
    JSON.stringify(finalSnapshot, null, 2),
    'utf8',
  );

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🎉 Database CSV & Snapshot Updated with YYYY-MM-DD Dates!');
  console.log(`📁 CSV files:`);
  console.log(`   1. customers.csv              -> ${customers.length} records`);
  console.log(`   2. customer_transactions.csv   -> ${customerTransactions.length} records`);
  console.log(`   3. operation_transactions.csv  -> ${operationTransactions.length} records`);
  console.log(`📦 Compiled initial snapshot: src/data/initialDatabaseSnapshot.json`);
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
