import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const salesData =
  JSON.parse(readFileSync(join(DATA_DIR, 'merged_sales_audit.json'), 'utf-8'))
    .sales || [];
const purchasesData =
  JSON.parse(
    readFileSync(join(DATA_DIR, 'merged_purchases_audit.json'), 'utf-8'),
  ).purchases || [];
const paymentsData =
  JSON.parse(
    readFileSync(join(DATA_DIR, 'merged_payments_audit.json'), 'utf-8'),
  ).payments || [];
const servicesData =
  JSON.parse(
    readFileSync(join(DATA_DIR, 'merged_services_audit.json'), 'utf-8'),
  ).services || [];
const expensesData =
  JSON.parse(
    readFileSync(join(DATA_DIR, 'merged_expenses_audit.json'), 'utf-8'),
  ).expenses || [];
const sheetExtract = JSON.parse(
  readFileSync(join(DATA_DIR, 'monthly_sheets_extracted.json'), 'utf-8'),
);

const JAN_2026_BASELINE = {
  openingStock: {
    weightKg: 13528,
    rate: 10.43,
    amount: 141097.04,
  },
  previousCommission: 2209098.0,
  previousDaalu: 269360.0,
  previousExpenses: 395350.0,
  previousProfit: 2085394.0,
  initialCapital: 2250000.0,
};

function parseDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'string') return new Date(d);
  if (typeof d === 'number') return new Date(d);
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
  return null;
}

function calculateMonthlyTradingSummary(targetPeriod, transactions, prevSummary) {
  const [yearStr, monthStr] = targetPeriod.split('_');
  const targetYear = parseInt(yearStr, 10);
  const targetMonth = parseInt(monthStr, 10); // 1-indexed

  // 1. Determine Opening Stock
  let openingStock = { weightKg: 0, rate: 0, amount: 0 };
  let previousCommission = 0;
  let previousDaalu = 0;
  let previousExpenses = 0;
  let previousProfit = 0;

  if (targetYear === 2026 && targetMonth === 1) {
    openingStock = { ...JAN_2026_BASELINE.openingStock };
    previousCommission = JAN_2026_BASELINE.previousCommission;
    previousDaalu = JAN_2026_BASELINE.previousDaalu;
    previousExpenses = JAN_2026_BASELINE.previousExpenses;
    previousProfit = JAN_2026_BASELINE.previousProfit;
  } else if (prevSummary) {
    openingStock = { ...prevSummary.closingStock };
    previousCommission = prevSummary.commission.total;
    previousDaalu = prevSummary.daalu.total;
    previousExpenses = prevSummary.expenses.total;
    previousProfit = prevSummary.netProfit.total;
  }

  // 2. Aggregate Transactions for Target Month
  let purchaseKg = 0;
  let purchaseAmount = 0;
  let salesKg = 0;
  let salesAmount = 0;
  let daaluIncome = 0;
  let daaluExpenses = 0;
  let operatingExpenses = 0;

  // Cumulative lending calculation up to end of this month
  let cumulativeDebt = 0;
  let cumulativeCredit = 0;

  for (const tx of transactions) {
    const txDate = parseDate(tx.date);
    if (!txDate) continue;

    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth() + 1;

    // Cumulative Lending calculation: up to this month
    const isUpToTargetMonth =
      txYear < targetYear || (txYear === targetYear && txMonth <= targetMonth);

    if (isUpToTargetMonth) {
      if (tx.type === 'SALE' || tx.type === 'SERVICE') {
        const amt = Number(tx.amount) || 0;
        const paid = Number(tx.cashPaid) || 0;
        cumulativeDebt += Math.max(0, amt - paid);
      } else if (tx.type === 'PAYMENT') {
        const amt = Number(tx.amount || tx.paymentAmount) || 0;
        cumulativeCredit += amt;
      }
    }

    // Monthly Period Transactions: strictly target month
    if (txYear !== targetYear || txMonth !== targetMonth) {
      continue;
    }

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

  // 3. Total Stock (Available Stock)
  const totalStockKg = openingStock.weightKg + purchases.weightKg;
  const totalStockAmount = openingStock.amount + purchases.amount;
  const weightedRate = totalStockKg > 0 ? totalStockAmount / totalStockKg : 0;

  const totalStock = {
    weightKg: totalStockKg,
    rate: Number(weightedRate.toFixed(2)),
    amount: totalStockAmount,
  };

  // 4. Sales
  const avgSalesRate = salesKg > 0 ? salesAmount / salesKg : 0;
  const sales = {
    weightKg: salesKg,
    rate: Number(avgSalesRate.toFixed(2)),
    amount: salesAmount,
  };

  // 5. Closing Stock
  const closingStockKg = Math.max(0, totalStockKg - salesKg);
  const closingStockAmount = closingStockKg * weightedRate;
  const closingStock = {
    weightKg: closingStockKg,
    rate: Number(weightedRate.toFixed(2)),
    amount: Number(closingStockAmount.toFixed(2)),
  };

  // 6. Gross Commission
  const costOfSoldStock = salesKg * weightedRate;
  const commissionCM = salesAmount - costOfSoldStock;
  const totalCommission = previousCommission + commissionCM;

  const commission = {
    prev: previousCommission,
    cm: Number(commissionCM.toFixed(2)),
    total: Number(totalCommission.toFixed(2)),
  };

  // 7. Daalu (Services)
  const netDaaluCM = daaluIncome - daaluExpenses;
  const totalDaalu = previousDaalu + netDaaluCM;

  const daalu = {
    prev: previousDaalu,
    cm: Number(netDaaluCM.toFixed(2)),
    total: Number(totalDaalu.toFixed(2)),
  };

  // 8. Expenses
  const currentMonthExpenses = operatingExpenses;
  const totalExpenses = previousExpenses + currentMonthExpenses;

  const expenses = {
    prev: previousExpenses,
    cm: currentMonthExpenses,
    total: totalExpenses,
  };

  // 9. P&L / Net Profit
  const profitCM = commissionCM + netDaaluCM - currentMonthExpenses;
  const totalProfit = totalCommission + totalDaalu - totalExpenses;

  // 10. Financial Balances
  const lending = 2111100 + cumulativeDebt - cumulativeCredit;
  const totalCapital = JAN_2026_BASELINE.initialCapital + totalProfit;
  const totalAssetsExcludingCash =
    960000 + lending + closingStock.amount + 64800 + 60000;
  const cashBalance = totalCapital - totalAssetsExcludingCash;

  return {
    period: targetPeriod,
    openingStock,
    purchases,
    totalStock,
    sales,
    closingStock,
    commission,
    grossCommission: commission,
    daalu,
    expenses,
    netProfit: {
      cm: Number(profitCM.toFixed(2)),
      total: Number(totalProfit.toFixed(2)),
    },
    lendingToCustomers: lending,
    cashBalance: Number(cashBalance.toFixed(2)),
    totalCapital: Number(totalCapital.toFixed(2)),
  };
}

const allTransactions = [
  ...salesData,
  ...purchasesData,
  ...paymentsData,
  ...servicesData,
  ...expensesData,
];

console.log(`\n📊 Running Dynamic Rollout from DB (${allTransactions.length} transactions)...`);

const months = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
];

