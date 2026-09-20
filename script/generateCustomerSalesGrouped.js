import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const SALES_AUDIT_FILE = join(DATA_DIR, 'merged_sales_audit.json');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const OUTPUT_FILE = join(DATA_DIR, 'customer_sales_grouped.json');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateCustomerSalesGrouped() {
  console.log('📦 Grouping 2026 sales by customer into local JSON...\n');

  if (!existsSync(SALES_AUDIT_FILE)) {
    console.error('Error: merged_sales_audit.json missing.');
    return;
  }

  const salesJson = JSON.parse(readFileSync(SALES_AUDIT_FILE, 'utf-8'));
  const salesList = salesJson.sales || [];
  const registry = existsSync(REGISTRY_FILE)
    ? JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
    : [];

  // Index customer registry
  const customerMap = new Map();
  registry.forEach((c, idx) => {
    const docId = String(idx + 1);
    const norm = normalize(c.canonicalName);
    customerMap.set(norm, {
      customerId: docId,
      customerName: c.canonicalName,
      mobile: c.mobile || null,
      village: c.village || null,
      creditLimit: c.creditLimit || 35000,
      openingDebt: c.baselineOutstanding20251231 || c.openingDebt || 0,
      totalSalesCount: 0,
      totalWeightKg: 0,
      totalSalesRevenue: 0,
      totalCashPaid: 0,
      totalCreditRemainingDue: 0,
      monthlyBreakdown: {},
      sales: [],
    });

    if (c.aliases) {
      c.aliases.forEach((a) => {
        if (!customerMap.has(normalize(a))) {
          customerMap.set(normalize(a), customerMap.get(norm));
        }
      });
    }
  });

  // Group sales into customerMap
  for (const s of salesList) {
    const norm = normalize(
      s.canonicalName || s.customerName || s.rawNameInSheet,
    );
    let cust = customerMap.get(norm);

    if (!cust) {
      cust = {
        customerId: s.docId || `cust-${norm}`,
        customerName: s.canonicalName || s.rawNameInSheet,
        mobile: null,
        village: null,
        creditLimit: 35000,
        openingDebt: 0,
        totalSalesCount: 0,
        totalWeightKg: 0,
        totalSalesRevenue: 0,
        totalCashPaid: 0,
        totalCreditRemainingDue: 0,
        monthlyBreakdown: {},
        sales: [],
      };
      customerMap.set(norm, cust);
    }

    const saleAmount = s.amount || 0;
    const cash = s.cashPaid || 0;
    const remaining =
      s.remainingDue !== undefined
        ? s.remainingDue
        : Math.max(0, saleAmount - cash);
    const weight = s.weightKg || 0;

    cust.totalSalesCount += 1;
    cust.totalWeightKg += weight;
    cust.totalSalesRevenue += saleAmount;
    cust.totalCashPaid += cash;
    cust.totalCreditRemainingDue += remaining;

    // Monthly breakdown
    const mLabel = s.month || s.period;
    if (!cust.monthlyBreakdown[mLabel]) {
      cust.monthlyBreakdown[mLabel] = {
        salesCount: 0,
        weightKg: 0,
        revenue: 0,
        cashPaid: 0,
        creditDue: 0,
      };
    }
    cust.monthlyBreakdown[mLabel].salesCount += 1;
    cust.monthlyBreakdown[mLabel].weightKg += weight;
    cust.monthlyBreakdown[mLabel].revenue += saleAmount;
    cust.monthlyBreakdown[mLabel].cashPaid += cash;
    cust.monthlyBreakdown[mLabel].creditDue += remaining;

    cust.sales.push({
      period: s.period,
      month: s.month,
      date: s.date,
      item: s.item || 'Others',
      weightKg: weight,
      rate: s.rate || 0,
      amount: saleAmount,
      cashPaid: cash,
      remainingDue: remaining,
      sourceFile: s.sourceFile,
      rowNumber: s.rowNumber,
      rawCustomerNameInSheet: s.rawNameInSheet,
    });
  }

  // Deduplicate unique customer objects
  const uniqueCustomersWithSales = Array.from(new Set(customerMap.values()))
    .filter((c) => c.totalSalesCount > 0)
    .sort((a, b) => b.totalSalesRevenue - a.totalSalesRevenue);

  const finalOutput = {
    totalActiveCustomersWithSales: uniqueCustomersWithSales.length,
    totalSalesCount: salesList.length,
    totalWeightKg: salesJson.totalWeightKg,
    totalRevenue: salesJson.totalRevenue,
    totalCashPaid: salesJson.totalCashPaid,
    totalCreditRemainingDue: salesJson.totalCreditDebt,
    generatedAt: new Date().toISOString(),
    customers: uniqueCustomersWithSales,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2));
  console.log(
    `✅ Saved ${uniqueCustomersWithSales.length} customers with sales (Total Revenue: ₹${finalOutput.totalRevenue.toLocaleString('en-IN')}) to:`,
  );
  console.log(`   📁 ${OUTPUT_FILE}`);
}

generateCustomerSalesGrouped();
