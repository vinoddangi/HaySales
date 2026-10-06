import { createSelector } from '@reduxjs/toolkit';
import {
  BASELINE_CLOSING_STOCK,
  calculateCommissionProfit,
  calculateExpectedProfit,
  calculateMonthlyStockFromTransactions,
  calculateServiceProfit,
  CommissionProfitSummary,
  ExpectedProfitSummary,
  getOpeningStockForMonth,
  ServiceProfitResult,
} from '../../business';
import { isExpenseTransaction, isSaleTransaction } from '../../models';
import { CropRecord, StockState } from '../slices/stockSlice';
import {
  selectFilterMode,
  selectSelectedMonth,
  selectSelectedYear,
} from './timelineSelectors';
import {
  selectAllTransactions,
  selectPeriodTransactions,
} from './transactionSelectors';

// ── Baseline Constants (Closing 2024 / Opening 2025) ─────────────────────────

export const BASELINE_COMMISSION_PROFIT = 2084732;
export const BASELINE_SERVICE_INCOME = 340860;
export const BASELINE_SERVICE_EXPENSES = 260190;
export const BASELINE_NET_SERVICE_PROFIT =
  BASELINE_SERVICE_INCOME - BASELINE_SERVICE_EXPENSES; // 80,670
export const BASELINE_NET_OPERATING_PROFIT =
  BASELINE_COMMISSION_PROFIT + BASELINE_NET_SERVICE_PROFIT; // 2,165,402

// ── 1. Continuous Monthly Stock Rolling Selector ────────────────────────────

/**
 * Calculates continuous monthly closing stock and valuation for every chronological month
 * from all historical and active transactions starting from the 2024-12 baseline.
 */
export const selectCalculatedMonthlyStock = createSelector(
  [selectAllTransactions],
  (transactions): StockState => {
    return calculateMonthlyStockFromTransactions(
      transactions,
      BASELINE_CLOSING_STOCK,
      2025,
      1,
    );
  },
);

// ── 2. Opening Stock Selector for Active Period ─────────────────────────────

/**
 * Derives the exact Opening Stock (N0 - 1 Month Closing Stock) for the active timeline period:
 * - Monthly: Month (M - 1)'s closing stock.
 * - YTD: December (Year - 1)'s closing stock (or baseline for 2025).
 * - All: 2024-12 baseline closing stock.
 */
export const selectOpeningStockForPeriod = createSelector(
  [
    selectCalculatedMonthlyStock,
    selectSelectedYear,
    selectSelectedMonth,
    selectFilterMode,
  ],
  (monthlyStock, year, month, filterMode): CropRecord => {
    if (filterMode === 'all') {
      return BASELINE_CLOSING_STOCK;
    }

    if (filterMode === 'ytd') {
      // Opening for YTD of `year` is closing stock of December of previous year
      const prevYearKey = `${year - 1}-12`;
      return (
        monthlyStock[prevYearKey] ||
        (year === 2025 ? BASELINE_CLOSING_STOCK : {})
      );
    }

    // Monthly mode (N0 = start of month, N0 - 1 = previous month closing)
    return getOpeningStockForMonth(monthlyStock, year, month + 1);
  },
);

// ── 3. Period Commission Profit Selector ────────────────────────────────────

/**
 * Calculates Gross Commission Profit, Avg Buying Rate, Cost of Goods Sold,
 * and Closing Stock for the active period transactions [N0, N1] using N0 - 1 Opening Stock.
 */
export const selectPeriodCommissionProfit = createSelector(
  [selectPeriodTransactions, selectOpeningStockForPeriod],
  (periodTransactions, openingStock): CommissionProfitSummary => {
    return calculateCommissionProfit(periodTransactions, openingStock);
  },
);

// ── 4. Period Service Profit Selector ───────────────────────────────────────

/**
 * Calculates Pickup / Transport Service Profit for the active period.
 * Net Service Profit = Service Revenue - Fuel Expenses.
 */
export const selectPeriodServiceProfit = createSelector(
  [selectPeriodTransactions],
  (periodTransactions): ServiceProfitResult => {
    return calculateServiceProfit(periodTransactions);
  },
);

