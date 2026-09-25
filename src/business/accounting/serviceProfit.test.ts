import { describe, expect, it } from 'vitest';
import { Transaction } from '../../types';
import { calculateServiceProfit } from './serviceProfit';

describe('serviceProfit', () => {
  it('calculates service billing, fuel/machinery expense, and net service profit', () => {
    const transactions: Transaction[] = [
      {
        type: 'SERVICE',
        amount: 25000,
        category: 'Tractor Service',
      },
      {
        type: 'SERVICE',
        amount: 15000,
        category: 'Pickup Transport',
      },
      {
        type: 'EXPENSE',
        amount: 8000,
        category: 'Fuel',
        note: 'Diesel for tractor',
      },
      {
        type: 'EXPENSE',
        amount: 2000,
        category: 'Fuel',
        note: 'Diesel for pickup',
      },
      {
        type: 'EXPENSE',
        amount: 5000,
        category: 'Labor',
        note: 'General farm labor', // Not machinery fuel
      },
    ];

    const result = calculateServiceProfit(transactions);

    // Service income: 25000 + 15000 = 40000
    expect(result.serviceIncomeCM).toBe(40000);

    // Direct service fuel expenses: 8000 + 2000 = 10000
    expect(result.serviceExpensesCM).toBe(10000);

    // Net service profit: 40000 - 10000 = 30000
    expect(result.netServiceProfitCM).toBe(30000);
  });
});
