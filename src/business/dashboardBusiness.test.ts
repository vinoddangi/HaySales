import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import {
  calculateDashboardMetrics,
  calculateItemBreakdowns,
  filterTransactionsByPeriod,
} from './dashboardBusiness';

describe('dashboardBusiness', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'SALE',
      item: 'Chana',
      weightKg: 100,
      amount: 5000,
      cashPaid: 3000,
      remainingDue: 2000,
      date: '2026-09-10T10:00:00Z',
    },
    {
      id: 'tx-2',
      type: 'SALE',
      item: 'Gavatri',
      weightKg: 200,
      amount: 6000,
      cashPaid: 6000,
      remainingDue: 0,
      date: '2026-09-15T10:00:00Z',
    },
    {
      id: 'tx-3',
      type: 'PURCHASE',
      item: 'Chana',
      weightKg: 500,
      amount: 15000,
      cashPaid: 15000,
      date: '2026-09-01T10:00:00Z',
    },
    {
      id: 'tx-4',
      type: 'EXPENSE',
      amount: 1000,
      date: '2026-09-05T10:00:00Z',
    },
    {
      id: 'tx-5',
      type: 'PAYMENT',
      paymentAmount: 1500,
      date: '2026-09-12T10:00:00Z',
    },
    {
      id: 'tx-old',
      type: 'SALE',
      item: 'Tuvar',
      weightKg: 50,
      amount: 1500,
      cashPaid: 1500,
      date: '2026-05-10T10:00:00Z',
    },
  ];

  it('filters transactions accurately by currentMonth', () => {
    const refDate = new Date('2026-09-19T00:00:00Z');
    const filtered = filterTransactionsByPeriod(
      mockTransactions,
      'currentMonth',
      8,
      refDate,
    );
    expect(filtered.length).toBe(5);
    expect(filtered.find((t) => t.id === 'tx-old')).toBeUndefined();
  });

  it('filters transactions by customMonth', () => {
    const refDate = new Date('2026-09-19T00:00:00Z');
    const filtered = filterTransactionsByPeriod(
      mockTransactions,
      'customMonth',
      4, // May
      refDate,
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('tx-old');
  });

  it('calculates dashboard metrics properly', () => {
    const septemberTx = mockTransactions.slice(0, 5);
    const metrics = calculateDashboardMetrics(septemberTx);

    expect(metrics.totalSalesAmount).toBe(11000);
    expect(metrics.totalSalesWeightKg).toBe(300);
    expect(metrics.salesCount).toBe(2);
    expect(metrics.salesOnCash).toBe(9000);
    expect(metrics.salesOnCredit).toBe(2000);
    expect(metrics.totalPurchaseAmount).toBe(15000);
    expect(metrics.totalPurchaseWeightKg).toBe(500);
    expect(metrics.purchasesCount).toBe(1);
    expect(metrics.totalExpenseAmount).toBe(1000);
    expect(metrics.paymentsReceived).toBe(1500);
    expect(metrics.totalCashIn).toBe(10500);
    expect(metrics.netCashflow).toBe(10500 - (15000 + 1000));
  });

  it('calculates item breakdown properly', () => {
    const septemberTx = mockTransactions.slice(0, 5);
    const breakdowns = calculateItemBreakdowns(mockTransactions, septemberTx);

    const chana = breakdowns.find((b) => b.item === 'Chana');
    expect(chana).toBeDefined();
    expect(chana?.amount).toBe(5000);
    expect(chana?.weightKg).toBe(100);
    expect(chana?.stockKg).toBe(400); // 500 purchased - 100 sold
    expect(chana?.avgBuyRate).toBe(30); // 15000 / 500
  });
});