// ── 5. Period Operating Expenses Selector ───────────────────────────────────

/**
 * Calculates non-fuel operating expenses for the active period.
 */
export const selectPeriodOperatingExpenses = createSelector(
  [selectPeriodTransactions],
  (periodTransactions): number => {
    let expenses = 0;
    for (const tx of periodTransactions) {
      if (
        isExpenseTransaction(tx) &&
        tx.category !== 'Fuel' &&
        tx.category !== 'Profit Distribution' &&
        tx.category !== 'Asset Purchase' &&
        tx.category !== 'Loan Repayment'
      ) {
        expenses += Number(tx.amount || 0);
      }
    }
    return Number(expenses.toFixed(2));
  },
);

// ── 6. Period Expected Profit Summary Selector ──────────────────────────────

/**
 * Calculates complete Expected Net Operating Profit for the active period:
 * Net Operating Profit = Gross Commission + Net Service Profit - Operating Expenses.
 */
export const selectPeriodExpectedProfitSummary = createSelector(
  [
    selectPeriodCommissionProfit,
    selectPeriodServiceProfit,
    selectPeriodOperatingExpenses,
  ],
  (commission, service, operatingExpenses): ExpectedProfitSummary => {
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
      operatingExpenses,
      netOperatingProfit,
    };
  },
);

// ── 7. All-Time Cumulative Profit Selector ───────────────────────────────────

/**
 * Calculates all-time cumulative net profit from the 2024 baseline + all transactions.
 */
export const selectCumulativeExpectedProfitSummary = createSelector(
  [selectAllTransactions],
  (allTransactions): ExpectedProfitSummary => {
    const liveProfit = calculateExpectedProfit(
      allTransactions,
      BASELINE_CLOSING_STOCK,
    );

    return {
      ...liveProfit,
      netOperatingProfit: Number(
        (BASELINE_NET_OPERATING_PROFIT + liveProfit.netOperatingProfit).toFixed(
          2,
        ),
      ),
      commission: {
        ...liveProfit.commission,
        totalGrossCommissionProfit: Number(
          (
            BASELINE_COMMISSION_PROFIT +
            liveProfit.commission.totalGrossCommissionProfit
          ).toFixed(2),
        ),
      },
      service: {
        ...liveProfit.service,
        serviceIncome: Number(
          (BASELINE_SERVICE_INCOME + liveProfit.service.serviceIncome).toFixed(
            2,
          ),
        ),
        fuelExpenses: Number(
          (BASELINE_SERVICE_EXPENSES + liveProfit.service.fuelExpenses).toFixed(
            2,
          ),
        ),
        netServiceProfit: Number(
          (
            BASELINE_NET_SERVICE_PROFIT + liveProfit.service.netServiceProfit
          ).toFixed(2),
        ),
      },
    };
  },
);

// ── 8. Estimated Profit Card Metrics Selector (Home Page) ───────────────────

export interface EstimatedProfitMetrics {
  netProfit: number;
  profitMarginPct: number;
  grossCommission: number;
  pickupNet: number;
  operatingExpenses: number;
  cumulativeProfit: number;
  totalClosingStock: {
    weight: number;
    amount: number;
  };
}

export const selectEstimatedProfitMetrics = createSelector(
  [
    selectPeriodExpectedProfitSummary,
    selectCumulativeExpectedProfitSummary,
    selectPeriodTransactions,
  ],
  (
    periodSummary,
    cumulativeSummary,
    periodTransactions,
  ): EstimatedProfitMetrics => {
    const sales = periodTransactions.filter(isSaleTransaction);
    const totalSalesAmount = sales.reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0,
    );

    const netProfit = periodSummary.netOperatingProfit;
    const profitMarginPct =
      totalSalesAmount > 0 ? (netProfit / totalSalesAmount) * 100 : 0;

    return {
      netProfit,
      profitMarginPct,
      grossCommission: periodSummary.commission.totalGrossCommissionProfit,
      pickupNet: periodSummary.service.netServiceProfit,
      operatingExpenses: periodSummary.operatingExpenses,
      cumulativeProfit: cumulativeSummary.netOperatingProfit,
      totalClosingStock: periodSummary.commission.totalClosingStock,
    };
  },
);
