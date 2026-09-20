import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const ALIAS_FILE = join(DATA_DIR, 'customer_alias_dictionary.json');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const MERGED_PAYMENTS_FILE = join(DATA_DIR, 'merged_payments_audit.json');

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

// All 2026 Monthly Credit Lists (rolled back by 1 month, excluding Jan credit list which was 2025 settlement)
const MONTHLY_CREDIT_FILES = [
  {
    period: '2026_01',
    label: 'Jan 2026',
    date: '2026-01-31T18:30:00.000Z',
    spreadsheetId: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8',
    title: 'Customer Credit List-20260228',
  },
  {
    period: '2026_02',
    label: 'Feb 2026',
    date: '2026-02-28T18:30:00.000Z',
    spreadsheetId: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc',
    title: 'Customer Credit List-20260331',
  },
  {
    period: '2026_03',
    label: 'Mar 2026',
    date: '2026-03-31T18:30:00.000Z',
    spreadsheetId: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU',
    title: 'Customer Credit List-20260430',
  },
  {
    period: '2026_04',
    label: 'Apr 2026',
    date: '2026-04-30T18:30:00.000Z',
    spreadsheetId: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs',
    title: 'Customer Credit List-20260531',
  },
  {
    period: '2026_05',
    label: 'May 2026',
    date: '2026-05-31T18:30:00.000Z',
    spreadsheetId: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs',
    title: 'Customer Credit List-20260630',
  },
  {
    period: '2026_07',
    label: 'Jul 2026',
    date: '2026-07-31T18:30:00.000Z',
    spreadsheetId: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
    title: 'Customer Credit List-20260831',
  },
  {
    period: '2026_08',
    label: 'Aug 2026',
    date: '2026-08-31T18:30:00.000Z',
    spreadsheetId: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
    title: 'Customer Credit List (Aug)',
  },
];

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

async function importMonthlyPayments() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('💳 Starting Monthly Customer Payment Ingestion...');
  if (isDryRun) {
    console.log('🧪 MODE: DRY-RUN (No database writes)\n');
  }

  // 1. Load Local Alias Dictionary & Registry & Precalculated Payments
  if (!existsSync(MERGED_PAYMENTS_FILE)) {
    console.error(
      '❌ Payments audit missing. Run "node script/computeMonthlyPaymentsDetailed.js" and "node script/generateLocalPaymentsJson.js" first.',
    );
    process.exit(1);
  }

  const paymentsJson = JSON.parse(readFileSync(MERGED_PAYMENTS_FILE, 'utf-8'));
  const paymentsList = paymentsJson.payments || [];
  const localRegistry = existsSync(REGISTRY_FILE)
    ? JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
    : [];

  // Build customer map from local registry
  const customerDocMap = new Map(); // canonicalNorm -> docId
  if (Array.isArray(localRegistry)) {
    localRegistry.forEach((c) => {
      customerDocMap.set(c.canonicalNorm || normalize(c.name || c.canonicalName), String(c.id || c.masterIndex));
    });
  } else {
    Object.values(localRegistry).forEach((c) => {
      customerDocMap.set(c.canonicalNorm || normalize(c.name || c.canonicalName), String(c.id || c.masterIndex));
    });
  }

  console.log(
    `✅ Loaded ${customerDocMap.size} customer mappings from local registry.\n`,
  );
  console.log(
    `📋 Total payments to process: ${paymentsList.length} (Total: ₹${paymentsJson.totalAmount.toLocaleString('en-IN')})\n`,
  );

  let grandTotalPaymentsCount = 0;
  let grandTotalPaymentsAmount = 0;

  // Group by period
  const paymentsByPeriod = new Map();
  for (const p of paymentsList) {
    if (!paymentsByPeriod.has(p.period)) {
      paymentsByPeriod.set(p.period, []);
    }
    paymentsByPeriod.get(p.period).push(p);
  }

  for (const [period, pList] of paymentsByPeriod.entries()) {
    const monthLabel = pList[0].month;
    const periodSum = pList.reduce((acc, p) => acc + (p.amount || 0), 0);
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`📅 Processing: [${monthLabel}] (${period})...`);
    console.log(
      `   💵 Found ${pList.length} customer payment(s) totaling: ₹${periodSum.toLocaleString('en-IN')}`,
    );

    if (!isDryRun) {
      let batch = db.batch();
      let batchCount = 0;

      for (const p of pList) {
        const canonicalNorm = normalize(p.canonicalName);
        const docId = customerDocMap.get(canonicalNorm) || p.docId;
        const custRef = db.collection('customers').doc(docId);
        const txRef = custRef.collection('transactions').doc();

        batch.set(txRef, {
          type: 'PAYMENT',
          paymentType: p.paymentType,
          paymentAmount: p.amount,
          amount: p.amount,
          date: p.date ? new Date(p.date) : new Date(),
          period: p.period,
          month: p.month,
          sourceFile: p.sourceFile,
          notes: p.notes,
          customerName: p.canonicalName,
          customerId: docId,
          createdAt: new Date().toISOString(),
        });
        batchCount++;

        if (batchCount >= 400) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      console.log(
        `   ✓ Committed ${pList.length} payment records into Firestore.`,
      );
    }

    grandTotalPaymentsCount += pList.length;
    grandTotalPaymentsAmount += periodSum;
  }

  console.log(
    '\n═══════════════════════════════════════════════════════════════',
  );
  console.log('🎉 2026 MONTHLY PAYMENT INGESTION SUMMARY:');
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log(`💳 Total Payments Processed: ${grandTotalPaymentsCount}`);
  console.log(
    `💰 Total Cash Collected: ₹${grandTotalPaymentsAmount.toLocaleString('en-IN')}`,
  );
  if (isDryRun) {
    console.log(
      '\n💡 Dry-run complete. Run "npm run db:payments:import" to commit payments to Firestore.',
    );
  }
}

importMonthlyPayments().catch((err) => {
  console.error('❌ Payment import failed:', err);
  process.exit(1);
});
