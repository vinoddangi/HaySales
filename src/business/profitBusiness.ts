import {
  CropCategory,
  getRate,
  isExpenseTransaction,
  isPurchaseTransaction,
  isSaleTransaction,
  isServiceTransaction,
  PurchaseTransactionData,
  SaleTransactionData,
  Transaction,
  VALID_CROP_CATEGORIES,
} from '../models';
import { CropRecord } from '../store/slices/stockSlice';
import { parseTransactionDate } from '../utils';

// ── Timeline Types ──────────────────────────────────────────────────────────

export interface TimelineFilter {
  selectedYear: number;
  selectedMonth: number; // 0-indexed: 0 = January, 11 = December
  selectedDay?: number; // Optional 1-indexed day of month (1..31)
  filterMode?: 'month' | 'ytd';
}

// ── Result Type Interfaces ──────────────────────────────────────────────────

export interface CropValuationMetric {
  weight: number;
  rate: number;
  amount: number;
}

export interface CropCommissionProfitResult {
  category: CropCategory;
  openingStock: CropValuationMetric;
  purchases: CropValuationMetric;
  totalAvailableStock: {
    weight: number;
    weightedRate: number;
    amount: number;
  };
  sales: {
    weight: number;
    avgRate: number;
    amount: number;
  };
  closingStock: CropValuationMetric;
  costOfGoodsSold: number;
  grossCommissionProfit: number;
}

export interface CommissionProfitSummary {
  byCrop: Partial<Record<CropCategory, CropCommissionProfitResult>>;
  totalOpeningStock: {
    weight: number;
    amount: number;
  };
  totalPurchases: CropValuationMetric;
  totalSales: {
    weight: number;
    avgRate: number;
    amount: number;
  };
  totalClosingStock: {
    weight: number;
    amount: number;
  };
  totalCostOfGoodsSold: number;
  totalGrossCommissionProfit: number;
}

export interface ServiceProfitResult {
  serviceIncome: number;
  fuelExpenses: number;
  netServiceProfit: number;
}

export interface ExpectedProfitSummary {
  commission: CommissionProfitSummary;
  service: ServiceProfitResult;
  operatingExpenses: number;
  netOperatingProfit: number;
}

// ── Timeline Filtering Helpers ──────────────────────────────────────────────

/**
 * Filters transactions according to active timeline selection (Month vs YTD vs specific Day).
 */
export function filterTransactionsByTimeline(
  transactions: Transaction[],
  timeline: TimelineFilter,
): Transaction[] {
  return transactions.filter((tx) => {
    const d = parseTransactionDate(tx.date);
    if (!d) return false;
    const txYear = d.getFullYear();
    const txMonth = d.getMonth();
    const txDay = d.getDate();

    if (txYear !== timeline.selectedYear) return false;

    if (timeline.selectedDay !== undefined && timeline.selectedDay > 0) {
      return (
        txMonth === timeline.selectedMonth && txDay === timeline.selectedDay
      );
    }

    if (timeline.filterMode === 'month' || !timeline.filterMode) {
      return txMonth === timeline.selectedMonth;
    }
    // YTD (Year-To-Date): from Jan 1st up to active selectedMonth of selectedYear
    return txMonth <= timeline.selectedMonth;
  });
}

/**
 * Filters transactions within an explicit date range window.
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string | Date,
  endDate: string | Date,
): Transaction[] {
  const start = parseTransactionDate(startDate)?.getTime() ?? -Infinity;
  const end = parseTransactionDate(endDate)?.getTime() ?? Infinity;

  return transactions.filter((tx) => {
    const d = parseTransactionDate(tx.date);
    if (!d) return false;
    const time = d.getTime();
    return time >= start && time <= end;
  });
}

// ── Single Crop Commission Profit Calculation ───────────────────────────────

/**
 * Calculates grass/hay purchase, sales, closing stock valuation, and gross commission
 * for an individual crop category across any timeline period based on weighted moving average cost.
 *
 * Formulas:
 * - Available Stock = Opening Stock + Purchases
 * - Weighted Buy Rate = Available Amount / Available Weight
 * - Cost of Goods Sold (COGS) = Sold Weight * Weighted Buy Rate
 * - Gross Commission Profit = Sales Amount - COGS
 */