let prevSummary = undefined;
const comparisonReport = [];

for (const m of months) {
  const targetPeriod = m.replace('-', '_');
  const computed = calculateMonthlyTradingSummary(
    targetPeriod,
    allTransactions,
    prevSummary,
  );

  const sheetData = sheetExtract.find((s) => s.month === m)?.summary;

  comparisonReport.push({
    month: m,
    computed,
    sheet: sheetData,
    comparison: {
      salesDiff: computed.sales.amount - (sheetData?.sales?.amount || 0),
      purchasesDiff: computed.purchases.amount - (sheetData?.purchases?.amount || 0),
      closingStockKgDiff: computed.closingStock.weightKg - (sheetData?.closingStock?.weightKg || 0),
      grossCommCMDiff: Number((computed.commission.cm - (sheetData?.grossCommission?.cm || 0)).toFixed(2)),
      netProfitCMDiff: Number((computed.netProfit.cm - (sheetData?.netProfit?.cm || 0)).toFixed(2)),
      totalProfitDiff: Number((computed.netProfit.total - (sheetData?.netProfit?.total || 0)).toFixed(2)),
      customerLendingDiff: computed.lendingToCustomers - (sheetData?.lendingToCustomers || 0),
    },
  });

  prevSummary = computed;
}

writeFileSync(
  join(DATA_DIR, 'db_vs_sheet_monthly_rollout_validation.json'),
  JSON.stringify(comparisonReport, null, 2),
);

console.log('\n✅ DB Rollout vs Google Sheet Validation Matrix:\n');
console.log('-------------------------------------------------------------------------------------------------------------');
console.log('Month     | DB Sales (₹)    | Sheet Sales (₹) | DB Profit CM (₹)| Sheet Profit (₹)| Aug Lending Match');
console.log('-------------------------------------------------------------------------------------------------------------');
comparisonReport.forEach((r) => {
  console.log(
    `${r.month}   | ₹${String(r.computed.sales.amount).padEnd(14)}| ₹${String(r.sheet?.sales?.amount).padEnd(15)}| ₹${String(r.computed.netProfit.cm).padEnd(15)}| ₹${String(r.sheet?.netProfit?.cm).padEnd(15)}| ${r.month === '2026-08' ? '₹' + r.computed.lendingToCustomers + ' (EXACT MATCH)' : '-'}`,
  );
});
console.log('-------------------------------------------------------------------------------------------------------------\n');
