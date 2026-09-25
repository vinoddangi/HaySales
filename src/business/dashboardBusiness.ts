import {
  Customer,
  MonthlyRolloutStatus,
  MonthlyTradingSummary,
  Transaction,
} from '../types';
import { parseTransactionDate } from '../utils/formatters';
import {
  JAN_2026_BASELINE,
  calculateMonthlyTradingSummary,
} from './monthlyRolloutBusiness';

export interface CustomerOutstandingMetrics {
  totalOutstanding: number;
  periodCreditAdded: number;
  periodCollections: number;
  netOutstandingChange: number;
  customersWithDueCount: number;
  totalCustomersCount: number;
  historicalPeriodOutstanding?: number;
}

export interface ProfitMetricsData {
  netProfit: number;
  grossCommission: number;
  pickupNet: number;
  daaluNet?: number;
  operatingExpenses: number;
  profitMarginPct: number;
  cumulativeTotalProfit?: number;
  isPositive: boolean;
}

export interface BalanceSheetMetricsData {
  cashInHand: number;
  priorCashBalance: number;
  cashAdjustment: number;
  customerReceivables: number;
  closingStockValue: number;
  fixedAssetsValue: number;
  totalAssets: number;
  totalLiabilities: number;
  partnerCapital: number;
  retainedProfit: number;
  netWorth: number;
}

export interface DashboardMetricsResult {
  totalSalesAmount: number;
  totalSalesWeightKg: number;
  salesCount: number;
  totalPurchaseAmount: number;
  totalPurchaseWeightKg: number;
  purchasesCount: number;
  totalExpenseAmount: number;
  expensesCount: number;
  avgSalesRate: number;
  avgBuyRate: number;
  totalCashIn: number;
  totalCashOut: number;
  netCashflow: number;
  salesOnCredit: number;
  salesOnCash: number;
  servicesReceived: number;
  servicesCount: number;
  paymentsReceived: number;
  paymentsCount: number;
  purchaseOnCash: number;
  expensesOnCash: number;
}

export interface ItemBreakdownResult {
  category: string;
  amount: number;
  weightKg: number;
  count: number;
  stockKg?: number;
  avgBuyRate?: number;
}

/**
 * Filter transactions based on date criteria
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  mode: 'month' | 'ytd',
  selectedMonth: number,
  referenceDate: Date = new Date(),
): Transaction[] {
  const currentYear = referenceDate.getFullYear();

  return transactions.filter((tx: Transaction) => {
    const txDate = parseTransactionDate(tx.date);
    if (!txDate) return false;

    if (mode === 'ytd') {
      return txDate.getFullYear() === currentYear;
    }

    // mode === 'month'
    return (
      txDate.getFullYear() === currentYear &&
      txDate.getMonth() === selectedMonth
    );
  });
}

/**
 * Calculate aggregated summary metrics for the dashboard
 */
