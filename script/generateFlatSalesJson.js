import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const SALES_AUDIT_FILE = join(DATA_DIR, 'merged_sales_audit.json');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const FLAT_SALES_FILE = join(DATA_DIR, 'local_sales_records.json');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFlatSalesJson() {
  console.log(
    '📦 Generating flat, date-sorted local sales records for direct DB export...\n',
  );

  if (!existsSync(SALES_AUDIT_FILE)) {
    console.error('Error: merged_sales_audit.json missing.');
    return;
  }

  const salesJson = JSON.parse(readFileSync(SALES_AUDIT_FILE, 'utf-8'));
  const salesList = salesJson.sales || [];
  const registry = existsSync(REGISTRY_FILE)
    ? JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
    : [];

  // Build canonical customer mapping: normalized -> { customerId, canonicalName }
  const customerIdMap = new Map();
  registry.forEach((c, idx) => {
    const docId = String(idx + 1);
    const norm = normalize(c.canonicalName);
    customerIdMap.set(norm, {
      customerId: docId,
      canonicalName: c.canonicalName,
    });
    if (c.aliases) {
      c.aliases.forEach((a) => {
        customerIdMap.set(normalize(a), {
          customerId: docId,
          canonicalName: c.canonicalName,
        });
      });
    }
  });

  const flatSales = salesList.map((s, idx) => {
    const norm = normalize(
      s.rawNameInSheet || s.canonicalName || s.customerName,
    );
    const mapped = customerIdMap.get(norm);
    const customerId = mapped
      ? mapped.customerId
      : s.docId || `cust-${idx + 1}`;
    const customerName = mapped
      ? mapped.canonicalName
      : s.canonicalName || s.rawNameInSheet;

    const amount = Number(s.amount || s.totalAmount || 0);
    const cashPaid = Number(s.cashPaid || 0);
    const remainingDue =
      s.remainingDue !== undefined
        ? Number(s.remainingDue)
        : Math.max(0, amount - cashPaid);
    const weightKg = Number(s.weightKg || 0);
    const rate = Number(s.rate || 0);

    return {
      id: `sale_${s.period}_${s.rowNumber || idx + 1}`,
      customerId,
      customerName,
      rawNameInSheet: s.rawNameInSheet || s.canonicalName,
      type: 'SALE',
      category: 'Sales',
      item: 'Others',
      weightKg,
      rate,
      amount,
      cashPaid,
      remainingDue,
      period: s.period,
      month: s.month,
      date: s.date,
      sourceFile: s.sourceFile,
      rowNumber: s.rowNumber,
      notes: `Sale recorded from ${s.sourceFile} (Row ${s.rowNumber || idx + 1})`,
    };
  });

  // Sort chronologically by date
  flatSales.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const output = {
    totalSalesCount: flatSales.length,
    totalWeightKg: flatSales.reduce((sum, s) => sum + s.weightKg, 0),
    totalRevenue: flatSales.reduce((sum, s) => sum + s.amount, 0),
    totalCashPaid: flatSales.reduce((sum, s) => sum + s.cashPaid, 0),
    totalCreditRemainingDue: flatSales.reduce(
      (sum, s) => sum + s.remainingDue,
      0,
    ),
    generatedAt: new Date().toISOString(),
    sales: flatSales,
  };

  // Save both files
  writeFileSync(FLAT_SALES_FILE, JSON.stringify(output, null, 2));
  writeFileSync(SALES_AUDIT_FILE, JSON.stringify(output, null, 2));

  console.log(
    `✅ Successfully generated ${flatSales.length} individual sales records sorted by date:`,
  );
  console.log(`   📁 ${FLAT_SALES_FILE}`);
  console.log(`   📁 ${SALES_AUDIT_FILE}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total Records: ${output.totalSalesCount}`);
  console.log(
    `   Total Weight: ${output.totalWeightKg.toLocaleString('en-IN')} kg`,
  );
  console.log(
    `   Total Revenue: ₹${output.totalRevenue.toLocaleString('en-IN')}`,
  );
  console.log(
    `   Immediate Cash: ₹${output.totalCashPaid.toLocaleString('en-IN')}`,
  );
  console.log(
    `   Credit Due: ₹${output.totalCreditRemainingDue.toLocaleString('en-IN')}`,
  );
}

generateFlatSalesJson();
