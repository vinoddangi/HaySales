import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import { calculateCustomerLedgerSummary } from './ledgerBusiness';

describe('ledgerBusiness', () => {
  it('calculates customer ledger summary correctly', () => {
    const transactions: Transaction[] = [
      {
        type: 'SALE',
        amount: 8000,
        cashPaid: 3000,
        remainingDue: 5000,
      },
      {
        type: 'SERVICE',
        amount: 2000,
        cashPaid: 2000,
        remainingDue: 0,
      },
      {
        type: 'PAYMENT',
        paymentAmount: 2000,
      },
    ];

    const summary = calculateCustomerLedgerSummary(transactions);
    expect(summary.totalBilled).toBe(10000);
    expect(summary.totalPaid).toBe(7000); // 3000 cash + 2000 cash + 2000 payment
    expect(summary.currentBalance).toBe(3000); // 5000 remaining - 2000 payment
    expect(summary.transactionCount).toBe(3);
  });
});