export function calculateDashboardMetrics(
  filteredTransactions: Transaction[],
): DashboardMetricsResult {
  let totalSalesAmount = 0;
  let totalSalesWeightKg = 0;
  let salesCount = 0;
  let salesOnCash = 0;
  let salesOnCredit = 0;

  let servicesReceived = 0;
  let servicesCount = 0;

  let totalPurchaseAmount = 0;
  let totalPurchaseWeightKg = 0;
  let purchasesCount = 0;
  let purchaseOnCash = 0;

  let totalExpenseAmount = 0;
  let expensesCount = 0;
  let expensesOnCash = 0;

  let paymentsReceived = 0;
  let paymentsCount = 0;

  filteredTransactions.forEach((tx) => {
    const rawType = (tx.type || tx.category || '').toString().toUpperCase();

    if (rawType.includes('SALE')) {
      const amt = Number(tx.amount) || 0;
      const wt = Number(tx.weightKg) || 0;
      const cash = Number(tx.cashPaid) || 0;
      const credit =
        tx.remainingDue !== undefined
          ? Number(tx.remainingDue) || 0
          : Math.max(0, amt - cash);

      totalSalesAmount += amt;
      totalSalesWeightKg += wt;
      salesCount += 1;
      salesOnCash += cash;
      salesOnCredit += credit;
    } else if (rawType.includes('SERVICE')) {
      const amt = Number(tx.amount) || 0;
      const cash = tx.cashPaid !== undefined ? Number(tx.cashPaid) || 0 : amt;
      servicesReceived += cash;
      servicesCount += 1;
    } else if (rawType.includes('PURCHASE')) {
      const amt = Number(tx.amount) || 0;
      const wt = Number(tx.weightKg) || 0;
      const cash = tx.cashPaid !== undefined ? Number(tx.cashPaid) || 0 : amt;
      totalPurchaseAmount += amt;
      totalPurchaseWeightKg += wt;
      purchasesCount += 1;
      purchaseOnCash += cash;
    } else if (rawType.includes('EXPENSE')) {
      const amt = Number(tx.amount) || 0;
      const cash = tx.cashPaid !== undefined ? Number(tx.cashPaid) || 0 : amt;
      totalExpenseAmount += amt;
      expensesCount += 1;
      expensesOnCash += cash;
    } else if (rawType.includes('PAYMENT')) {
      const pAmt = Number(tx.paymentAmount) || Number(tx.amount) || 0;
      paymentsReceived += pAmt;
      paymentsCount += 1;
    }
  });

  const avgSalesRate =
    totalSalesWeightKg > 0 ? totalSalesAmount / totalSalesWeightKg : 0;
  const avgBuyRate =
    totalPurchaseWeightKg > 0 ? totalPurchaseAmount / totalPurchaseWeightKg : 0;
  const totalCashIn = salesOnCash + servicesReceived + paymentsReceived;
  const totalCashOut = purchaseOnCash + expensesOnCash;
  const netCashflow = totalCashIn - totalCashOut;

  return {
    totalSalesAmount,
    totalSalesWeightKg,
    salesCount,
    totalPurchaseAmount,
    totalPurchaseWeightKg,
    purchasesCount,
    totalExpenseAmount,
    expensesCount,
    avgSalesRate,
    avgBuyRate,
    totalCashIn,
    totalCashOut,
    netCashflow,
    salesOnCredit,
    salesOnCash,
    servicesReceived,
    servicesCount,
    paymentsReceived,
    paymentsCount,
    purchaseOnCash,
    expensesOnCash,
  };
}

/**
 * Get opening stock for a specified month in a year
 */
export function getOpeningStockForMonth(
  allTransactions: Transaction[],
  year: number,
  monthIndex: number,
): { weightKg: number; rate: number; amount: number } {
  if (monthIndex === 0) {
    return { ...JAN_2026_BASELINE.openingStock };
  }

  let currentSummary = null;
  for (let m = 0; m < monthIndex; m++) {
    const period = `${year}_${String(m + 1).padStart(2, '0')}`;
    currentSummary = calculateMonthlyTradingSummary(
      period,
      allTransactions,
      currentSummary,
    );
  }

  return currentSummary?.closingStock
    ? { ...currentSummary.closingStock }
    : { ...JAN_2026_BASELINE.openingStock };
}

/**
 * Calculate per-item breakdown comparing sales with purchases and opening stock
 */
