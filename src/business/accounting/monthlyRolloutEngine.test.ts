import { describe, expect, it } from 'vitest';
import { Transaction } from '../../types';
import { calculateMonthlyTradingSummary } from './monthlyRolloutEngine';

describe('monthlyRolloutEngine', () => {
  it('integrates commission, daalu, depreciation, capital interest, dividends, and balance sheet without hardcoded defaults', () => {
    const transactions: Transaction[] = [
      // 1. Purchase: 10,000 kg @ 10 = 100,000
      {
        date: '2026-01-05',
        type: 'PURCHASE',
        weightKg: 10000,
        amount: 100000,
      },
      // 2. Sale: 8,000 kg @ 14 = 112,000
      {
        date: '2026-01-10',
        type: 'SALE',
        weightKg: 8000,
        amount: 112000,
      },
      // 3. Service (Daalu): 20,000 billing
      {
        date: '2026-01-15',
        type: 'SERVICE',
        category: 'Pickup',
        amount: 20000,
      },
      // 4. Daalu/Pickup Fuel: 5,000 direct expense
      {
        date: '2026-01-16',
        type: 'EXPENSE',
        category: 'Fuel',
        amount: 5000,
      },
      // 5. General Labor Expense: 3,000
      {
        date: '2026-01-18',
        type: 'EXPENSE',
        category: 'Labor',
        amount: 3000,
      },
      // 6. Asset Depreciation: 10,000 written off tractor
      {
        date: '2026-01-20',
        type: 'EXPENSE',
        category: 'Depreciation',
        amount: 10000,
        targetAssetId: 'asset_tractor',
      },
      // 7. Capital Interest: 5,000 settled in cash
      {
        date: '2026-01-25',
        type: 'EXPENSE',
        category: 'Interest',
        amount: 5000,
        note: 'Partner capital interest cash',
      },
      // 8. Dividend / Profit Sharing: 15,000 distributed to partner
      {
        date: '2026-01-28',
        type: 'DIVIDEND',
        amount: 15000,
        note: 'Dividend distribution to Vinod',
        partnerName: 'Vinod',
      },
    ];

    // Opening record loaded from table/database
    const openingRecord = {
      openingStock: { weightKg: 5000, rate: 10, amount: 50000 },
      openingCommission: 100000,
      openingPickup: 20000,
      openingExpenses: 15000,
      lendingToCustomers: 500000,
      partnerCapital: 1500000,
      fixedAssets: [
        {
          id: 'asset_tractor',
          name: 'Daalu / Tractor Machinery',
          category: 'Machinery' as const,
          purchaseCost: 960000,
          accumulatedDepreciation: 0,
          currentBookValue: 960000,
        },
      ],
    };

    const result = calculateMonthlyTradingSummary(
      '2026_01',
      transactions,
      null, // No previous month (Jan first period)
      {
        openingRecord,
        lendingToCustomers: 500000,
      },
    );

    // 1. Profit Breakdown Check
    expect(result.profitBreakdown).toBeDefined();
    const pb = result.profitBreakdown!;

    // Gross Commission
    expect(pb.commissionProfit.cm).toBeGreaterThan(0);

    // Service Profit (Daalu): 20,000 - 5,000 = 15,000
    expect(pb.serviceProfit.cm).toBe(15000);

    // Operating expenses (General labor): 3,000
    expect(pb.operatingExpenses.cm).toBe(3000);

    // Asset Depreciation: 10,000
    expect(pb.depreciationExpense.cm).toBe(10000);

    // Capital Interest: 5,000
    expect(pb.capitalInterestExpense.cm).toBe(5000);

    // Dividend Distribution: 15,000
    expect(pb.dividendDistribution.cm).toBe(15000);

    // Operating Net Profit = Commission CM + Daalu CM (15000) - Total Expenses (3000 + 10000 + 5000 = 18000)
    const expectedOperatingNetProfit = pb.commissionProfit.cm + 15000 - 18000;
    expect(pb.operatingNetProfit.cm).toBe(
      Number(expectedOperatingNetProfit.toFixed(2)),
    );

    // Retained profit = Operating Net Profit - Dividend (15000)
    expect(pb.netRetainedProfit.cm).toBe(
      Number((expectedOperatingNetProfit - 15000).toFixed(2)),
    );

    // 2. Fixed Asset Write-down Check (from table record)
    const tractor = result.fixedAssets?.find((a) => a.id === 'asset_tractor');
    expect(tractor).toBeDefined();
    // Loaded tractor was 960,000; after 10,000 depreciation it becomes 950,000
    expect(tractor!.currentBookValue).toBe(950000);
    expect(tractor!.accumulatedDepreciation).toBe(10000);

    // 3. Balance Sheet Equilibrium Check
    expect(result.balanceSheet).toBeDefined();
    const bs = result.balanceSheet!;
    expect(bs.assets.totalAssets).toBe(
      bs.liabilitiesAndEquity.totalCapitalAndEquity,
    );
  });
});
