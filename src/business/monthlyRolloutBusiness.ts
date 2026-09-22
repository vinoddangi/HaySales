import { CropItemType, MonthlyTradingSummary, Transaction } from '../types';
import { parseTransactionDate } from '../utils/formatters';

export const VALID_CROP_ITEMS: CropItemType[] = [
  'Tuvar',
  'Chana',
  'B. Kutty',
  'M. Kutty',
  'Isabgol',
  'Others',
];

export const JAN_2026_BASELINE = {
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

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Filter transactions that belong to a specific month and year
 */
export function getTransactionsForMonth(
  transactions: Transaction[],
  year: number,
  monthIndex: number,
): Transaction[] {
  return transactions.filter((tx) => {
    const d = parseTransactionDate(tx.date);
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
}

/**
 * Calculate Monthly Trading, Commission, Profit & Balance Sheet for a given month
 */
export function calculateMonthlyTradingSummary(
  period: string, // e.g. '2026_01'
  transactions: Transaction[],
  prevSummary?: MonthlyTradingSummary | null,
  options?: {
    discountC2?: number;
    lendingToCustomers?: number;
  },
): MonthlyTradingSummary {
  const [yearStr, monthStr] = period.split('_');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const label = `${MONTH_NAMES[monthIdx]} ${year}`;

  const monthTx = getTransactionsForMonth(transactions, year, monthIdx);

  // 1. Opening Stock
  const openingStock =
    prevSummary && prevSummary.closingStock
      ? { ...prevSummary.closingStock }
      : { ...JAN_2026_BASELINE.openingStock };

  // 2. Purchases in current month
  let purchaseKg = 0;
  let purchaseAmount = 0;

  // 3. Sales in current month
  let salesKg = 0;
  let salesAmount = 0;

  // 4. Services (Daalu) in current month
  let daaluIncome = 0;
  let daaluExpenses = 0;

  // 5. Operating Expenses in current month
  let operatingExpenses = 0;

  for (const tx of monthTx) {
    const rawType = (tx.type || tx.category || '').toString().toUpperCase();

    if (rawType.includes('PURCHASE')) {
      purchaseKg += Number(tx.weightKg) || 0;
      purchaseAmount += Number(tx.amount) || 0;
    } else if (rawType.includes('SALE')) {
      salesKg += Number(tx.weightKg) || 0;
      salesAmount += Number(tx.amount) || 0;
    } else if (rawType.includes('SERVICE')) {
      daaluIncome += Number(tx.amount) || 0;
    } else if (rawType.includes('EXPENSE')) {
      if (
        tx.expenseCategory === 'Fuel' ||
        (tx.note && tx.note.toLowerCase().includes('daalu'))
      ) {
        daaluExpenses += Number(tx.amount) || 0;
      } else {
        operatingExpenses += Number(tx.amount) || 0;
      }
    } else if (rawType.includes('PAYMENT')) {
      if (tx.discount && Number(tx.discount) > 0) {
        operatingExpenses += Number(tx.discount);
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
    weightedRate: Number(weightedRate.toFixed(4)),
    amount: totalStockAmount,
  };

  // 4. Sales
  const avgSalesRate = salesKg > 0 ? salesAmount / salesKg : 0;
  const sales = {
    weightKg: salesKg,
    avgRate: Number(avgSalesRate.toFixed(2)),
    amount: salesAmount,
  };

  // 5. Closing Stock
  const closingKg = Math.max(0, totalStock.weightKg - sales.weightKg);
  const closingAmount = closingKg * weightedRate;
  const closingStock = {
    weightKg: closingKg,
    rate: Number(weightedRate.toFixed(2)),
    amount: Number(closingAmount.toFixed(2)),
  };

  // 6. Commission & Profit
  const commissionCM = sales.amount - sales.weightKg * weightedRate;
  const discountC2 = options?.discountC2 || 0;

  const prevCommission = prevSummary
    ? prevSummary.commission.total - discountC2
    : JAN_2026_BASELINE.openingCommission - discountC2;

  const totalCommission = prevCommission + commissionCM;

  // Daalu (Services)
  const daaluCM = daaluIncome - daaluExpenses;
  const prevDaalu = prevSummary
    ? prevSummary.daalu.total
    : JAN_2026_BASELINE.openingDaalu;
  const totalDaalu = prevDaalu + daaluCM;

  // Expenses
  const expensesCM = operatingExpenses;
  const prevExpenses = prevSummary
    ? prevSummary.expenses.total
    : JAN_2026_BASELINE.openingExpenses;
  const totalExpenses = prevExpenses + expensesCM;

  // Net Profit
  const profitCM = commissionCM + daaluCM - expensesCM;
  const totalProfit = totalCommission + totalDaalu - totalExpenses;

  // Balance Sheet & Cash Flow
  const totalCapital = JAN_2026_BASELINE.capital.total + totalProfit;

  const lending =
    options?.lendingToCustomers !== undefined
      ? options.lendingToCustomers
      : prevSummary?.lendingToCustomers ||
        JAN_2026_BASELINE.openingLendingToCustomer;

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

/**
 * Check if previous month rollout is pending for the active calendar period
 */
export function hasPendingMonthlyRollout(
  currentDate = new Date(),
  lastRolledOutPeriod?: string | null, // e.g. '2026_07'
): { isPending: boolean; requiredPeriod?: string } {
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth(); // 0 to 11

  // If in Jan or no prior month in current year, nothing pending
  if (currentMonthIdx === 0) {
    return { isPending: false };
  }

  const targetPrevMonth = currentMonthIdx; // 1-indexed month number for previous month
  const targetPeriod = `${currentYear}_${String(targetPrevMonth).padStart(2, '0')}`;

  if (!lastRolledOutPeriod) {
    return { isPending: true, requiredPeriod: targetPeriod };
  }

  const [lastYearStr, lastMonthStr] = lastRolledOutPeriod.split('_');
  const lastYear = parseInt(lastYearStr, 10);
  const lastMonth = parseInt(lastMonthStr, 10);

  if (lastYear < currentYear || lastMonth < targetPrevMonth) {
    return { isPending: true, requiredPeriod: targetPeriod };
  }

  return { isPending: false };
}
