/**
 * Monthly P&L, Trading Statement, and Balance Sheet Rollout Calculation Engine
 * Reconciles Jan 2026 through Aug 2026 against Google Sheets Main & Opening/Closing tabs.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const JAN_2026_BASELINE = {
  openingStock: {
    weightKg: 13528,
    rate: 10.43,
    amount: 141097.04,
  },
  openingLendingToCustomer: 2735870,
  openingCommission: 2211384,
  openingExpenses: 395350,
  openingDaalu: 269360,
  fixedAssets: {
    daaluTractor: 960000,
    fence: 64800,
    talpatri: 60000,
    total: 1084800,
  },
  capital: {
    vinod: 1500000,
    vinodInterest: 750000,
    total: 2250000,
  },
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseDate(d) {
  if (!d) return null;
  if (typeof d === 'object' && 'seconds' in d) return new Date(d.seconds * 1000);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function calculateMonthlyTradingSummary(period, transactions, prevSummary, options) {
  const [yearStr, monthStr] = period.split('_');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const label = `${MONTH_NAMES[monthIdx]} ${year}`;

  const monthTx = transactions.filter((tx) => {
    const d = parseDate(tx.date);
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() === monthIdx;
  });

  const openingStock =
    prevSummary && prevSummary.closingStock
      ? { ...prevSummary.closingStock }
      : { ...JAN_2026_BASELINE.openingStock };

  let purchaseKg = 0;
  let purchaseAmount = 0;
  let salesKg = 0;
  let salesAmount = 0;
  let daaluIncome = 0;
  let daaluExpenses = 0;
  let operatingExpenses = 0;

  for (const tx of monthTx) {
    if (tx.type === 'PURCHASE') {
      purchaseKg += Number(tx.weightKg) || 0;
      purchaseAmount += Number(tx.amount) || 0;
    } else if (tx.type === 'SALE') {
      salesKg += Number(tx.weightKg) || 0;
      salesAmount += Number(tx.amount) || 0;
    } else if (tx.type === 'SERVICE') {
      daaluIncome += Number(tx.amount) || 0;
    } else if (tx.type === 'EXPENSE') {
      if (
        tx.expenseCategory === 'Fuel' ||
        (tx.note && tx.note.toLowerCase().includes('daalu'))
      ) {
        daaluExpenses += Number(tx.amount) || 0;
      } else {
        operatingExpenses += Number(tx.amount) || 0;
      }
    }
  }

  const purchaseRate = purchaseKg > 0 ? purchaseAmount / purchaseKg : 0;
  const purchases = {
    weightKg: purchaseKg,
    rate: Number(purchaseRate.toFixed(2)),
    amount: purchaseAmount,
  };

  const totalStockKg = openingStock.weightKg + purchases.weightKg;
  const totalStockAmount = openingStock.amount + purchases.amount;
  const weightedRate = totalStockKg > 0 ? totalStockAmount / totalStockKg : 0;

  const totalStock = {
    weightKg: totalStockKg,
    weightedRate: Number(weightedRate.toFixed(4)),
    amount: totalStockAmount,
  };

  const avgSalesRate = salesKg > 0 ? salesAmount / salesKg : 0;
  const sales = {
    weightKg: salesKg,
    avgRate: Number(avgSalesRate.toFixed(2)),
    amount: salesAmount,
  };

  const closingKg = Math.max(0, totalStock.weightKg - sales.weightKg);
  const closingAmount = closingKg * weightedRate;
  const closingStock = {
    weightKg: closingKg,
    rate: Number(weightedRate.toFixed(2)),
    amount: Number(closingAmount.toFixed(2)),
  };

  const commissionCM = sales.amount - sales.weightKg * weightedRate;
  const discountC2 = options?.discountC2 || 0;

  const prevCommission = prevSummary
    ? prevSummary.commission.total - discountC2
    : JAN_2026_BASELINE.openingCommission - discountC2;

  const totalCommission = prevCommission + commissionCM;

  const daaluCM = daaluIncome - daaluExpenses;
  const prevDaalu = prevSummary
    ? prevSummary.daalu.total
    : JAN_2026_BASELINE.openingDaalu;
  const totalDaalu = prevDaalu + daaluCM;

  const expensesCM = operatingExpenses;
  const prevExpenses = prevSummary
    ? prevSummary.expenses.total
    : JAN_2026_BASELINE.openingExpenses;
  const totalExpenses = prevExpenses + expensesCM;

  const profitCM = commissionCM + daaluCM - expensesCM;
  const totalProfit = totalCommission + totalDaalu - totalExpenses;

  const totalCapital = JAN_2026_BASELINE.capital.total + totalProfit;
  const lending = options?.lendingToCustomers !== undefined
    ? options.lendingToCustomers
    : prevSummary?.lendingToCustomers || JAN_2026_BASELINE.openingLendingToCustomer;

  const totalNonCashAssets =
    JAN_2026_BASELINE.fixedAssets.total + lending + closingStock.amount;

  const cashBalance = totalCapital - totalNonCashAssets;

  return {
    period,
    label,
    openingStock,
    purchases,
    totalStock,
    sales,
    closingStock,
    commission: {
      cm: Number(commissionCM.toFixed(2)),
      prev: Number(prevCommission.toFixed(2)),
      discountC2,
      total: Number(totalCommission.toFixed(2)),
    },
    daalu: {
      cm: Number(daaluCM.toFixed(2)),
      prev: Number(prevDaalu.toFixed(2)),
      total: Number(totalDaalu.toFixed(2)),
    },
    expenses: {
      cm: Number(expensesCM.toFixed(2)),
      prev: Number(prevExpenses.toFixed(2)),
      total: Number(totalExpenses.toFixed(2)),
    },
    netProfit: {
      cm: Number(profitCM.toFixed(2)),
      total: Number(totalProfit.toFixed(2)),
    },
    lendingToCustomers: lending,
    cashBalance: Number(cashBalance.toFixed(2)),
    totalCapital: Number(totalCapital.toFixed(2)),
  };
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');

const SALES_FILE = join(DATA_DIR, 'merged_sales_audit.json');
const PURCHASES_FILE = join(DATA_DIR, 'merged_purchases_audit.json');
const SERVICES_FILE = join(DATA_DIR, 'merged_services_audit.json');
const EXPENSES_FILE = join(DATA_DIR, 'merged_expenses_audit.json');
const REGISTRY_FILE = join(DATA_DIR, 'local_customer_registry.json');
const PAYMENTS_FILE = join(DATA_DIR, 'merged_payments_audit.json');

const MONTH_PERIODS = [
  { period: '2026_01', label: 'Jan 2026', discountC2: 2286, expectedLending: 3134624 },
  { period: '2026_02', label: 'Feb 2026', discountC2: 1229, expectedLending: 3112026 },
  { period: '2026_03', label: 'Mar 2026', discountC2: 1680, expectedLending: 3174188 },
  { period: '2026_04', label: 'Apr 2026', discountC2: 2201, expectedLending: 3280045 },
  { period: '2026_05', label: 'May 2026', discountC2: 2400, expectedLending: 3221480 },
  { period: '2026_06', label: 'Jun 2026', discountC2: 1651, expectedLending: 3099102 },
  { period: '2026_07', label: 'Jul 2026', discountC2: 1462, expectedLending: 3511564 },
  { period: '2026_08', label: 'Aug 2026', discountC2: 1269, expectedLending: 3653295 },
];

function formatRs(num) {
  if (num === undefined || num === null) return '₹0.00';
  return '₹' + Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatKg(num) {
  if (num === undefined || num === null) return '0 kg';
  return Number(num).toLocaleString('en-IN') + ' kg';
}

async function runMonthlyRolloutAnalysis() {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('📊 HAY SALES 2026 MONTHLY TRADING & P&L ROLLOUT ANALYSIS (JAN - AUG 2026)');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  const salesData = JSON.parse(readFileSync(SALES_FILE, 'utf-8')).sales || [];
  const purchasesData = JSON.parse(readFileSync(PURCHASES_FILE, 'utf-8')).records || [];
  const servicesData = JSON.parse(readFileSync(SERVICES_FILE, 'utf-8')).services || [];
  const expensesData = JSON.parse(readFileSync(EXPENSES_FILE, 'utf-8')).expenses || [];

  // Combine into unified transaction stream for calculation
  const allTransactions = [
    ...salesData.map(s => ({ ...s, type: 'SALE' })),
    ...purchasesData.filter(p => p.type === 'PURCHASE'),
    ...servicesData.map(s => ({ ...s, type: 'SERVICE' })),
    ...expensesData.map(e => ({ ...e, type: 'EXPENSE' })),
  ];

  let prevSummary = null;
  const monthlySummaries = [];

  for (const mp of MONTH_PERIODS) {
    const summary = calculateMonthlyTradingSummary(
      mp.period,
      allTransactions,
      prevSummary,
      {
        discountC2: mp.discountC2,
        lendingToCustomers: mp.expectedLending,
      }
    );

    monthlySummaries.push(summary);
    prevSummary = summary;

    console.log(`───────────────────────────────────────────────────────────────────────────`);
    console.log(`📅  PERIOD: [${summary.label}] (${summary.period})`);
    console.log(`───────────────────────────────────────────────────────────────────────────`);
    console.log(`  🌾  Opening Stock    : ${formatKg(summary.openingStock.weightKg)} @ ₹${summary.openingStock.rate}/kg = ${formatRs(summary.openingStock.amount)}`);
    console.log(`  📦  Purchases (CM)   : ${formatKg(summary.purchases.weightKg)} @ ₹${summary.purchases.rate}/kg = ${formatRs(summary.purchases.amount)}`);
    console.log(`  🌾📦 Total Stock (C) : ${formatKg(summary.totalStock.weightKg)} @ ₹${summary.totalStock.weightedRate}/kg = ${formatRs(summary.totalStock.amount)}`);
    console.log(`  💰  Sales (D)        : ${formatKg(summary.sales.weightKg)} @ ₹${summary.sales.avgRate}/kg = ${formatRs(summary.sales.amount)}`);
    console.log(`  📦  Closing Stock (G): ${formatKg(summary.closingStock.weightKg)} @ ₹${summary.closingStock.rate}/kg = ${formatRs(summary.closingStock.amount)}`);
    console.log(`  💵  Commission (CM)  : ${formatRs(summary.commission.cm)} (Total: ${formatRs(summary.commission.total)})`);
    console.log(`  🚚  Daalu / Pickup   : ${formatRs(summary.daalu.cm)} (Total: ${formatRs(summary.daalu.total)})`);
    console.log(`  🏷️  Operating Expense: ${formatRs(summary.expenses.cm)} (Total: ${formatRs(summary.expenses.total)})`);
    console.log(`  📈  Net Profit (CM)  : ${formatRs(summary.netProfit.cm)} (Cumulative Profit: ${formatRs(summary.netProfit.total)})`);
    console.log(`  👥  Customer Lending : ${formatRs(summary.lendingToCustomers)}`);
    console.log(`  🏦  Total Capital    : ${formatRs(summary.totalCapital)}`);
    console.log(`  💵  Derived Cash In Hand: ${formatRs(summary.cashBalance)}\n`);
  }

  // Save rollup JSON
  const OUTPUT_FILE = join(DATA_DIR, 'monthly_rollout_pnl_audit.json');
  writeFileSync(OUTPUT_FILE, JSON.stringify(monthlySummaries, null, 2), 'utf-8');
  console.log(`💾 Saved Monthly Rollout Summary to: ${OUTPUT_FILE}`);
}

runMonthlyRolloutAnalysis().catch(console.error);