export function calculateCropCommissionProfit(
  category: CropCategory,
  openingStock: PurchaseTransactionData | undefined,
  purchases: PurchaseTransactionData[],
  sales: SaleTransactionData[],
): CropCommissionProfitResult {
  const openWeight = openingStock?.weight || 0;
  const openAmount = openingStock?.amount || 0;
  const openRate = openingStock ? getRate(openingStock) || 0 : 0;

  const initialOpening: CropValuationMetric = {
    weight: openWeight,
    rate: openRate,
    amount: openAmount,
  };

  // Filter purchases for this crop
  let purchaseWeight = 0;
  let purchaseAmount = 0;
  for (const tx of purchases) {
    if (tx.category.toLowerCase() === category.toLowerCase()) {
      purchaseWeight += tx.weight || 0;
      purchaseAmount += tx.amount || 0;
    }
  }

  const purchaseRate =
    purchaseWeight > 0 ? Number((purchaseAmount / purchaseWeight).toFixed(2)) : 0;
  const purchasesMetric: CropValuationMetric = {
    weight: purchaseWeight,
    rate: purchaseRate,
    amount: purchaseAmount,
  };

  // Total available stock
  const totalWeight = initialOpening.weight + purchasesMetric.weight;
  const totalAmount = initialOpening.amount + purchasesMetric.amount;
  const weightedRate = totalWeight > 0 ? totalAmount / totalWeight : 0;

  const totalAvailableStock = {
    weight: totalWeight,
    weightedRate: Number(weightedRate.toFixed(4)),
    amount: Number(totalAmount.toFixed(2)),
  };

  // Filter sales for this crop
  let salesWeight = 0;
  let salesAmount = 0;
  for (const tx of sales) {
    if (tx.category.toLowerCase() === category.toLowerCase()) {
      salesWeight += tx.weight || 0;
      salesAmount += tx.amount || 0;
    }
  }

  const avgSalesRate =
    salesWeight > 0 ? Number((salesAmount / salesWeight).toFixed(2)) : 0;
  const salesMetric = {
    weight: salesWeight,
    avgRate: avgSalesRate,
    amount: Number(salesAmount.toFixed(2)),
  };

  // Closing Stock & COGS
  const closingWeight = Math.max(0, totalWeight - salesWeight);
  const closingAmount = closingWeight * weightedRate;
  const closingStock: CropValuationMetric = {
    weight: closingWeight,
    rate: Number(weightedRate.toFixed(2)),
    amount: Number(closingAmount.toFixed(2)),
  };

  const costOfGoodsSold = Number((salesWeight * weightedRate).toFixed(2));
  const grossCommissionProfit = Number(
    (salesMetric.amount - costOfGoodsSold).toFixed(2),
  );

  return {
    category,
    openingStock: initialOpening,
    purchases: purchasesMetric,
    totalAvailableStock,
    sales: salesMetric,
    closingStock,
    costOfGoodsSold,
    grossCommissionProfit,
  };
}

// ── Multi-Crop Commission Profit Calculation ────────────────────────────────

/**
 * Calculates comprehensive commission profit across all crop categories for any timeline selection.
 */
