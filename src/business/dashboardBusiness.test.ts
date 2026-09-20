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
      id: 'tx-6',
      type: 'SERVICE',
      item: 'Pickup',
      amount: 2000,
      cashPaid: 2000,
      date: '2026-09-14T10:00:00Z',
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

  it('filters transactions accurately by month', () => {
    const refDate = new Date('2026-09-19T00:00:00Z');
    const filtered = filterTransactionsByPeriod(
      mockTransactions,
      'month',
      8, // September
      refDate,
    );
    expect(filtered.length).toBe(6);
    expect(filtered.find((t) => t.id === 'tx-old')).toBeUndefined();
  });

  it('filters transactions by custom selected month', () => {
    const refDate = new Date('2026-09-19T00:00:00Z');
    const filtered = filterTransactionsByPeriod(
      mockTransactions,
      'month',
      4, // May
      refDate,
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('tx-old');
  });

  it('calculates dashboard metrics properly', () => {
    const septemberTx = mockTransactions.slice(0, 6);
    const metrics = calculateDashboardMetrics(septemberTx);

    expect(metrics.totalSalesAmount).toBe(11000);
    expect(metrics.totalSalesWeightKg).toBe(300);
    expect(metrics.salesCount).toBe(2);
    expect(metrics.salesOnCash).toBe(9000);
    expect(metrics.salesOnCredit).toBe(2000);
    expect(metrics.servicesReceived).toBe(2000);
    expect(metrics.servicesCount).toBe(1);
    expect(metrics.totalPurchaseAmount).toBe(15000);
    expect(metrics.totalPurchaseWeightKg).toBe(500);
    expect(metrics.purchasesCount).toBe(1);
    expect(metrics.totalExpenseAmount).toBe(1000);
    expect(metrics.paymentsReceived).toBe(1500);
    expect(metrics.paymentsCount).toBe(1);
    expect(metrics.totalCashIn).toBe(12500); // 9000 cash sales + 2000 service + 1500 payments
    expect(metrics.totalCashOut).toBe(16000); // 15000 purchase cash + 1000 expense cash
    expect(metrics.purchaseOnCash).toBe(15000);
    expect(metrics.expensesOnCash).toBe(1000);
    expect(metrics.netCashflow).toBe(12500 - 16000); // -3500
  });

  it('includes Interest in dashboard expenses calculation', () => {
    const txWithInterest: Transaction[] = [
      {
        id: 'tx-exp-1',
        type: 'EXPENSE',
        expenseCategory: 'Fuel',
        amount: 2000,
        cashPaid: 2000,
        date: '2026-09-05T10:00:00Z',
      },
      {
        id: 'tx-exp-int',
        type: 'EXPENSE',
        expenseCategory: 'Interest',
        amount: 7000,
        cashPaid: 7000,
        date: '2026-09-05T10:00:00Z',
      },
    ];

    const metrics = calculateDashboardMetrics(txWithInterest);
    expect(metrics.totalExpenseAmount).toBe(9000); // 2000 Fuel + 7000 Interest
    expect(metrics.expensesCount).toBe(2);
    expect(metrics.expensesOnCash).toBe(9000);
  });

  it('filters transactions with Firestore timestamps and date objects correctly', () => {
    const firestoreTxs: Transaction[] = [
      {
        id: 'tx-ts-1',
        type: 'SERVICE',
        item: 'Pickup',
        amount: 80000,
        date: { seconds: 1779970800 } as any, // May 2026
      },
      {
        id: 'tx-ts-2',
        type: 'EXPENSE',
        expenseCategory: 'Fuel',
        amount: 51100,
        date: { _seconds: 1779970800 } as any, // May 2026
      },
      {
        id: 'tx-ts-3',
        type: 'EXPENSE',
        expenseCategory: 'Fuel',
        amount: 15000,
        date: '15/05/2026, 10:00:00', // May 2026 string format
      },
    ];

    const refDate = new Date('2026-09-19T00:00:00Z');
    const filteredMay = filterTransactionsByPeriod(
      firestoreTxs,
      'month',
      4,
      refDate,
    );
    expect(filteredMay.length).toBe(3);

    const metrics = calculateDashboardMetrics(filteredMay);
    expect(metrics.servicesReceived).toBe(80000);
    expect(metrics.totalExpenseAmount).toBe(66100);
    expect(metrics.totalCashIn).toBe(80000);
    expect(metrics.totalCashOut).toBe(66100);
    expect(metrics.netCashflow).toBe(80000 - 66100);
  });

  it('calculates item breakdown properly', () => {
    const septemberTx = mockTransactions.slice(0, 6);
    const breakdowns = calculateItemBreakdowns(mockTransactions, septemberTx, {
      includeOpeningStock: false,
    });

    const chana = breakdowns.find((b) => b.item === 'Chana');
    expect(chana).toBeDefined();
    expect(chana?.amount).toBe(5000);
    expect(chana?.weightKg).toBe(100);
    expect(chana?.stockKg).toBe(400); // 500 purchased - 100 sold
    expect(chana?.avgBuyRate).toBe(30); // 15000 / 500

    // Ensure SERVICE (Pickup) is excluded from Crop / Item Breakdown
    const serviceItem = breakdowns.find((b) => b.item === 'Pickup');
    expect(serviceItem).toBeUndefined();
  });

  it('calculates item breakdown with opening stock and current month purchases', () => {
    // January 2026 transactions: baseline opening stock 13528 kg @ 141097.04 (rate ~10.43)
    const janTx: Transaction[] = [
      {
        id: 'tx-jan-p',
        type: 'PURCHASE',
        item: 'Others',
        weightKg: 10000,
        amount: 90000, // 9.0/kg
        date: '2026-01-10T10:00:00Z',
      },
      {
        id: 'tx-jan-s',
        type: 'SALE',
        item: 'Others',
        weightKg: 5000,
        amount: 60000, // 12.0/kg
        date: '2026-01-15T10:00:00Z',
      },
    ];

    const breakdowns = calculateItemBreakdowns(janTx, janTx, {
      mode: 'month',
      selectedMonth: 0,
      year: 2026,
    });

    const others = breakdowns.find((b) => b.item === 'Others');
    expect(others).toBeDefined();
    expect(others?.amount).toBe(60000);
    expect(others?.weightKg).toBe(5000);
    // Total Available Stock = 13528 (opening) + 10000 (purchase) = 23528 kg
    // Remaining Stock = 23528 - 5000 (sold) = 18528 kg
    expect(others?.stockKg).toBe(18528);
    // Total Amount = 141097.04 (opening) + 90000 (purchase) = 231097.04
    // Avg Buy Rate = 231097.04 / 23528 = 9.822...
    expect(others?.avgBuyRate).toBeCloseTo(231097.04 / 23528, 2);
  });
});
