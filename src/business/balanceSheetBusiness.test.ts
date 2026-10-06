import { describe, expect, it } from 'vitest';
import {
  FixedAsset,
  INITIAL_ASSETS,
  INITIAL_CAPITAL,
  INITIAL_LIABILITIES,
  INITIAL_RETAINED_PROFIT,
} from '../models';
import {
  calculateBalanceSheet,
  getFixedAssetsForPeriod,
  getPartnerCapitalForPeriod,
  getPartnerLoanForPeriod,
  getProfitDistributionForPeriod,
} from './balanceSheetBusiness';

describe('balanceSheetBusiness', () => {
  it('balances Total Assets against Total Capital & Liabilities and derives exact Cash in Hand as difference', () => {
    const fixedAssets: FixedAsset[] = [
      {
        id: 'asset_pickup',
        name: 'Pickup',
        category: 'Vehicle',
        purchaseCost: 960000,
        accumulatedDepreciation: 60000,
        currentBookValue: 900000,
      },
      {
        id: 'asset_fence',
        name: 'Fence',
        category: 'Infrastructure',
        purchaseCost: 64800,
        accumulatedDepreciation: 0,
        currentBookValue: 64800,
      },
    ];

    const result = calculateBalanceSheet({
      partnerCapital: 1500000,
      retainedProfit: 800000,
      customerReceivables: 500000,
      closingStockValue: 120000,
      fixedAssets,
      openingCashBalance: 600000,
    });

    // Total Capital & Equity = 1500000 + 800000 = 2300000
    expect(result.liabilitiesAndEquity.totalCapitalAndEquity).toBe(2300000);

    // Total Fixed Assets = 900000 + 64800 = 964800
    expect(result.assets.totalFixedAssetsValue).toBe(964800);

    // Non-Cash Assets = Receivables (500000) + Stock (120000) + Fixed (964800) = 1584800
    // Derived Cash in Hand = 2300000 - 1584800 = 715200
    expect(result.assets.cashBalance).toBe(715200);

    // Total Assets = Total Capital & Liabilities = 2300000
    expect(result.assets.totalAssets).toBe(2300000);

    // Cash Adjustment = Closing Cash (715200) - Opening Cash (600000) = 115200
    expect(result.cashAdjustment).toBe(115200);
    expect(result.isEquilibrium).toBe(true);
    expect(result.netWorth).toBe(2300000);
  });

  it('balances correctly with loans / vendor payables (liabilities)', () => {
    const fixedAssets: FixedAsset[] = [
      {
        id: 'asset_pickup',
        name: 'Pickup',
        category: 'Vehicle',
        purchaseCost: 500000,
        accumulatedDepreciation: 50000,
        currentBookValue: 450000,
      },
    ];

    const result = calculateBalanceSheet({
      partnerCapital: 1000000,
      retainedProfit: 200000,
      customerReceivables: 300000,
      closingStockValue: 150000,
      fixedAssets,
      loansAndLiabilities: 250000,
      openingCashBalance: 500000,
    });

    // Total Capital & Equity = 1000000 (Capital) + 200000 (Profit) + 250000 (Liabilities) = 1450000
    expect(result.liabilitiesAndEquity.loansAndLiabilities).toBe(250000);
    expect(result.liabilitiesAndEquity.totalLiabilities).toBe(250000);
    expect(result.liabilitiesAndEquity.totalCapitalAndEquity).toBe(1450000);

    // Non-Cash Assets = Receivables (300000) + Stock (150000) + Fixed (450000) = 900000
    // Derived Cash in Hand = 1450000 - 900000 = 550000
    expect(result.assets.cashBalance).toBe(550000);
    expect(result.assets.totalAssets).toBe(1450000);
    expect(result.isEquilibrium).toBe(true);
    expect(result.netWorth).toBe(1200000); // 1000000 + 200000
  });

  it('handles baseline initial records properly when passed as dictionary', () => {
    const totalLiabilities = Object.values(INITIAL_LIABILITIES).reduce(
      (sum, l) => sum + l.amount,
      0,
    );
    const totalCapital = Object.values(INITIAL_CAPITAL).reduce(
      (sum, c) => sum + c.principalCapital,
      0,
    );

    const result = calculateBalanceSheet({
      partnerCapital: totalCapital,
      retainedProfit: INITIAL_RETAINED_PROFIT,
      customerReceivables: 420000,
      closingStockValue: 85000,
      fixedAssets: INITIAL_ASSETS,
      loansAndLiabilities: totalLiabilities,
    });

    // Total Fixed Assets: 329000 (Pickup / Daalu) + 64800 (Fence) + 24000 (Talpatri) = 417800
    expect(result.assets.totalFixedAssetsValue).toBe(417800);

    // Total Liabilities & Capital = 1200000 + 2165402 + 800000 = 4165402
    expect(result.liabilitiesAndEquity.totalCapitalAndEquity).toBe(4165402);

    // Non-Cash Assets = 420000 + 85000 + 417800 = 922800
    // Cash Balance = 4165402 - 922800 = 3242602
    expect(result.assets.cashBalance).toBe(3242602);
    expect(result.assets.totalAssets).toBe(4165402);
    expect(result.isEquilibrium).toBe(true);
  });

  describe('period-aware helpers', () => {
    it('returns correct partner capital across periods', () => {
      expect(getPartnerCapitalForPeriod('2025-01')).toBe(1200000);
      expect(getPartnerCapitalForPeriod('2025-10')).toBe(1200000);
      expect(getPartnerCapitalForPeriod('2025-11')).toBe(1500000);
      expect(getPartnerCapitalForPeriod('2026-05')).toBe(1500000);
    });

    it('returns correct partner loan liability across periods', () => {
      expect(getPartnerLoanForPeriod('2025-01')).toBe(800000);
      expect(getPartnerLoanForPeriod('2025-02')).toBe(750000);
      expect(getPartnerLoanForPeriod('2026-08')).toBe(750000);
    });

    it('returns correct profit distributions across periods', () => {
      expect(getProfitDistributionForPeriod('2025-11')).toBe(0);
      expect(getProfitDistributionForPeriod('2025-12')).toBe(1000000);
      expect(getProfitDistributionForPeriod('2026-08')).toBe(1000000);
    });

    it('returns period-specific fixed assets and valuations', () => {
      // Jan 2025: Daalu (329k) + Fence (64.8k) + Talpatri #1 (24k) = 417,800
      const jan2025 = getFixedAssetsForPeriod('2025-01');
      const janTotal = jan2025.reduce((sum, a) => sum + a.currentBookValue, 0);
      expect(janTotal).toBe(417800);

      // Mar 2025: Daalu (329k) + Fence (64.8k) + Talpatri #2 (30k) = 423,800
      const mar2025 = getFixedAssetsForPeriod('2025-03');
      const marTotal = mar2025.reduce((sum, a) => sum + a.currentBookValue, 0);
      expect(marTotal).toBe(423800);

      // May 2025: Daalu (270k) + Fence (64.8k) + Talpatri (60k) = 394,800
      const may2025 = getFixedAssetsForPeriod('2025-05');
      const mayTotal = may2025.reduce((sum, a) => sum + a.currentBookValue, 0);
      expect(mayTotal).toBe(394800);

      // Nov 2025: Daalu (120k) + Tractor (846.7k) + Fence (64.8k) + Talpatri (60k) = 1,091,500
      const nov2025 = getFixedAssetsForPeriod('2025-11');
      const novTotal = nov2025.reduce((sum, a) => sum + a.currentBookValue, 0);
      expect(novTotal).toBe(1091500);

      // Dec 2025 onwards: Daalu (120k) + Tractor (840k) + Fence (64.8k) + Talpatri (60k) = 1,084,800
      const dec2025 = getFixedAssetsForPeriod('2025-12');
      const decTotal = dec2025.reduce((sum, a) => sum + a.currentBookValue, 0);
      expect(decTotal).toBe(1084800);
    });
  });
});