export function calculateCommissionProfit(
  periodTransactions: Transaction[],
  openingStock: CropRecord = {},
): CommissionProfitSummary {
  const purchases = periodTransactions.filter(isPurchaseTransaction);
  const sales = periodTransactions.filter(isSaleTransaction);

  const byCrop: Partial<Record<CropCategory, CropCommissionProfitResult>> = {};

  let totalOpenWeight = 0;
  let totalOpenAmount = 0;

  let totalPurchaseWeight = 0;
  let totalPurchaseAmount = 0;

  let totalSalesWeight = 0;
  let totalSalesAmount = 0;

  let totalClosingWeight = 0;
  let totalClosingAmount = 0;

  let totalCostOfGoodsSold = 0;
  let totalGrossCommissionProfit = 0;

  // Process all valid crop categories
  for (const crop of VALID_CROP_CATEGORIES) {
    const cropOpening = openingStock[crop];
    const cropPurchases = purchases.filter(
      (tx) => tx.category.toLowerCase() === crop.toLowerCase(),
    );
    const cropSales = sales.filter(
      (tx) => tx.category.toLowerCase() === crop.toLowerCase(),
    );

    // Only compute for crops with opening stock, purchases, or sales
    if (cropOpening || cropPurchases.length > 0 || cropSales.length > 0) {
      const cropResult = calculateCropCommissionProfit(
        crop,
        cropOpening,
        cropPurchases,
        cropSales,
      );

      byCrop[crop] = cropResult;

      totalOpenWeight += cropResult.openingStock.weight;
      totalOpenAmount += cropResult.openingStock.amount;

      totalPurchaseWeight += cropResult.purchases.weight;
      totalPurchaseAmount += cropResult.purchases.amount;

      totalSalesWeight += cropResult.sales.weight;
      totalSalesAmount += cropResult.sales.amount;

      totalClosingWeight += cropResult.closingStock.weight;
      totalClosingAmount += cropResult.closingStock.amount;

      totalCostOfGoodsSold += cropResult.costOfGoodsSold;
      totalGrossCommissionProfit += cropResult.grossCommissionProfit;
    }
  }

  const totalPurchaseRate =
    totalPurchaseWeight > 0
      ? Number((totalPurchaseAmount / totalPurchaseWeight).toFixed(2))
      : 0;

  const totalSalesAvgRate =
    totalSalesWeight > 0
      ? Number((totalSalesAmount / totalSalesWeight).toFixed(2))
      : 0;

  return {
    byCrop,
    totalOpeningStock: {
      weight: totalOpenWeight,
      amount: Number(totalOpenAmount.toFixed(2)),
    },
    totalPurchases: {
      weight: totalPurchaseWeight,
      rate: totalPurchaseRate,
      amount: Number(totalPurchaseAmount.toFixed(2)),
    },
    totalSales: {
      weight: totalSalesWeight,
      avgRate: totalSalesAvgRate,
      amount: Number(totalSalesAmount.toFixed(2)),
    },
    totalClosingStock: {
      weight: totalClosingWeight,
      amount: Number(totalClosingAmount.toFixed(2)),
    },
    totalCostOfGoodsSold: Number(totalCostOfGoodsSold.toFixed(2)),
    totalGrossCommissionProfit: Number(totalGrossCommissionProfit.toFixed(2)),
  };
}

// ── Service / Pickup Profit Calculation ──────────────────────────────────────

/**
 * Calculates service profitability (e.g. Pickup/Transport/Machinery) across any timeline window.
 * Net Service Profit = Service Revenue - Direct Fuel Expenses
 */
export function calculateServiceProfit(
  periodTransactions: Transaction[],
): ServiceProfitResult {
  let serviceIncome = 0;
  let fuelExpenses = 0;

  for (const tx of periodTransactions) {
    if (isServiceTransaction(tx)) {
      serviceIncome += Number(tx.amount || 0);
    } else if (isExpenseTransaction(tx) && tx.category === 'Fuel') {
      fuelExpenses += Number(tx.amount || 0);
    }
  }

  const netServiceProfit = serviceIncome - fuelExpenses;

  return {
    serviceIncome: Number(serviceIncome.toFixed(2)),
    fuelExpenses: Number(fuelExpenses.toFixed(2)),
    netServiceProfit: Number(netServiceProfit.toFixed(2)),
  };
}

// ── Expected / Net Operating Profit Calculation ──────────────────────────────

/**
 * Calculates complete expected net operating profit for any period transactions:
 * Net Profit = Gross Commission Profit + Net Service Profit - Operating Expenses
 */
export function calculateExpectedProfit(
  periodTransactions: Transaction[],
  openingStock: CropRecord = {},
): ExpectedProfitSummary {
  const commission = calculateCommissionProfit(periodTransactions, openingStock);
  const service = calculateServiceProfit(periodTransactions);

  let operatingExpenses = 0;
  for (const tx of periodTransactions) {
    if (
      isExpenseTransaction(tx) &&
      tx.category !== 'Fuel' &&
      tx.category !== 'Profit Distribution'
    ) {
      operatingExpenses += Number(tx.amount || 0);
    }
  }

  const netOperatingProfit = Number(
    (
      commission.totalGrossCommissionProfit +
      service.netServiceProfit -
      operatingExpenses
    ).toFixed(2),
  );

  return {
    commission,
    service,
    operatingExpenses: Number(operatingExpenses.toFixed(2)),
    netOperatingProfit,
  };
}

/**
 * Convenience orchestrator: filters all ledger transactions by the active Timeline selection
 * and calculates the corresponding expected profit summary.
 */
export function calculateTimelineExpectedProfit(
  allTransactions: Transaction[],
  timeline: TimelineFilter,
  openingStock: CropRecord = {},
): ExpectedProfitSummary {
  const filtered = filterTransactionsByTimeline(allTransactions, timeline);
  return calculateExpectedProfit(filtered, openingStock);
}
