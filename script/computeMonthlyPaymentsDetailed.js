import { existsSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// 2026 Monthly Comparison Pairs:
// Each period N compares currentFile against previousFile
const MONTHLY_PAIRS = [
  {
    period: '2026_01',
    monthLabel: 'Jan 2026',
    date: '2026-01-31T18:30:00.000Z',
    currentFile: {
      id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M',
      name: 'Customer Credit List-20260131',
    },
    previousFile: {
      id: '1HaMh9dURUBcmQW5u5w3uNgjMf9q9ufbeSkFMAFoYLsE',
      name: 'Customer Credit List-20250131',
    },
  },
  {
    period: '2026_02',
    monthLabel: 'Feb 2026',
    date: '2026-02-28T18:30:00.000Z',
    currentFile: {
      id: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8',
      name: 'Customer Credit List-20260228',
    },
    previousFile: {
      id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M',
      name: 'Customer Credit List-20260131',
    },
  },
  {
    period: '2026_03',
    monthLabel: 'Mar 2026',
    date: '2026-03-31T18:30:00.000Z',
    currentFile: {
      id: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc',
      name: 'Customer Credit List-20260331',
    },
    previousFile: {
      id: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8',
      name: 'Customer Credit List-20260228',
    },
  },
  {
    period: '2026_04',
    monthLabel: 'Apr 2026',
    date: '2026-04-30T18:30:00.000Z',
    currentFile: {
      id: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU',
      name: 'Customer Credit List-20260430',
    },
    previousFile: {
      id: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc',
      name: 'Customer Credit List-20260331',
    },
  },
  {
    period: '2026_05',
    monthLabel: 'May 2026',
    date: '2026-05-31T18:30:00.000Z',
    currentFile: {
      id: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs',
      name: 'Customer Credit List-20260531',
    },
    previousFile: {
      id: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU',
      name: 'Customer Credit List-20260430',
    },
  },
  {
    period: '2026_06',
    monthLabel: 'Jun 2026',
    date: '2026-06-30T18:30:00.000Z',
    currentFile: {
      id: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs',
      name: 'Customer Credit List-20260630',
    },
    previousFile: {
      id: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs',
      name: 'Customer Credit List-20260531',
    },
  },
  {
    period: '2026_07',
    monthLabel: 'Jul 2026',
    date: '2026-07-31T18:30:00.000Z',
    currentFile: {
      id: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
      name: 'Customer Credit List-20260731',
    },
    previousFile: {
      id: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs',
      name: 'Customer Credit List-20260630',
    },
  },
  {
    period: '2026_08',
    monthLabel: 'Aug 2026',
    date: '2026-08-31T18:30:00.000Z',
    currentFile: {
      id: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
      name: 'Customer Credit List-20260831',
    },
    previousFile: {
      id: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
      name: 'Customer Credit List-20260731',
    },
  },
];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSheetData(spreadsheetId, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A1:K300',
      });
      return res.data.values || [];
    } catch (err) {
      if (
        (err.code === 429 || err.status === 429 || err.message?.includes('Quota exceeded')) &&
        attempt < retries
      ) {
        const waitTime = attempt * 3000;
        console.warn(`  ⚠️ Rate limit hit. Backing off for ${waitTime / 1000}s (Attempt ${attempt}/${retries})...`);
        await delay(waitTime);
      } else if (attempt < retries) {
        await delay(2000);
      } else {
        throw err;
      }
    }
  }
}

