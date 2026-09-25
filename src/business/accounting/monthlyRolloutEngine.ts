import {
  DividendDistribution,
  FixedAsset,
  FixedAssetData,
  MonthlyTradingSummary,
  ProfitCategorization,
  Transaction,
  TransactionModel,
} from '../../models';

import { parseTransactionDate } from '../../utils/formatters';
import { applyAssetDepreciation } from './assetDepreciation';
import { calculateBalanceSheet } from './balanceSheet';
import { calculateCapitalAndDividends } from './capitalDividends';
import { calculateCommissionProfit } from './commissionProfit';
import { calculateServiceProfit } from './serviceProfit';

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
 * Opening financial balances loaded from a database table or sheet
 */
export interface OpeningAccountingRecord {
  openingStock?: { weightKg: number; rate: number; amount: number };
  openingCommission?: number;
  openingPickup?: number;
  openingExpenses?: number;
  openingRetainedProfit?: number;
  openingCashBalance?: number;
  lendingToCustomers?: number;
  partnerCapital?: number;
  fixedAssets?: (FixedAsset | FixedAssetData)[];
}

export interface RolloutEngineOptions {
  discountC2?: number;
  lendingToCustomers?: number;
  principalCapital?: number;
  vendorPayables?: number;
  priorFixedAssets?: (FixedAsset | FixedAssetData)[];
  manualDividends?: DividendDistribution[];
  openingRecord?: OpeningAccountingRecord;
}

/**
 * Pure accounting calculation engine.
 * Reads all opening figures from previous summary or table records.
 * Contains NO hardcoded default asset values, capital, or baseline figures.
 */
