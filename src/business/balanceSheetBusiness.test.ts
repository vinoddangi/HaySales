import { describe, expect, it } from 'vitest';
import { FixedAsset, INITIAL_ASSETS, INITIAL_CAPITAL, INITIAL_LIABILITIES, INITIAL_RETAINED_PROFIT } from '../models';
import { calculateBalanceSheet } from './balanceSheetBusiness';

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

    // Total Fixed Assets: 960000 + 64800 + 60000 = 1084800
    expect(result.assets.totalFixedAssetsValue).toBe(1084800);

    // Total Liabilities & Capital = 1500000 + 2085394 + 750000 = 4335394
    expect(result.liabilitiesAndEquity.totalCapitalAndEquity).toBe(4335394);

    // Non-Cash Assets = 420000 + 85000 + 1084800 = 1589800
    // Cash Balance = 4335394 - 1589800 = 2745594
    expect(result.assets.cashBalance).toBe(2745594);
    expect(result.assets.totalAssets).toBe(4335394);
    expect(result.isEquilibrium).toBe(true);
  });
});
