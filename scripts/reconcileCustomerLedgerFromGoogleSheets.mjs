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

const aliasDict = JSON.parse(fs.readFileSync('scripts/customerAliasDictionary.json', 'utf8'));

// Augment alias dictionary with special cases
aliasDict['ratada lavjibhai laxmanbhai'] = { id: '523', canonicalName: 'Ratada Lavjibhai Laxmanbhai' };
aliasDict['shipai musabhai'] = { id: '310', canonicalName: 'Shipai Musabhai' };
aliasDict['thakor harchandji laxmanji'] = { id: '459', canonicalName: 'Thakor Harchandji Laxmanji' };

function cleanNum(val) {
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[₹,kg\s]/g, '').trim());
  return isNaN(num) ? 0 : Math.round(num);
}

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCustomer(rawName) {
  const norm = normalizeKey(rawName);
  if (aliasDict[norm]) return aliasDict[norm];
  for (const k in aliasDict) {
    if (norm.includes(k) || k.includes(norm)) {
      return aliasDict[k];
    }
  }
  return null;
}

async function reconcileCustomerOutstanding() {
  const token = await getAccessToken();

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🔄 RECONCILING CUSTOMER OUTSTANDING WITH MASTER CREDIT LIST');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // 1. Fetch Master Credit List Sheet (Aug 2026)
  const masterSheetId = '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos';
  const masterRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}/values/Sheet1!A1:K350`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const masterData = await masterRes.json();
  const masterRows = masterData.values || [];

  const masterCustomerMap = new Map();
  let masterTotalDue = 0;

  for (let i = 1; i < masterRows.length; i++) {
    const row = masterRows[i];
    if (!row || !row[0] || String(row[0]).trim().toLowerCase().startsWith('total')) continue;
    const rawName = String(row[0]).trim();
    const netDue = cleanNum(row[10] || row[row.length - 1]);
    const totalDebt = cleanNum(row[4]);
    const totalCredit = cleanNum(row[9]);

    const resolved = resolveCustomer(rawName);
    if (resolved) {
      masterCustomerMap.set(resolved.id, {
        id: resolved.id,
        name: resolved.canonicalName,
        rawName,
        netDue,
        totalDebt,
        totalCredit
      });
      masterTotalDue += netDue;
    }
  }

  console.log(`Master Sheet Customers mapped: ${masterCustomerMap.size}`);
  console.log(`Master Sheet Total Outstanding: ₹${masterTotalDue.toLocaleString('en-IN')}`);

  // 2. Load current database snapshot
  const snapshotPath = 'scripts/data/initialDatabaseSnapshot.json';
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const customers = snapshot.customers || [];
  const transactions = snapshot.customer_transactions || [];

  // 3. Compute current ledger balances for each customer from transactions
  const customerBalanceMap = new Map();
  for (const c of customers) {
    customerBalanceMap.set(c.id, {
      id: c.id,
      name: c.name,
      openingDue: 0,
      creditSales: 0,
      creditServices: 0,
      payments: 0,
      discounts: 0,
      balance: 0
    });
  }

  // Non-opening transactions (SALES, SERVICES, PAYMENTS)
  const nonOpeningTransactions = [];
  const openingTransactions = [];

  for (const t of transactions) {
    if (t.type === 'OPENING_DUE') {
      openingTransactions.push(t);
    } else {
      nonOpeningTransactions.push(t);
      const cust = customerBalanceMap.get(t.customerId);
      if (cust) {
        if (t.type === 'SALE' || t.type === 'SERVICE') {
          const due = Number(t.remainingDue !== undefined ? t.remainingDue : (t.amount - (t.cashPaid || 0)));
          if (t.type === 'SALE') cust.creditSales += due;
          else cust.creditServices += due;
        } else if (t.type === 'PAYMENT') {
          cust.payments += Number(t.amount || t.cashPaid || 0);
          cust.discounts += Number(t.discount || 0);
        }
      }
    }
  }

  // 4. For each customer in Master Sheet, determine the exact baseline 2025 Opening Due required so that:
  //    Ending Balance = Master Sheet Net Due
  //    Formula: Opening Due = Master Sheet Net Due - CreditSales - CreditServices + Payments + Discounts
  const reconciledOpeningTransactions = [];
  let exactMatchCount = 0;
  let adjustedOpeningCount = 0;

  for (const [custId, masterCust] of masterCustomerMap) {
    const custStats = customerBalanceMap.get(custId);
    if (!custStats) continue;

    const netFromTransactions = custStats.creditSales + custStats.creditServices - custStats.payments - custStats.discounts;
    const requiredOpeningDue = Math.max(0, masterCust.netDue - netFromTransactions);

    if (requiredOpeningDue > 0) {
      reconciledOpeningTransactions.push({
        id: `opening_2025_${custId}`,
        date: '2025-01-01',
        customerId: custId,
        customerName: masterCust.name,
        type: 'OPENING_DUE',
        amount: requiredOpeningDue,
        cashPaid: 0,
        remainingDue: requiredOpeningDue,
        notes: `2025 Opening Outstanding Due reconciled with Master Credit List (Target Balance: ₹${masterCust.netDue})`
      });
      adjustedOpeningCount++;
    }

    // Check if end balance matches exactly
    const finalEndingBalance = requiredOpeningDue + netFromTransactions;
    if (Math.abs(finalEndingBalance - masterCust.netDue) < 1) {
      exactMatchCount++;
    }
  }

  console.log(`\nReconciled Opening Due transactions generated: ${reconciledOpeningTransactions.length}`);
  console.log(`Customers with exact 100% match to Master Google Sheet: ${exactMatchCount} / ${masterCustomerMap.size}`);

  // 5. Combine reconciled opening dues + reconciled sales/payments/services
  const allReconciledTransactions = [
    ...reconciledOpeningTransactions,
    ...nonOpeningTransactions
  ];

  // Sort chronologically
  allReconciledTransactions.sort((a, b) => a.date.localeCompare(b.date));

  // 6. Update customer_transactions.csv
  const escapeCsv = (val) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const ctHeader = 'id,date,customerId,customerName,type,category,weight,amount,cashPaid,remainingDue,notes';
  const csvRows = [ctHeader];
  for (const t of allReconciledTransactions) {
    csvRows.push([
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
      escapeCsv(t.notes || '')
    ].join(','));
  }

  fs.writeFileSync('data/customer_transactions.csv', csvRows.join('\n') + '\n', 'utf8');
  console.log('💾 Written reconciled data/customer_transactions.csv');

  // 7. Update initialDatabaseSnapshot.json
  snapshot.customer_transactions = allReconciledTransactions;
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log('💾 Written reconciled scripts/data/initialDatabaseSnapshot.json');

  // 8. Verify total customer outstanding across app matches master sheet
  let appTotalOutstanding = 0;
  for (const c of customers) {
    const custTxs = allReconciledTransactions.filter(t => t.customerId === c.id);
    let bal = 0;
    for (const t of custTxs) {
      if (t.type === 'OPENING_DUE') bal += Number(t.amount || 0);
      else if (t.type === 'SALE' || t.type === 'SERVICE') bal += Number(t.remainingDue !== undefined ? t.remainingDue : (t.amount - (t.cashPaid || 0)));
      else if (t.type === 'PAYMENT') bal -= Number(t.amount || t.cashPaid || 0);
    }
    if (bal > 0) appTotalOutstanding += bal;
  }

  console.log(`\n📊 FINAL VERIFICATION:`);
  console.log(`Google Master Sheet Total Outstanding: ₹${masterTotalDue.toLocaleString('en-IN')}`);
  console.log(`App Calculated Total Outstanding:      ₹${Math.round(appTotalOutstanding).toLocaleString('en-IN')}`);
  console.log(`Difference:                           ₹${Math.round(appTotalOutstanding - masterTotalDue).toLocaleString('en-IN')}`);
}

reconcileCustomerOutstanding().catch(err => console.error(err));
