import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function getAccessToken() {
  const creds = JSON.parse(fs.readFileSync('scripts/service-account.json', 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const jwt = `${unsigned}.${sign.sign(creds.private_key, 'base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

const GRASS_SHEETS = [
  { year: 2025, month: '01', name: 'Jan Grass 2025', id: '1C274TasGsyMWwLRblMpItjzE8uXn39I0KjuTQ1nTJ2U' },
  { year: 2025, month: '02', name: 'Feb Grass 2025', id: '1VgPd99_fu-irua2__cq_6VvvxitXYAO4mYqESEXputI' },
  { year: 2025, month: '03', name: 'March Grass 2025', id: '1vGNllFNuHcNjj_Y4FJDHfX6Gx6W7nF_gsatsh-jW1Uw' },
  { year: 2025, month: '04', name: 'April Grass 2025', id: '1FJPVf2naMueUOyb_dBUb9pZBSqcIvRlKrsok1CSJXOM' },
  { year: 2025, month: '05', name: 'May Grass 2025', id: '1l9gwKeMGXEYuFbew6OqwxAjgX-KwRrgkjpEMSvFXni4' },
  { year: 2025, month: '06', name: 'Jun Grass 2025', id: '1hPlvbUp1qp3N1C9rZEGUlceErHx9bDhb2vyJnWhqlgQ' },
  { year: 2025, month: '07', name: 'July Grass 2025', id: '1NHW_B0z6EtFj4fFG8DV63lTu8VEiHVffXJ3mygZSDLc' },
  { year: 2025, month: '08', name: 'Aug Grass 2025', id: '1UBgWjEayNdMeDxLT81p4ZnJFJy6hEEiN9YcbsRA0PqY' },
  { year: 2025, month: '09', name: 'Sep Grass 2025', id: '1vgSJzMBlc50623ysVnmGAX7K3y6b4cMc1pvTVcMdoGM' },
  { year: 2025, month: '10', name: 'Oct Grass 2025', id: '1eTPdGUyrx8TTc_7ASGOaZtIjYmhD5Tz-wYzZ14_ciKk' },
  { year: 2025, month: '11', name: 'Nov Grass 2025', id: '1P_GER_N8Xej3qfXT7AUC6PgSE-q0BOW8JcNvgaC3jkw' },
  { year: 2025, month: '12', name: 'Dec Grass 2025', id: '1peCKx10p0OTsIQTdGu7I4JQrK3t4VSKZ9wqtWt884oQ' },
  { year: 2026, month: '01', name: 'Jan Grass 2026', id: '1Pitzwi6T1G9q9APSKiXZ6DtnoSiDgJQ8xmdi1haqT_k' },
  { year: 2026, month: '02', name: 'Feb Grass 2026', id: '1yvZSTJYxM1mZkD749dZQotOsYUl1dVHBphQdrQvnmaQ' },
  { year: 2026, month: '03', name: 'March Grass 2026', id: '1ZGH6k6vJlLdDHAmSAMM3TlIKO1Zvwu_QfPAes3akeBM' },
  { year: 2026, month: '04', name: 'April Grass 2026', id: '1jAfkLxU2OPZ4Kd4I9UpgODT8ZiokThe75KRgliK2m_4' },
  { year: 2026, month: '05', name: 'May Grass 2026', id: '15Idcr9ni3IvwRi5zqebJK37tjkOlh33nMTWCqdWyuE8' },
  { year: 2026, month: '06', name: 'Jun Grass 2026', id: '1DKRIqV8FsvMLrWiTdJhKCKvGblCbF-kXj8SUEtrkQpI' },
  { year: 2026, month: '07', name: 'July Grass 2026', id: '15qc64Q1Uebuunoeca9X1N8nS8o2GDgKzv8KEsGp5R6I' },
  { year: 2026, month: '08', name: 'Aug Grass 2026', id: '1FfEgoNS-rnosJWvD0-go6OvUWFa5NOyOnYj9DBXisxo' },
];

function cleanNum(val) {
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[₹,kg\s]/g, '').trim());
  return isNaN(num) ? 0 : Math.round(num);
}

async function reconcile() {
  const token = await getAccessToken();

  // Load current customer_transactions.csv
  const ctLines = fs.readFileSync('data/customer_transactions.csv', 'utf8').split('\n').filter(Boolean);
  const header = ctLines[0];
  const transactions = [];

  for (let i = 1; i < ctLines.length; i++) {
    const [id, date, customerId, customerName, type, category, weight, amount, cashPaid, remainingDue, notes] = ctLines[i].split(',');
    transactions.push({
      id,
      date,
      customerId,
      customerName,
      type,
      category,
      weight: weight ? Number(weight) : undefined,
      amount: Number(amount),
      cashPaid: Number(cashPaid),
      remainingDue: Number(remainingDue),
      notes: notes || ''
    });
  }

  console.log(`Loaded current transactions: ${transactions.length}`);

  let updatedCount = 0;

  for (const s of GRASS_SHEETS) {
    const yMonth = `${s.year}-${s.month}`;
    console.log(`\nFetching ${s.name} (${yMonth})...`);

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${s.id}/values/Sales!A1:G200`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length < 2) continue;

    const rowHeader = rows[0].map(h => String(h).trim().toLowerCase());
    const custIdx = rowHeader.findIndex(h => h.includes('customer') || h.includes('name'));
    const totalIdx = rowHeader.indexOf('total');
    const cashIdx = rowHeader.indexOf('cash');
    const debtIdx = rowHeader.findIndex(h => h.includes('debt') || h.includes('credit') || h.includes('remaining'));
    const kgIdx = rowHeader.findIndex(h => h.includes('kg') || h.includes('weight'));

    // Filter valid sales rows from sheet
    const sheetSales = [];
    let rowNum = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0] || String(row[0]).trim().toLowerCase().startsWith('total')) continue;
      const amt = totalIdx >= 0 ? cleanNum(row[totalIdx]) : 0;
      const cash = cashIdx >= 0 ? cleanNum(row[cashIdx]) : 0;
      const debt = debtIdx >= 0 ? cleanNum(row[debtIdx]) : 0;
      const kg = kgIdx >= 0 ? cleanNum(row[kgIdx]) : 0;
      const name = custIdx >= 0 ? String(row[custIdx]).trim() : '';

      if (amt > 0 || kg > 0) {
        rowNum++;
        sheetSales.push({
          rowNum,
          name,
          kg,
          amt,
          cash,
          debt: debt > 0 ? debt : Math.max(0, amt - cash),
        });
      }
    }

    // Find all SALE transactions in our db for this year-month
    const dbSalesInMonth = transactions.filter(t => t.type === 'SALE' && t.date.startsWith(yMonth));
    console.log(`  Sheet rows: ${sheetSales.length} | DB rows: ${dbSalesInMonth.length}`);

    // Match each DB sale to sheet sale
    for (let idx = 0; idx < dbSalesInMonth.length; idx++) {
      const dbTx = dbSalesInMonth[idx];
      let match = null;

      // Match by Row note if present e.g. "(Row 5)"
      const rowMatch = dbTx.notes.match(/Row (\d+)/i);
      if (rowMatch) {
        const r = parseInt(rowMatch[1], 10);
        match = sheetSales.find(s => s.rowNum === r);
      }

      // Fallback: match by index
      if (!match && idx < sheetSales.length) {
        match = sheetSales[idx];
      }

      if (match) {
        if (dbTx.cashPaid !== match.cash || dbTx.remainingDue !== match.debt || dbTx.amount !== match.amt) {
          dbTx.cashPaid = match.cash;
          dbTx.remainingDue = match.debt;
          dbTx.amount = match.amt;
          if (match.kg > 0) dbTx.weight = match.kg;
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n✅ Reconciled ${updatedCount} sales transactions with exact Google Sheet cash/credit values!`);

  // Write updated customer_transactions.csv
  const escapeCsv = (val) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [header];
  for (const t of transactions) {
    csvRows.push([
      escapeCsv(t.id),
      escapeCsv(t.date),
      escapeCsv(t.customerId),
      escapeCsv(t.customerName),
      escapeCsv(t.type),
      escapeCsv(t.category),
      t.weight !== undefined ? t.weight : '',
      t.amount,
      t.cashPaid !== undefined ? t.cashPaid : 0,
      t.remainingDue !== undefined ? t.remainingDue : 0,
      escapeCsv(t.notes)
    ].join(','));
  }
  fs.writeFileSync('data/customer_transactions.csv', csvRows.join('\n') + '\n', 'utf8');
  console.log('💾 Updated data/customer_transactions.csv');

  // Also update scripts/data/initialDatabaseSnapshot.json
  const snapshotPath = 'scripts/data/initialDatabaseSnapshot.json';
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  snapshot.customer_transactions = transactions;
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log('💾 Updated scripts/data/initialDatabaseSnapshot.json');
}

reconcile().catch(err => console.error(err));