async function computePayments() {
  console.log(
    `📊 Computing Monthly Customer Payments using Pairwise Month Comparisons...\n`,
  );

  // Load Alias Dictionary and Registry
  const aliasPath = join(__dirname, 'data', 'customer_alias_dictionary.json');
  const aliasDict = existsSync(aliasPath)
    ? JSON.parse(readFileSync(aliasPath, 'utf-8'))
    : {};

  const regPath = join(__dirname, 'data', 'local_customer_registry.json');
  const localRegistry = existsSync(regPath)
    ? JSON.parse(readFileSync(regPath, 'utf-8'))
    : [];

  const canonicalNameMap = new Map();
  localRegistry.forEach((c) => {
    canonicalNameMap.set(normalize(c.canonicalName), c.canonicalName);
    if (c.aliases) {
      c.aliases.forEach((a) =>
        canonicalNameMap.set(normalize(a), c.canonicalName),
      );
    }
  });

  const allMonthlyResults = [];
  let grandTotalExplicitPayments = 0;
  let grandTotalDroppedPayments = 0;
  let grandTotalScenario3Payments = 0;
  let grandTotalPaymentAmount = 0;
  let grandTotalPaymentCount = 0;

  // Cache fetched sheets
  const sheetCache = new Map();
  async function getCachedSheet(sheetId) {
    if (!sheetCache.has(sheetId)) {
      sheetCache.set(sheetId, await fetchSheetData(sheetId));
    }
    return sheetCache.get(sheetId);
  }

  for (const pair of MONTHLY_PAIRS) {
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`📅 Period: [${pair.monthLabel}] (${pair.period})`);
    console.log(
      `   Current Sheet:  ${pair.currentFile.name} (${pair.currentFile.id})`,
    );
    console.log(
      `   Previous Sheet: ${pair.previousFile.name} (${pair.previousFile.id})`,
    );

    const currentRows = await getCachedSheet(pair.currentFile.id);
    const prevRows = await getCachedSheet(pair.previousFile.id);

    // 1. Build map of previous month customers and their Column K balances
    const prevCustomerMap = new Map();
    for (let i = 1; i < prevRows.length; i++) {
      const r = prevRows[i];
      const rawName = (r[0] || '').trim();
      if (!rawName || rawName === 'Total') continue;

      const norm = normalize(rawName);
      const canonical =
        canonicalNameMap.get(norm) ||
        (aliasDict[norm] && aliasDict[norm].canonicalName) ||
        rawName;
      const canonicalNorm = normalize(canonical);
      const balanceColK = parseRupee(r[10]);

      if (prevCustomerMap.has(canonicalNorm)) {
        prevCustomerMap.get(canonicalNorm).balanceColK += balanceColK;
      } else {
        prevCustomerMap.set(canonicalNorm, {
          rawName,
          canonicalName: canonical,
          balanceColK,
          rowIndex: i + 1,
        });
      }
    }

    // 2. Scan current sheet for Column G payments and track seen customers
    const currentSeenCustomers = new Set();
    const periodPayments = [];
    let periodExplicitTotal = 0;
    let periodDroppedTotal = 0;
    let periodScenario3Total = 0;

    const customersWithExplicitPayment = new Set();
    const totalColBByCustomer = new Map();
    const currentParsedRows = [];

    for (let i = 1; i < currentRows.length; i++) {
      const r = currentRows[i];
      const rawName = (r[0] || '').trim();
      if (!rawName || rawName === 'Total') continue;

      const norm = normalize(rawName);
      const canonical =
        canonicalNameMap.get(norm) ||
        (aliasDict[norm] && aliasDict[norm].canonicalName) ||
        rawName;
      const canonicalNorm = normalize(canonical);
      currentSeenCustomers.add(canonicalNorm);

      // Column G is Credit2 (Index 6)
      const credit2ColG = parseRupee(r[6]);
      // Column H is Credit3 (Index 7, if any)
      const credit3ColH = parseRupee(r[7]);
      // Column I is Kasar / Discount (Index 8)
      const kasarColI = parseRupee(r[8]);
      const explicitPayment = credit2ColG + credit3ColH + kasarColI;

      const colB = parseRupee(r[1]);
      const colC = parseRupee(r[2]);
      const colD = parseRupee(r[3]);

      totalColBByCustomer.set(
        canonicalNorm,
        (totalColBByCustomer.get(canonicalNorm) || 0) + colB,
      );

      currentParsedRows.push({
        rowIndex: i + 1,
        rawName,
        canonical,
        canonicalNorm,
        colB,
        colC,
        colD,
        credit2ColG,
        credit3ColH,
        kasarColI,
        explicitPayment,
      });

      if (explicitPayment > 0) {
        customersWithExplicitPayment.add(canonicalNorm);
        periodExplicitTotal += explicitPayment;
        periodPayments.push({
          type:
            kasarColI > 0 && credit2ColG + credit3ColH === 0
              ? 'KASAR_DISCOUNT'
              : 'EXPLICIT_CREDIT2',
          customerName: canonical,
          rawNameInSheet: rawName,
          amount: credit2ColG + credit3ColH,
          discount: kasarColI,
          totalSettlement: explicitPayment,
          credit2: credit2ColG,
          credit3: credit3ColH,
          kasar: kasarColI,
          period: pair.period,
          month: pair.monthLabel,
          date: pair.date,
          sourceFile: pair.currentFile.name,
          rowIndex: i + 1,
        });
      }
    }

    // Scenario 3: Customer cleared previous due (Prev Col K > 0) and bought new (Total Current Col B = 0, Col C > 0 or Col D > 0)
    // Only applies if the customer did not carry forward debt on any row and did not have an explicit payment recorded
    const scenario3SeenCustomers = new Set();
    for (const row of currentParsedRows) {
      const prevData = prevCustomerMap.get(row.canonicalNorm);
      const totalColB = totalColBByCustomer.get(row.canonicalNorm) || 0;
      if (
        pair.period !== '2026_01' &&
        prevData &&
        prevData.balanceColK > 0 &&
        totalColB === 0 &&
        (row.colC > 0 || row.colD > 0) &&
        !customersWithExplicitPayment.has(row.canonicalNorm) &&
        !scenario3SeenCustomers.has(row.canonicalNorm)
      ) {
        scenario3SeenCustomers.add(row.canonicalNorm);
        periodScenario3Total += prevData.balanceColK;
        periodPayments.push({
          type: 'CLEARED_DUE_BEFORE_NEW_PURCHASE_SCENARIO_3',
          customerName: row.canonical,
          rawNameInSheet: row.rawName,
          amount: prevData.balanceColK,
          period: pair.period,
          month: pair.monthLabel,
          date: pair.date,
          sourceFile: `Cleared previous balance from ${pair.previousFile.name} before purchase in ${pair.currentFile.name}`,
          previousBalance: prevData.balanceColK,
          notes: `Customer cleared previous balance of ₹${prevData.balanceColK.toLocaleString('en-IN')} (Total Col B = 0, new buy Col C = ₹${row.colC.toLocaleString('en-IN')})`,
          rowIndex: row.rowIndex,
        });
      }
    }

    // 3. Detect Dropped / Settled Customers (In prev sheet with balance > 0, but missing from current sheet)
    // Note: For Jan 2026, since the 2026 Opening Debt is already baseline Net (Col B - Col F from Jan Sheet),
    // only Column G explicit payments are counted for Jan, preventing phantom settlements of customers not yet active.
    const droppedCustomers = [];
    if (pair.period !== '2026_01') {
      for (const [prevNorm, prevData] of prevCustomerMap.entries()) {
        if (!currentSeenCustomers.has(prevNorm) && prevData.balanceColK > 0) {
          periodDroppedTotal += prevData.balanceColK;
          const droppedEntry = {
            type: 'FULL_SETTLEMENT_DROPPED',
            customerName: prevData.canonicalName,
            rawNameInSheet: prevData.rawName,
            amount: prevData.balanceColK,
            period: pair.period,
            month: pair.monthLabel,
            date: pair.date,
            sourceFile: `Settled from ${pair.previousFile.name}`,
            previousBalance: prevData.balanceColK,
            notes: `Customer settled previous balance of ₹${prevData.balanceColK.toLocaleString('en-IN')} and was removed in ${pair.currentFile.name}`,
          };
          periodPayments.push(droppedEntry);
          droppedCustomers.push(droppedEntry);
        }
      }
    }

    const periodTotal =
      periodExplicitTotal + periodDroppedTotal + periodScenario3Total;
    grandTotalExplicitPayments += periodExplicitTotal;
    grandTotalDroppedPayments += periodDroppedTotal;
    grandTotalScenario3Payments += periodScenario3Total;
    grandTotalPaymentAmount += periodTotal;
    grandTotalPaymentCount += periodPayments.length;

    console.log(
      `   💵 Explicit Column G Payments: ${periodPayments.filter((p) => p.type === 'EXPLICIT_CREDIT2').length} totaling ₹${periodExplicitTotal.toLocaleString('en-IN')}`,
    );
    console.log(
      `   🏷️ Dropped/Settled Customers (Scenario 2): ${droppedCustomers.length} totaling ₹${periodDroppedTotal.toLocaleString('en-IN')}`,
    );
    console.log(
      `   🔄 Cleared Due Before New Purchase (Scenario 3): ${periodPayments.filter((p) => p.type === 'CLEARED_DUE_BEFORE_NEW_PURCHASE_SCENARIO_3').length} totaling ₹${periodScenario3Total.toLocaleString('en-IN')}`,
    );
    console.log(
      `   ⭐ Total Payments for ${pair.monthLabel}: ${periodPayments.length} totaling ₹${periodTotal.toLocaleString('en-IN')}`,
    );

    if (droppedCustomers.length > 0) {
      console.log(`   Sample Dropped Customers:`);
      droppedCustomers.slice(0, 5).forEach((d) => {
        console.log(
          `     - ${d.customerName}: ₹${d.amount.toLocaleString('en-IN')}`,
        );
      });
    }

    allMonthlyResults.push({
      period: pair.period,
      monthLabel: pair.monthLabel,
      date: pair.date,
      currentFile: pair.currentFile,
      previousFile: pair.previousFile,
      explicitPaymentsCount: periodPayments.filter(
        (p) => p.type === 'EXPLICIT_CREDIT2',
      ).length,
      explicitPaymentsTotal: periodExplicitTotal,
      droppedCustomersCount: droppedCustomers.length,
      droppedCustomersTotal: periodDroppedTotal,
      scenario3PaymentsCount: periodPayments.filter(
        (p) => p.type === 'CLEARED_DUE_BEFORE_NEW_PURCHASE_SCENARIO_3',
      ).length,
      scenario3PaymentsTotal: periodScenario3Total,
      periodPaymentsTotal: periodTotal,
      payments: periodPayments,
    });
  }

  // Summary
  console.log(
    `\n═══════════════════════════════════════════════════════════════`,
  );
  console.log(`🎉 2026 MONTHLY PAYMENT PAIRWISE COMPARISON SUMMARY:`);
  console.log(
    `═══════════════════════════════════════════════════════════════`,
  );
  console.log(
    `💳 Total Payments (Explicit + Dropped + Scenario 3): ${grandTotalPaymentCount}`,
  );
  console.log(
    `💵 Explicit Column G Payments: ₹${grandTotalExplicitPayments.toLocaleString('en-IN')}`,
  );
  console.log(
    `🏷️ Dropped Customer Settlements (Scenario 2): ₹${grandTotalDroppedPayments.toLocaleString('en-IN')}`,
  );
  console.log(
    `🔄 Cleared Due Before New Purchase (Scenario 3): ₹${grandTotalScenario3Payments.toLocaleString('en-IN')}`,
  );
  console.log(
    `💰 Grand Total Cash Payments: ₹${grandTotalPaymentAmount.toLocaleString('en-IN')}`,
  );

  // Flatten all payments into a single list
  const allPaymentsFlat = allMonthlyResults.flatMap((m) => m.payments);

  const outputData = {
    generatedAt: new Date().toISOString(),
    grandTotalPaymentCount,
    grandTotalExplicitPayments,
    grandTotalDroppedPayments,
    grandTotalPaymentAmount,
    monthlySummary: allMonthlyResults.map((m) => ({
      period: m.period,
      monthLabel: m.monthLabel,
      currentFile: m.currentFile.name,
      previousFile: m.previousFile.name,
      explicitPaymentsCount: m.explicitPaymentsCount,
      explicitPaymentsTotal: m.explicitPaymentsTotal,
      droppedCustomersCount: m.droppedCustomersCount,
      droppedCustomersTotal: m.droppedCustomersTotal,
      periodPaymentsTotal: m.periodPaymentsTotal,
    })),
    payments: allPaymentsFlat,
  };

  const outputPath = join(
    __dirname,
    'data',
    'monthly_payments_calculated.json',
  );
  writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n📁 Successfully saved results locally to: ${outputPath}`);
}

computePayments().catch((err) => {
  console.error('Error computing payments:', err);
  process.exit(1);
});
