import { describe, expect, it } from 'vitest';
import { Transaction } from '../../types';
import { calculateCapitalAndDividends } from './capitalDividends';

describe('capitalDividends', () => {
  it('correctly categorizes cash capital interest and dividend profit distribution', () => {
    const transactions: Transaction[] = [
      {
        type: 'EXPENSE',
        category: 'Interest',
        amount: 15000,
        note: 'Vinod Capital Monthly Interest settled in cash',
      },
      {
        type: 'DIVIDEND',
        amount: 50000,
        note: 'Profit Distribution / Dividend to Partner Vinod',
        partnerName: 'Vinod',
      },
      {
        type: 'EXPENSE',
        category: 'Labor',
        amount: 12000,
        note: 'Normal labor expense',
      },
    ];

    const result = calculateCapitalAndDividends(transactions, {
      principalCapital: 1500000,
    });

    // Capital Interest (settled in cash)
    expect(result.capitalInterestCM).toBe(15000);

    // Dividends / Profit Sharing
    expect(result.dividendsPaidCM).toBe(50000);
    expect(result.newDividends).toHaveLength(1);
    expect(result.newDividends[0].amount).toBe(50000);
    expect(result.newDividends[0].partnerName).toBe('Vinod');

    // Principal capital preserved
    expect(result.principalCapital).toBe(1500000);
  });
});