export function calculateMonthlyTradingSummary(
  period: string, // e.g. '2026_01'
  transactions: Transaction[],
  prevSummary?: MonthlyTradingSummary | null,
  options?: RolloutEngineOptions,
): MonthlyTradingSummary {
  const [yearStr, monthStr] = period.split('_');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const label = `${MONTH_NAMES[monthIdx]} ${year}`;

  const monthTx = getTransactionsForMonth(transactions, year, monthIdx);
  const openRec = options?.openingRecord;

  // 1. Stock & Commission Profit: Read opening stock from previous summary or table opening record
  const openingStock =
    prevSummary && prevSummary.closingStock
      ? { ...prevSummary.closingStock }
      : openRec?.openingStock
        ? { ...openRec.openingStock }
        : { weightKg: 0, rate: 0, amount: 0 };

  const commissionResult = calculateCommissionProfit(monthTx, openingStock);

  // 2. Service Profit (Daalu)
  const serviceResult = calculateServiceProfit(monthTx);

  // 3. Asset Depreciation: Read assets list from previous summary or table records (defaults to empty list)
  const initialAssets: (FixedAsset | FixedAssetData)[] =
    prevSummary?.fixedAssets ||
    options?.priorFixedAssets ||
    openRec?.fixedAssets ||
    [];

  const deprResult = applyAssetDepreciation(monthTx, initialAssets, period);

  // 4. Capital & Dividend Distributions: Read capital from options or table record
  const principalCapital =
    options?.principalCapital ??
    openRec?.partnerCapital ??
    prevSummary?.balanceSheet?.liabilitiesAndEquity?.partnerCapital ??
    0;

  const capDivResult = calculateCapitalAndDividends(monthTx, {
    principalCapital,
    manualDividends: options?.manualDividends,
  });

  // 5. General Operating Expenses (excluding direct fuel, Depreciation, and Capital Interest)
  let generalOperatingExpenses = 0;
  for (const tx of monthTx) {
    if (TransactionModel.isGeneralOperatingExpense(tx)) {
      generalOperatingExpenses += Number(tx.amount) || 0;
    }
  }

  // 6. Commission totals: Read previous cumulative commission from previous summary or table record
  const discountC2 = options?.discountC2 || 0;
  const prevCommission =
    prevSummary && prevSummary.commission
      ? prevSummary.commission.total - discountC2
      : (openRec?.openingCommission ?? 0) - discountC2;
  const totalCommission = prevCommission + commissionResult.grossCommissionCM;

  // 7. Pickup / Service Profit totals: Read previous cumulative Pickup from previous summary or table record
  const prevPickup =
    prevSummary && prevSummary.pickup
      ? prevSummary.pickup.total
      : (openRec?.openingPickup ?? 0);
  const totalPickup = prevPickup + serviceResult.netServiceProfitCM;

  // 8. Total Expenses: Read previous cumulative expenses from previous summary or table record
  const totalExpensesCM =
    generalOperatingExpenses +
    deprResult.totalDepreciationCM +
    capDivResult.capitalInterestCM;

  const prevExpenses =
    prevSummary && prevSummary.expenses
      ? prevSummary.expenses.total
      : (openRec?.openingExpenses ?? 0);
  const totalExpenses = prevExpenses + totalExpensesCM;

  // 9. Profit Calculations
  const operatingNetProfitCM =
    commissionResult.grossCommissionCM +
    serviceResult.netServiceProfitCM -
    totalExpensesCM;

  const totalOperatingProfit = totalCommission + totalPickup - totalExpenses;

  // Retained Profit (after subtracting dividends)
  const prevRetainedProfit =
    prevSummary?.profitBreakdown?.netRetainedProfit?.total ??
    prevSummary?.netProfit?.total ??
    openRec?.openingRetainedProfit ??
    totalOperatingProfit - operatingNetProfitCM;

  const retainedProfitCM = operatingNetProfitCM - capDivResult.dividendsPaidCM;
  const totalRetainedProfit = prevRetainedProfit + retainedProfitCM;

  // 10. Customer Receivables & Balance Sheet: Read lending from options, previous summary, or table record
  const lendingToCustomers =
    options?.lendingToCustomers !== undefined
      ? options.lendingToCustomers
      : prevSummary?.lendingToCustomers !== undefined
        ? prevSummary.lendingToCustomers
        : (openRec?.lendingToCustomers ?? 0);

  const priorCashBalance =
    prevSummary?.cashBalance ?? openRec?.openingCashBalance ?? 0;

  const vendorPayables = options?.vendorPayables ?? 0;

  const balanceSheet = calculateBalanceSheet({
    partnerCapital: capDivResult.principalCapital,
    retainedProfit: totalRetainedProfit,
    customerReceivables: lendingToCustomers,
    closingStockValue: commissionResult.closingStock.amount,
    fixedAssets: deprResult.updatedAssets,
    vendorPayables,
    openingCashBalance: priorCashBalance,
  });

  const totalCapital = balanceSheet.liabilitiesAndEquity.totalCapitalAndEquity;
  const cashBalance = balanceSheet.assets.cashBalance;

  // 11. Segregated Profit Categorization
  const profitBreakdown: ProfitCategorization = {
    commissionProfit: {
      cm: commissionResult.grossCommissionCM,
      prev: prevCommission,
      total: Number(totalCommission.toFixed(2)),
    },
    serviceProfit: {
      cm: serviceResult.netServiceProfitCM,
      prev: prevPickup,
      total: Number(totalPickup.toFixed(2)),
    },
    operatingExpenses: {
      cm: Number(generalOperatingExpenses.toFixed(2)),
      prev: prevExpenses,
      total: Number((prevExpenses + generalOperatingExpenses).toFixed(2)),
    },
    depreciationExpense: {
      cm: deprResult.totalDepreciationCM,
      prev: prevSummary?.profitBreakdown?.depreciationExpense?.total ?? 0,
      total: Number(
        (
          (prevSummary?.profitBreakdown?.depreciationExpense?.total ?? 0) +
          deprResult.totalDepreciationCM
        ).toFixed(2),
      ),
    },
    capitalInterestExpense: {
      cm: capDivResult.capitalInterestCM,
      prev: prevSummary?.profitBreakdown?.capitalInterestExpense?.total ?? 0,
      total: Number(
        (
          (prevSummary?.profitBreakdown?.capitalInterestExpense?.total ?? 0) +
          capDivResult.capitalInterestCM
        ).toFixed(2),
      ),
    },
    operatingNetProfit: {
      cm: Number(operatingNetProfitCM.toFixed(2)),
      prev: prevSummary?.profitBreakdown?.operatingNetProfit?.total ?? 0,
      total: Number(totalOperatingProfit.toFixed(2)),
    },
    dividendDistribution: {
      cm: capDivResult.dividendsPaidCM,
      prev: prevSummary?.profitBreakdown?.dividendDistribution?.total ?? 0,
      total: Number(
        (
          (prevSummary?.profitBreakdown?.dividendDistribution?.total ?? 0) +
          capDivResult.dividendsPaidCM
        ).toFixed(2),
      ),
    },
    netRetainedProfit: {
      cm: Number(retainedProfitCM.toFixed(2)),
      prev: prevRetainedProfit,
      total: Number(totalRetainedProfit.toFixed(2)),
    },
  };

  return {
    period,
    label,
    openingStock: commissionResult.openingStock,
    purchases: commissionResult.purchases,
    totalStock: commissionResult.totalStock,
    sales: commissionResult.sales,
    closingStock: commissionResult.closingStock,
    commission: {
      cm: commissionResult.grossCommissionCM,
      prev: Number(prevCommission.toFixed(2)),
      discountC2,
      total: Number(totalCommission.toFixed(2)),
    },
    pickup: {
      cm: serviceResult.netServiceProfitCM,
      prev: Number(prevPickup.toFixed(2)),
      total: Number(totalPickup.toFixed(2)),
    },
    expenses: {
      cm: Number(totalExpensesCM.toFixed(2)),
      prev: Number(prevExpenses.toFixed(2)),
      total: Number(totalExpenses.toFixed(2)),
    },
    netProfit: {
      cm: Number(operatingNetProfitCM.toFixed(2)),
      total: Number(totalOperatingProfit.toFixed(2)),
    },
    lendingToCustomers,
    cashBalance,
    totalCapital,
    profitBreakdown,
    balanceSheet,
    fixedAssets: deprResult.updatedAssets,
    dividends: capDivResult.newDividends,
  };
}
