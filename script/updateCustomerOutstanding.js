import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENING_CREDIT_LIST_ID = '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M';

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

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(fn, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (
        (err.code === 8 ||
          err.code === 429 ||
          err.message?.includes('Quota') ||
          err.message?.includes('RESOURCE_EXHAUSTED')) &&
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

async function updateCustomerOutstanding() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(
    `🚀 Updating Customer Opening Balances & Outstanding Amounts in Firestore...`,
  );
  if (isDryRun) console.log(`🧪 MODE: DRY-RUN (No writes)`);

  // 1. Read Net Opening Balances from Customer Credit List-202601 (Sheet2)
  const openRes = await fetchWithRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: OPENING_CREDIT_LIST_ID,
      range: `Sheet2!A1:F300`,
    }),
  );
  const openRows = openRes.data.values || [];

  const openingBalanceMap = new Map();
  let totalOpeningSum = 0;

  for (let i = 1; i < openRows.length; i++) {
    const r = openRows[i];
    const name = r[1]?.trim();
    if (!name || name === 'Total') continue;
    const prvTotal = parseRupee(r[2]);
    openingBalanceMap.set(normalize(name), prvTotal);
    totalOpeningSum += prvTotal;
  }

  console.log(
    `✅ Loaded ${openingBalanceMap.size} opening balances from Sheet totaling: ₹${totalOpeningSum.toLocaleString('en-IN')}`,
  );

  // 2. Load Alias Dictionary
  const aliasPath = join(__dirname, 'data', 'customer_alias_dictionary.json');
  const aliasDict = existsSync(aliasPath)
    ? JSON.parse(readFileSync(aliasPath, 'utf-8'))
    : {};

  // 3. Fetch all customers and all customer transactions efficiently with retry
  const custSnap = await fetchWithRetry(() => db.collection('customers').get());
  console.log(`Found ${custSnap.size} customers in Firestore.`);

  console.log('Fetching all customer transactions via collectionGroup...');
  const allTxSnap = await fetchWithRetry(() =>
    db.collectionGroup('transactions').get(),
  );
  console.log(`Found ${allTxSnap.size} transactions across all customers.`);

  // Group transactions by customerId
  const customerTxMap = new Map();
  allTxSnap.docs.forEach((tDoc) => {
    const custId = tDoc.ref.parent.parent?.id;
    if (custId) {
      if (!customerTxMap.has(custId)) customerTxMap.set(custId, []);
      customerTxMap.get(custId).push(tDoc.data());
    }
  });

  let updatedCustomersCount = 0;
  let totalCalculatedOutstandingAll = 0;
  let totalOpeningDebtsAll = 0;
  let batch = db.batch();
  let opCount = 0;

  const registryUpdates = [];

  for (const doc of custSnap.docs) {
    const custData = doc.data();
    const custName = custData.name || doc.id;
    const norm = normalize(custName);

    // Look up opening balance by canonical or aliases
    let openingDebt = openingBalanceMap.get(norm) || 0;
    if (openingDebt === 0) {
      for (const [alias, canonical] of Object.entries(aliasDict)) {
        if (normalize(canonical) === norm) {
          const aliasDebt = openingBalanceMap.get(normalize(alias));
          if (aliasDebt) {
            openingDebt = aliasDebt;
            break;
          }
        }
      }
    }

    // Compute sales and payments from grouped transactions
    const custTxList = customerTxMap.get(doc.id) || [];
    let totalSalesCredit = 0;
    let totalPayments = 0;

    for (const td of custTxList) {
      if (td.type === 'SALE' || td.type === 'SERVICE') {
        const amt = Number(td.amount || td.totalAmount || 0);
        const cash = Number(td.cashPaid || 0);
        const remaining =
          td.remainingDue !== undefined
            ? Number(td.remainingDue)
            : Math.max(0, amt - cash);
        totalSalesCredit += remaining;
      } else if (td.type === 'PAYMENT') {
        totalPayments += Number(td.amount || td.paymentAmount || 0);
      }
    }

    const outstandingAmount = Math.max(
      0,
      openingDebt + totalSalesCredit - totalPayments,
    );
    totalOpeningDebtsAll += openingDebt;
    totalCalculatedOutstandingAll += outstandingAmount;

    // Opening Balance transaction ref
    const openingTxRef = doc.ref
      .collection('transactions')
      .doc('opening_balance_2026');

    if (!isDryRun) {
      if (openingDebt > 0) {
        batch.set(
          openingTxRef,
          {
            id: 'opening_balance_2026',
            customerId: doc.id,
            customerName: custName,
            type: 'OPENING_BALANCE',
            amount: openingDebt,
            date: '2026-01-01T00:00:00.000Z',
            period: '2026_01',
            month: 'Jan 2026',
            notes: 'Net Opening Balance from Customer Credit List-202601',
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        );
        opCount++;
      } else {
        // If opening debt is 0, remove phantom opening if present
        batch.delete(openingTxRef);
        opCount++;
      }

      // Update customer document
      batch.update(doc.ref, {
        openingDebt,
        outstandingAmount,
        updatedAt: new Date().toISOString(),
      });
      opCount++;

      if (opCount >= 400) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    updatedCustomersCount++;
    registryUpdates.push({
      id: doc.id,
      name: custName,
      openingDebt,
      outstandingAmount,
      totalSalesCredit,
      totalPayments,
    });
  }

  if (!isDryRun && opCount > 0) {
    await batch.commit();
  }

  // Update local registry file
  const regPath = join(__dirname, 'data', 'local_customer_registry.json');
  if (existsSync(regPath)) {
    const localReg = JSON.parse(readFileSync(regPath, 'utf-8'));
    const regMap = new Map(registryUpdates.map((u) => [u.id, u]));
    const merged = localReg.map((c) => {
      const u = regMap.get(c.id);
      return u
        ? {
            ...c,
            openingDebt: u.openingDebt,
            outstandingAmount: u.outstandingAmount,
          }
        : c;
    });
    writeFileSync(regPath, JSON.stringify(merged, null, 2));
    console.log(`📁 Updated ${regPath}`);
  }

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`🎉 CUSTOMER OUTSTANDING UPDATE COMPLETED:`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`👥 Total Customers Updated: ${updatedCustomersCount}`);
  console.log(
    `💵 Total Opening Debt (Jan 1, 2026): ₹${totalOpeningDebtsAll.toLocaleString('en-IN')}`,
  );
  console.log(
    `💰 Total Real-Time Outstanding in DB: ₹${totalCalculatedOutstandingAll.toLocaleString('en-IN')}`,
  );
}

updateCustomerOutstanding().catch((err) => {
  console.error('Error updating customer outstanding:', err);
  process.exit(1);
});
