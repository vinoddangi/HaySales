import { FixedAsset } from '../models';

export interface BalanceSheetAssets {
  cashBalance: number;
  customerReceivables: number;
  closingStockValue: number;
  fixedAssets: FixedAsset[];
  totalFixedAssetsValue: number;
  totalAssets: number;
}

export interface BalanceSheetLiabilitiesAndEquity {
  partnerCapital: number;
  retainedProfit: number;
  loansAndLiabilities: number;
  totalLiabilities: number;
  totalCapitalAndEquity: number;
}

export interface BalanceSheetResult {
  assets: BalanceSheetAssets;
  liabilitiesAndEquity: BalanceSheetLiabilitiesAndEquity;
  cashAdjustment: number;
  isEquilibrium: boolean;
  netWorth: number;
}

export interface CalculateBalanceSheetParams {
  partnerCapital: number;
  retainedProfit: number;
  customerReceivables: number;
  closingStockValue: number;
  fixedAssets: FixedAsset[] | Record<string, FixedAsset>;
  loansAndLiabilities?: number;
  openingCashBalance?: number;
}

/**
 * Calculates the complete Balance Sheet snapshot based on double-entry principles.
 *
 * Rules:
 * 1. Total Liabilities & Capital = Partner Capital + Retained Profit + Loans & Liabilities
 * 2. Non-Cash Assets = Customer Receivables + Closing Stock Value + Total Fixed Assets Book Value
 * 3. Cash in Hand (Liquid) = Total Liabilities & Capital - Non-Cash Assets (Dynamically Derived)
 * 4. Total Assets = Non-Cash Assets + Cash in Hand ≡ Total Liabilities & Capital
 */
export function calculateBalanceSheet(
  params: CalculateBalanceSheetParams,
): BalanceSheetResult {
  const {
    partnerCapital,
    retainedProfit,
    customerReceivables,
    closingStockValue,
    fixedAssets: rawFixedAssets,
    loansAndLiabilities = 0,
    openingCashBalance = 0,
  } = params;

  // Normalize fixed assets array
  const fixedAssetsList: FixedAsset[] = Array.isArray(rawFixedAssets)
    ? rawFixedAssets
    : Object.values(rawFixedAssets);

  // Compute total fixed assets book value
  const totalFixedAssetsValue = Number(
    fixedAssetsList
      .reduce((sum, asset) => sum + (asset.currentBookValue || 0), 0)
      .toFixed(2),
  );

  const totalLiabilities = Number(loansAndLiabilities.toFixed(2));
  const totalCapitalAndEquity = Number(
    (partnerCapital + retainedProfit + totalLiabilities).toFixed(2),
  );

  const nonCashAssets =
    customerReceivables + closingStockValue + totalFixedAssetsValue;

  // Dynamic calculated difference (balancing figure)
  const cashBalance = Number(
    (totalCapitalAndEquity - nonCashAssets).toFixed(2),
  );
  const totalAssets = Number(
    (nonCashAssets + cashBalance).toFixed(2),
  );

  const cashAdjustment = Number(
    (cashBalance - openingCashBalance).toFixed(2),
  );

  const isEquilibrium =
    Math.abs(totalAssets - totalCapitalAndEquity) < 0.01;

  const netWorth = Number((partnerCapital + retainedProfit).toFixed(2));

  return {
    assets: {
      cashBalance,
      customerReceivables: Number(customerReceivables.toFixed(2)),
      closingStockValue: Number(closingStockValue.toFixed(2)),
      fixedAssets: fixedAssetsList,
      totalFixedAssetsValue,
      totalAssets,
    },
    liabilitiesAndEquity: {
      partnerCapital: Number(partnerCapital.toFixed(2)),
      retainedProfit: Number(retainedProfit.toFixed(2)),
      loansAndLiabilities: totalLiabilities,
      totalLiabilities,
      totalCapitalAndEquity,
    },
    cashAdjustment,
    isEquilibrium,
    netWorth,
  };
}