export function calculateItemBreakdowns(
  allTransactions: Transaction[],
  filteredTransactions: Transaction[],
  options?: {
    mode?: 'month' | 'ytd';
    selectedMonth?: number;
    year?: number;
    includeOpeningStock?: boolean;
  },
): ItemBreakdownResult[] {
  const itemMap = new Map<
    string,
    { amount: number; weightKg: number; count: number }
  >();

  // Only count product SALE transactions in the active period
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'SALE' && tx.category) {
      const amt = Number(tx.amount) || 0;
      const wt = Number(tx.weightKg) || 0;
      const cat = tx.category.trim();

      const existing = itemMap.get(cat) || {
        amount: 0,
        weightKg: 0,
        count: 0,
      };
      itemMap.set(cat, {
        amount: existing.amount + amt,
        weightKg: existing.weightKg + wt,
        count: existing.count + 1,
      });
    }
  });

  const purchaseStatsMap = new Map<
    string,
    { amount: number; weightKg: number }
  >();

  // Ingest purchases for the active period from filteredTransactions
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'PURCHASE' && tx.category) {
      const pCat = tx.category.trim();
      const existing = purchaseStatsMap.get(pCat) || {
        amount: 0,
        weightKg: 0,
      };
      purchaseStatsMap.set(pCat, {
        amount: existing.amount + (Number(tx.amount) || 0),
        weightKg: existing.weightKg + (Number(tx.weightKg) || 0),
      });
    }
  });

  // Calculate opening stock if requested or when month/year options are present
  if (
    options?.includeOpeningStock !== false &&
    options?.selectedMonth !== undefined
  ) {
    const year = options.year || 2026;
    const openingStock =
      options.mode === 'ytd'
        ? { ...JAN_2026_BASELINE.openingStock }
        : getOpeningStockForMonth(allTransactions, year, options.selectedMonth);

    if (openingStock && openingStock.weightKg > 0) {
      // Attribute baseline/prior closing opening stock to 'Others' or the primary item
      const defaultItemKey = itemMap.has('Others')
        ? 'Others'
        : itemMap.keys().next().value || 'Others';

      const existing = purchaseStatsMap.get(defaultItemKey) || {
        amount: 0,
        weightKg: 0,
      };
      purchaseStatsMap.set(defaultItemKey, {
        amount: existing.amount + openingStock.amount,
        weightKg: existing.weightKg + openingStock.weightKg,
      });
    }
  }

  return Array.from(itemMap.entries())
    .map(([category, stats]) => {
      const pStats = purchaseStatsMap.get(category);
      const pWeight = pStats?.weightKg || 0;
      const pAmt = pStats?.amount || 0;
      const stockKg = Math.max(0, pWeight - stats.weightKg);
      const avgBuyRate = pWeight > 0 ? pAmt / pWeight : 0;

      return {
        category,
        amount: stats.amount,
        weightKg: stats.weightKg,
        count: stats.count,
        stockKg: pWeight > 0 ? stockKg : undefined,
        avgBuyRate: avgBuyRate > 0 ? avgBuyRate : undefined,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate Customer Outstanding (Receivables) Metrics for the active period (Month / YTD)
 */
export function calculateCustomerOutstandingMetrics(
  customers: Customer[],
  filteredTransactions: Transaction[],
  options?: {
    mode?: 'month' | 'ytd';
    selectedMonth?: number;
    year?: number;
    rolloutStatus?: MonthlyRolloutStatus | null;
  },
): CustomerOutstandingMetrics {
  // Live running total outstanding across customer accounts
  const totalOutstanding = customers.reduce(
    (sum, c) => sum + (c.outstandingAmount || 0),
    0,
  );
  const customersWithDueCount = customers.filter(
    (c) => (c.outstandingAmount || 0) > 0,
  ).length;
  const totalCustomersCount = customers.length;

  let periodCreditAdded = 0;
  let periodCollections = 0;

  filteredTransactions.forEach((tx) => {
    const rawType = (tx.type || tx.category || '').toString().toUpperCase();

    if (rawType.includes('SALE') || rawType.includes('SERVICE')) {
      const amt = Number(tx.amount) || 0;
      const cash = Number(tx.cashPaid) || 0;
      const credit =
        tx.remainingDue !== undefined
          ? Number(tx.remainingDue) || 0
          : Math.max(0, amt - cash);
      periodCreditAdded += credit;
    } else if (rawType.includes('PAYMENT')) {
      const pAmt = Number(tx.paymentAmount) || Number(tx.amount) || 0;
      const disc = Number(tx.discount) || 0;
      periodCollections += pAmt + disc;
    }
  });

  const netOutstandingChange = periodCreditAdded - periodCollections;

  // Check for historical rolled-out snapshot if in month mode
  let historicalPeriodOutstanding: number | undefined;
  if (
    options?.mode === 'month' &&
    options?.selectedMonth !== undefined &&
    options.rolloutStatus?.history
  ) {
    const year = options.year || 2026;
    const monthStr = String(options.selectedMonth + 1).padStart(2, '0');
    const targetMonthKey = `${year}-${monthStr}`;

    const historyEntry = options.rolloutStatus.history.find(
      (h) => h.month === targetMonthKey,
    );
    if (historyEntry?.summary?.lendingToCustomers !== undefined) {
      historicalPeriodOutstanding = historyEntry.summary.lendingToCustomers;
    }
  }

  return {
    totalOutstanding,
    periodCreditAdded,
    periodCollections,
    netOutstandingChange,
    customersWithDueCount,
    totalCustomersCount,
    historicalPeriodOutstanding,
  };
}

/**
 * Calculate Profit Metrics for the active period (Month / YTD)
 */
export function calculateProfitMetrics(
  allTransactions: Transaction[],
  options?: {
    mode?: 'month' | 'ytd';
    selectedMonth?: number;
    year?: number;
    totalSalesAmount?: number;
    rolloutStatus?: MonthlyRolloutStatus | null;
  },
): ProfitMetricsData {
  const mode = options?.mode || 'month';
  const year = options?.year || 2026;
  const selectedMonth = options?.selectedMonth ?? new Date().getMonth();
  const totalSales = options?.totalSalesAmount || 0;

  if (mode === 'month') {
    let currentSummary: MonthlyTradingSummary | null = null;
    for (let m = 0; m <= selectedMonth; m++) {
      const period = `${year}_${String(m + 1).padStart(2, '0')}`;
      currentSummary = calculateMonthlyTradingSummary(
        period,
        allTransactions,
        currentSummary,
      );
    }

    const netProfit = currentSummary?.netProfit.cm || 0;
    const grossCommission = currentSummary?.commission.cm || 0;
    const pickupNet = currentSummary?.pickup.cm || 0;
    const operatingExpenses = currentSummary?.expenses.cm || 0;
    const cumulativeTotalProfit = currentSummary?.netProfit.total || 0;
    const profitMarginPct = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return {
      netProfit,
      grossCommission,
      pickupNet,
      daaluNet: pickupNet,
      operatingExpenses,
      profitMarginPct,
      cumulativeTotalProfit,
      isPositive: netProfit >= 0,
    };
  } else {
    // mode === 'ytd'
    let ytdGrossCommission = 0;
    let ytdPickupNet = 0;
    let ytdExpenses = 0;
    let ytdNetProfit = 0;
    let latestSummary: MonthlyTradingSummary | null = null;

    const maxMonth = 11;
    for (let m = 0; m <= maxMonth; m++) {
      const period = `${year}_${String(m + 1).padStart(2, '0')}`;
      latestSummary = calculateMonthlyTradingSummary(
        period,
        allTransactions,
        latestSummary,
      );
      if (latestSummary) {
        const hasActivity =
          latestSummary.sales.weightKg > 0 ||
          latestSummary.purchases.weightKg > 0 ||
          latestSummary.pickup.cm !== 0 ||
          latestSummary.expenses.cm !== 0;

        if (hasActivity) {
          ytdGrossCommission += latestSummary.commission.cm;
          ytdPickupNet += latestSummary.pickup.cm;
          ytdExpenses += latestSummary.expenses.cm;
          ytdNetProfit += latestSummary.netProfit.cm;
        }
      }
    }

    const profitMarginPct =
      totalSales > 0 ? (ytdNetProfit / totalSales) * 100 : 0;

    return {
      netProfit: ytdNetProfit,
      grossCommission: ytdGrossCommission,
      pickupNet: ytdPickupNet,
      daaluNet: ytdPickupNet,
      operatingExpenses: ytdExpenses,
      profitMarginPct,
      cumulativeTotalProfit: latestSummary?.netProfit.total,
      isPositive: ytdNetProfit >= 0,
    };
  }
}

/**
 * Calculate Balance Sheet & Cash in Hand Position with previous period adjustment
 */
export function calculateBalanceSheetMetrics(
  allTransactions: Transaction[],
  options?: {
    mode?: 'month' | 'ytd';
    selectedMonth?: number;
    year?: number;
    customers?: Customer[];
    rolloutStatus?: MonthlyRolloutStatus | null;
  },
): BalanceSheetMetricsData {
  const mode = options?.mode || 'month';
  const year = options?.year || 2026;
  const selectedMonth = options?.selectedMonth ?? new Date().getMonth();

  // Compute monthly trading summary sequentially up to selectedMonth (or across the year for YTD)
  let latestSummary: MonthlyTradingSummary | null = null;
  let priorSummary: MonthlyTradingSummary | null = null;

  const targetMaxMonth = mode === 'month' ? selectedMonth : 11;

  // Resolve customer receivables (lending to customers)
  let resolvedCustomerReceivables: number | undefined;
  if (
    mode === 'month' &&
    options?.selectedMonth !== undefined &&
    options?.rolloutStatus?.history
  ) {
    const monthStr = String(options.selectedMonth + 1).padStart(2, '0');
    const targetMonthKey = `${year}-${monthStr}`;
    const historyEntry = options.rolloutStatus.history.find(
      (h) => h.month === targetMonthKey,
    );
    if (historyEntry?.summary?.lendingToCustomers !== undefined) {
      resolvedCustomerReceivables = historyEntry.summary.lendingToCustomers;
    }
  }

  if (resolvedCustomerReceivables === undefined && options?.customers) {
    resolvedCustomerReceivables = options.customers.reduce(
      (sum, c) => sum + (Number(c.outstandingAmount) || 0),
      0,
    );
  }

  for (let m = 0; m <= targetMaxMonth; m++) {
    const period = `${year}_${String(m + 1).padStart(2, '0')}`;
    const nextSummary = calculateMonthlyTradingSummary(
      period,
      allTransactions,
      latestSummary,
      resolvedCustomerReceivables !== undefined
        ? { lendingToCustomers: resolvedCustomerReceivables }
        : undefined,
    );

    if (mode === 'month') {
      if (m === selectedMonth) {
        priorSummary = latestSummary;
      }
      latestSummary = nextSummary;
    } else {
      // YTD: Prior is opening or Dec of previous year / Jan opening
      if (m === 0) {
        priorSummary = null;
      }
      latestSummary = nextSummary;
    }
  }

  // Prior cash balance
  let priorCashBalance = 0;
  if (mode === 'month') {
    if (priorSummary?.cashBalance !== undefined) {
      priorCashBalance = priorSummary.cashBalance;
    } else {
      // Check historical rollout status if available
      const prevMonthIdx = selectedMonth - 1;
      if (prevMonthIdx >= 0 && options?.rolloutStatus?.history) {
        const prevMonthKey = `${year}-${String(prevMonthIdx + 1).padStart(2, '0')}`;
        const historyEntry = options.rolloutStatus.history.find(
          (h) => h.month === prevMonthKey,
        );
        if (historyEntry?.summary?.cashBalance !== undefined) {
          priorCashBalance = historyEntry.summary.cashBalance;
        }
      }
    }
  } else {
    // YTD baseline opening or Jan start
    priorCashBalance = 0;
  }

  // Check if historical rollout status has a finalized summary for the target period
  if (options?.rolloutStatus?.history) {
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const targetMonthKey = mode === 'month' ? `${year}-${monthStr}` : undefined;

    // Find target history entry (specific month for 'month' mode, or latest for 'ytd' mode)
    let historyEntry: any;
    if (mode === 'month') {
      historyEntry = options.rolloutStatus.history.find(
        (h) => h.month === targetMonthKey,
      );
    } else {
      const ytdHistory = options.rolloutStatus.history
        .filter((h) => h.month.startsWith(`${year}-`) && h.summary)
        .sort((a, b) => a.month.localeCompare(b.month));
      if (ytdHistory.length > 0) {
        historyEntry = ytdHistory[ytdHistory.length - 1];
      }
    }

    if (historyEntry?.summary) {
      const summary = historyEntry.summary;
      const partnerCapital = JAN_2026_BASELINE.capital.total; // ₹2,250,000.00
      const retainedProfit =
        summary.netProfit?.total ??
        JAN_2026_BASELINE.openingProfit + (summary.netProfit?.cm ?? 0);
      const totalLiabilities = 0;
      const totalLiabilitiesAndCapital =
        partnerCapital + retainedProfit + totalLiabilities;

      const customerReceivables =
        summary.lendingToCustomers ?? resolvedCustomerReceivables ?? 0;
      const closingStockValue = summary.closingStock?.amount ?? 0;
      const fixedAssetsValue = JAN_2026_BASELINE.fixedAssets.total; // ₹1,084,800.00
      const nonCashAssets =
        customerReceivables + closingStockValue + fixedAssetsValue;

      // Cash in Hand calculated as difference between Total Liabilities/Capital and Non-Cash Assets
      const cashInHand =
        summary.cashBalance !== undefined
          ? summary.cashBalance
          : totalLiabilitiesAndCapital - nonCashAssets;

      // Prior cash balance
      let priorCash = 0;
      if (mode === 'month') {
        const prevMonthIdx = selectedMonth - 1;
        if (prevMonthIdx >= 0) {
          const prevKey = `${year}-${String(prevMonthIdx + 1).padStart(2, '0')}`;
          const prevEntry = options.rolloutStatus.history.find(
            (h) => h.month === prevKey,
          );
          priorCash = prevEntry?.summary?.cashBalance ?? 0;
        } else {
          priorCash = JAN_2026_BASELINE.openingCashBalance;
        }
      } else {
        priorCash = JAN_2026_BASELINE.openingCashBalance;
      }

      const cashAdjustment =
        summary.cashAdj !== undefined
          ? summary.cashAdj
          : cashInHand - priorCash;
      const totalAssets = nonCashAssets + cashInHand;
      const netWorth = partnerCapital + retainedProfit;

      return {
        cashInHand: Number(cashInHand.toFixed(2)),
        priorCashBalance: Number(priorCash.toFixed(2)),
        cashAdjustment: Number(cashAdjustment.toFixed(2)),
        customerReceivables: Number(customerReceivables.toFixed(2)),
        closingStockValue: Number(closingStockValue.toFixed(2)),
        fixedAssetsValue: Number(fixedAssetsValue.toFixed(2)),
        totalAssets: Number(totalAssets.toFixed(2)),
        totalLiabilities: Number(totalLiabilities.toFixed(2)),
        partnerCapital: Number(partnerCapital.toFixed(2)),
        retainedProfit: Number(retainedProfit.toFixed(2)),
        netWorth: Number(netWorth.toFixed(2)),
      };
    }
  }

  const bs = latestSummary?.balanceSheet;
  const partnerCapital =
    bs?.liabilitiesAndEquity?.partnerCapital ?? JAN_2026_BASELINE.capital.total;
  const retainedProfit =
    bs?.liabilitiesAndEquity?.retainedProfit ??
    latestSummary?.netProfit?.total ??
    0;
  const totalLiabilities =
    bs?.liabilitiesAndEquity?.totalLiabilities ??
    bs?.liabilitiesAndEquity?.vendorPayables ??
    0;
  const totalLiabilitiesAndCapital =
    partnerCapital + retainedProfit + totalLiabilities;

  const customerReceivables =
    bs?.assets?.customerReceivables ?? latestSummary?.lendingToCustomers ?? 0;
  const closingStockValue =
    bs?.assets?.closingStockValue ?? latestSummary?.closingStock?.amount ?? 0;
  const fixedAssetsValue =
    bs?.assets?.totalFixedAssetsValue ?? JAN_2026_BASELINE.fixedAssets.total;
  const nonCashAssets =
    customerReceivables + closingStockValue + fixedAssetsValue;

  const cashInHand =
    bs?.assets?.cashBalance ?? totalLiabilitiesAndCapital - nonCashAssets;
  const cashAdjustment = bs?.cashAdjustment ?? cashInHand - priorCashBalance;
  const totalAssets = nonCashAssets + cashInHand;
  const netWorth = partnerCapital + retainedProfit;

  return {
    cashInHand: Number(cashInHand.toFixed(2)),
    priorCashBalance: Number(priorCashBalance.toFixed(2)),
    cashAdjustment: Number(cashAdjustment.toFixed(2)),
    customerReceivables: Number(customerReceivables.toFixed(2)),
    closingStockValue: Number(closingStockValue.toFixed(2)),
    fixedAssetsValue: Number(fixedAssetsValue.toFixed(2)),
    totalAssets: Number(totalAssets.toFixed(2)),
    totalLiabilities: Number(totalLiabilities.toFixed(2)),
    partnerCapital: Number(partnerCapital.toFixed(2)),
    retainedProfit: Number(retainedProfit.toFixed(2)),
    netWorth: Number(netWorth.toFixed(2)),
  };
}
