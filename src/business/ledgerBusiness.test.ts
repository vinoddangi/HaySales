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

  it('handles payment with settlement discount', () => {
    const transactions: Transaction[] = [
      {
        type: 'SALE',
        amount: 10000,
        cashPaid: 0,
        remainingDue: 10000,
      },
      {
        type: 'PAYMENT',
        paymentAmount: 9500,
        discount: 500,
      },
    ];

    const summary = calculateCustomerLedgerSummary(transactions);
    expect(summary.totalBilled).toBe(10000);
    expect(summary.totalPaid).toBe(9500);
    expect(summary.currentBalance).toBe(0); // 10000 - 9500 paid - 500 discount = 0
  });
});
