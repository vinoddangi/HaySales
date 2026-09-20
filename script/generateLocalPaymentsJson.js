import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const CALCULATED_FILE = join(DATA_DIR, 'monthly_payments_calculated.json');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const MERGED_PAYMENTS_FILE = join(DATA_DIR, 'merged_payments_audit.json');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFinalPaymentsJson() {
  console.log('📦 Formatting and finalizing local payments JSON files...\n');

  if (!existsSync(CALCULATED_FILE)) {
    console.error(
      'Error: monthly_payments_calculated.json not found. Run computeMonthlyPaymentsDetailed.js first.',
    );
    return;
  }

  const rawData = JSON.parse(readFileSync(CALCULATED_FILE, 'utf-8'));
  const registry = existsSync(REGISTRY_FILE)
    ? JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
    : [];

  const customerIdMap = new Map();
  registry.forEach((c, idx) => {
    const docId = String(idx + 1);
    customerIdMap.set(normalize(c.canonicalName), docId);
    if (c.aliases) {
      c.aliases.forEach((a) => customerIdMap.set(normalize(a), docId));
    }
  });

  const enrichedPayments = rawData.payments.map((p, idx) => {
    const docId =
      customerIdMap.get(normalize(p.customerName)) ||
      customerIdMap.get(normalize(p.rawNameInSheet)) ||
      `cust-${idx + 1}`;
    return {
      docId,
      canonicalName: p.customerName,
      rawNameInSheet: p.rawNameInSheet,
      amount: p.amount,
      discount: p.discount || 0,
      kasar: p.kasar || 0,
      totalSettlement: (p.amount || 0) + (p.discount || 0),
      type: 'PAYMENT',
      paymentType: p.type, // 'EXPLICIT_CREDIT2' or 'FULL_SETTLEMENT_DROPPED' or 'KASAR_DISCOUNT'
      credit2: p.credit2 || 0,
      credit3: p.credit3 || 0,
      previousBalance: p.previousBalance || undefined,
      period: p.period,
      month: p.month,
      date: p.date,
      sourceFile: p.sourceFile,
      notes: p.notes || `Payment received in ${p.month}`,
    };
  });

  const finalOutput = {
    totalPayments: enrichedPayments.length,
    totalExplicitPayments: rawData.grandTotalExplicitPayments,
    totalDroppedSettlements: rawData.grandTotalDroppedPayments,
    totalAmount: rawData.grandTotalPaymentAmount,
    generatedAt: new Date().toISOString(),
    monthlySummary: rawData.monthlySummary,
    payments: enrichedPayments,
  };

  writeFileSync(MERGED_PAYMENTS_FILE, JSON.stringify(finalOutput, null, 2));
  console.log(
    `✅ Saved ${enrichedPayments.length} payments (₹${finalOutput.totalAmount.toLocaleString('en-IN')}) to:`,
  );
  console.log(`   📁 ${MERGED_PAYMENTS_FILE}`);
  console.log(`   📁 ${CALCULATED_FILE}`);
}

generateFinalPaymentsJson();
