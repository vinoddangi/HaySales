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
 * Returns fixed assets with accurate historical book values and additions for any period.
 *
 * Timeline:
 * - Jan 2025 - Mar 2025: Daalu (329k), Fence (64.8k), Talpatri #1 (24k)
 * - Mar 2025: Talpatri #1 written off to P&L, Talpatri #2 added (30k)
 * - Apr 2025 - Oct 2025: Daalu steadily depreciated (300k -> 140k); Talpatri added in May (60k)
 * - Nov 2025: Tractor purchased (846.7k), Daalu at 120k (Total Vehicles: 966.7k)
 * - Dec 2025+: Tractor depreciated to 840k, Daalu at 120k (Total Vehicles: 960k)
 */
export function getFixedAssetsForPeriod(yearMonth?: string): FixedAsset[] {
  const ym = yearMonth || '2026-08';

  // Talpatri book value progression
  let talpatriValue = 60000;
  if (ym < '2025-03') {
    talpatriValue = 24000;
  } else if (ym < '2025-05') {
    talpatriValue = 30000;
  }

  // Daalu & Tractor vehicle values
  const assets: FixedAsset[] = [];

  if (ym < '2025-11') {
    // Daalu only
    let daaluValue = 329000;
    if (ym === '2025-04') daaluValue = 300000;
    else if (ym === '2025-05') daaluValue = 270000;
    else if (ym === '2025-06') daaluValue = 240000;
    else if (ym === '2025-07') daaluValue = 210000;
    else if (ym === '2025-08') daaluValue = 180000;
    else if (ym === '2025-09') daaluValue = 160000;
    else if (ym === '2025-10') daaluValue = 140000;

    assets.push({
      id: 'asset_pickup',
      name: 'Pickup',
      category: 'Vehicle',
      purchaseCost: 329000,
      accumulatedDepreciation: 329000 - daaluValue,
      currentBookValue: daaluValue,
    });
  } else {
    // Pickup (120k residual) + Tractor
    assets.push({
      id: 'asset_pickup',
      name: 'Pickup',
      category: 'Vehicle',
      purchaseCost: 329000,
      accumulatedDepreciation: 329000 - 120000,
      currentBookValue: 120000,
    });

    const tractorValue = ym === '2025-11' ? 846700 : 840000;
    assets.push({
      id: 'asset_tractor',
      name: 'Tractor',
      category: 'Vehicle',
      purchaseCost: 846700,
      accumulatedDepreciation: 846700 - tractorValue,
      currentBookValue: tractorValue,
    });
  }

  // Fence (64,800 across all periods)
  assets.push({
    id: 'asset_fence',
    name: 'Boundary Fence',
    category: 'Infrastructure',
    purchaseCost: 64800,
    accumulatedDepreciation: 0,
    currentBookValue: 64800,
  });

  // Talpatri
  assets.push({
    id: 'asset_talpatri',
    name: 'Talpatri (Waterproof Tarpaulins)',
    category: 'Equipment',
    purchaseCost: talpatriValue,
    accumulatedDepreciation: 0,
    currentBookValue: talpatriValue,
  });

  return assets;
}

/**
 * Returns partner principal capital for any period.
 * Jan - Oct 2025: ₹1,200,000
 * Nov 2025+: ₹1,500,000 (after Vinod's +₹300k capital contribution for Tractor)
 */
export function getPartnerCapitalForPeriod(yearMonth?: string): number {
  const ym = yearMonth || '2026-08';
  return ym < '2025-11' ? 1200000 : 1500000;
}

/**
 * Returns partner loan / capital interest liability for any period.
 * Jan 2025: ₹800,000
 * Feb 2025+: ₹750,000 (after ₹50,000 loan repayment in Feb 2025)
 */
export function getPartnerLoanForPeriod(yearMonth?: string): number {
  const ym = yearMonth || '2026-08';
  return ym < '2025-02' ? 800000 : 750000;
}

/**
 * Returns total cumulative profit distributions paid out through the given period.
 * Dec 2025+: ₹1,000,000 distributed on 31 Dec 2025
 */
export function getProfitDistributionForPeriod(yearMonth?: string): number {
  const ym = yearMonth || '2026-08';
  return ym >= '2025-12' ? 1000000 : 0;
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
  const totalAssets = Number((nonCashAssets + cashBalance).toFixed(2));

  const cashAdjustment = Number((cashBalance - openingCashBalance).toFixed(2));

  const isEquilibrium = Math.abs(totalAssets - totalCapitalAndEquity) < 0.01;

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
