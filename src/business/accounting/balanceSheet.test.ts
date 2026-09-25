import { describe, expect, it } from 'vitest';
import { calculateBalanceSheet } from './balanceSheet';

describe('balanceSheet', () => {
  it('balances Total Assets against Total Capital and derives exact Cash in Hand', () => {
    const fixedAssets = [
      {
        id: 'asset_tractor',
        name: 'Tractor',
        category: 'Machinery' as const,
        purchaseCost: 960000,
        accumulatedDepreciation: 60000,
        currentBookValue: 900000,
      },
      {
        id: 'asset_fence',
        name: 'Fence',
        category: 'Infrastructure' as const,
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
    // Cash Balance = 2300000 - 1584800 = 715200
    expect(result.assets.cashBalance).toBe(715200);

    // Total Assets = Total Capital = 2300000
    expect(result.assets.totalAssets).toBe(2300000);

    // Cash Adjustment = Closing Cash (715200) - Opening Cash (600000) = 115200
    expect(result.cashAdjustment).toBe(115200);
    expect(result.isEquilibrium()).toBe(true);
  });

  it('balances properly when vendor payables / liabilities exist', () => {
    const fixedAssets = [
      {
        id: 'asset_pickup',
        name: 'Pickup',
        category: 'Vehicle' as const,
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
      vendorPayables: 250000,
      openingCashBalance: 500000,
    });

    // Total Capital & Equity = 1000000 (Capital) + 200000 (Profit) + 250000 (Liabilities) = 1450000
    expect(result.liabilitiesAndEquity.vendorPayables).toBe(250000);
    expect(result.liabilitiesAndEquity.totalLiabilities).toBe(250000);
    expect(result.liabilitiesAndEquity.totalCapitalAndEquity).toBe(1450000);

    // Non-Cash Assets = Receivables (300000) + Stock (150000) + Fixed (450000) = 900000
    // Cash Balance = 1450000 - 900000 = 550000
    expect(result.assets.cashBalance).toBe(550000);
    expect(result.assets.totalAssets).toBe(1450000);
    expect(result.isEquilibrium()).toBe(true);
    expect(result.getNetWorth()).toBe(1200000); // 1000000 capital + 200000 retained profit
  });
});
