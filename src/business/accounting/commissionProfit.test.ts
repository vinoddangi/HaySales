import { describe, expect, it } from 'vitest';
import { Transaction } from '../../types';
import { calculateCommissionProfit } from './commissionProfit';

describe('commissionProfit', () => {
  it('calculates weighted cost, closing stock, and gross commission correctly', () => {
    const openingStock = {
      weightKg: 20000,
      rate: 10.0,
      amount: 200000,
    };

    const transactions: Transaction[] = [
      {
        type: 'PURCHASE',
        weightKg: 30000,
        amount: 360000, // rate = 12.0
      },
      {
        type: 'SALE',
        weightKg: 40000,
        amount: 600000, // rate = 15.0
      },
    ];

    const result = calculateCommissionProfit(transactions, openingStock);

    // Total stock: 20000 + 30000 = 50000 kg, amount = 200000 + 360000 = 560000, weighted rate = 11.20
    expect(result.totalStock.weightKg).toBe(50000);
    expect(result.totalStock.amount).toBe(560000);
    expect(result.totalStock.weightedRate).toBe(11.2);

    // Closing stock: 50000 - 40000 = 10000 kg @ 11.20 = 112000
    expect(result.closingStock.weightKg).toBe(10000);
    expect(result.closingStock.rate).toBe(11.2);
    expect(result.closingStock.amount).toBe(112000);

    // Gross Commission = Sales Amount (600,000) - COGS (40,000 * 11.2 = 448,000) = 152,000
    expect(result.grossCommissionCM).toBe(152000);
  });
});
