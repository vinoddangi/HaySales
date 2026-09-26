import { describe, expect, it } from 'vitest';
import { PurchaseTransactionData, SaleTransactionData } from '../models';
import {
  BASELINE_2025_CLOSING_STOCK,
  calculateMonthlyStockFromTransactions,
  extractChronologicalMonths,
  formatYearMonth,
  getLastDayOfMonth,
  getOpeningStockForMonth,
  getPreviousYearMonth,
} from './stockBusiness';

describe('stockBusiness - Monthly Stock Calculations & YYYY-MM Rollovers', () => {
  it('correctly calculates last days and formats year-month', () => {
    expect(getLastDayOfMonth(2026, 1)).toBe(31);
    expect(getLastDayOfMonth(2026, 2)).toBe(28);
    expect(getLastDayOfMonth(2024, 2)).toBe(29); // leap year
    expect(getLastDayOfMonth(2026, 4)).toBe(30);

    expect(formatYearMonth(2026, 1)).toBe('2026-01');
    expect(formatYearMonth(2026, 11)).toBe('2026-11');
  });

  it('determines the previous month YYYY-MM key correctly', () => {
    expect(getPreviousYearMonth(2026, 1)).toBe('2025-12');
    expect(getPreviousYearMonth(2026, 2)).toBe('2026-01');
    expect(getPreviousYearMonth(2026, 3)).toBe('2026-02');
  });

  it('extracts chronological unique months from transactions', () => {
    const txs = [
      { date: '2026-03-15T00:00:00.000Z' },
      { date: '2026-01-20T00:00:00.000Z' },
      { date: '2026-02-10T00:00:00.000Z' },
    ] as any;

    const months = extractChronologicalMonths(txs);
    expect(months).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('initializes with baseline 2025-12 closing stock', () => {
    const stockState = calculateMonthlyStockFromTransactions([]);

    expect(stockState['2025-12']).toEqual(BASELINE_2025_CLOSING_STOCK);
    expect(stockState['2025-12']?.Others?.weight).toBe(13528);
    expect(stockState['2025-12']?.Others?.amount).toBe(141097.04);

    // Opening stock for Jan 2026 is derived from 2025-12 closing stock
    const janOpening = getOpeningStockForMonth(stockState, 2026, 1);
    expect(janOpening).toEqual(BASELINE_2025_CLOSING_STOCK);
  });

  it('calculates continuous monthly closing stocks in YYYY-MM format', () => {
    const samplePurchases: PurchaseTransactionData[] = [
      // January purchase
      {
        id: 'p1',
        date: '2026-01-10',
        type: 'PURCHASE',
        category: 'Tuvar',
        weight: 10000,
        amount: 100000, // rate 10
        cashPaid: 100000,
        remainingDue: 0,
      },
      // February purchase
      {
        id: 'p2',
        date: '2026-02-05',
        type: 'PURCHASE',
        category: 'Tuvar',
        weight: 5000,
        amount: 60000, // rate 12
        cashPaid: 60000,
        remainingDue: 0,
      },
    ];

    const sampleSales: SaleTransactionData[] = [
      // January sales
      {
        id: 's1',
        date: '2026-01-15',
        type: 'SALE',
        category: 'Others',
        customerId: 'c1',
        weight: 3528,
        amount: 45000,
        cashPaid: 45000,
        remainingDue: 0,
      },
      {
        id: 's2',
        date: '2026-01-20',
        type: 'SALE',
        category: 'Tuvar',
        customerId: 'c2',
        weight: 4000,
        amount: 50000,
        cashPaid: 50000,
        remainingDue: 0,
      },
      // February sale
      {
        id: 's3',
        date: '2026-02-20',
        type: 'SALE',
        category: 'Tuvar',
        customerId: 'c3',
        weight: 8000,
        amount: 110000,
        cashPaid: 110000,
        remainingDue: 0,
      },
    ];

    const stockState = calculateMonthlyStockFromTransactions([
      ...samplePurchases,
      ...sampleSales,
    ]);

    // Baseline closing: 2025-12
    expect(stockState['2025-12']?.Others?.weight).toBe(13528);

    // Jan 2026 opening (from 2025-12)
    const janOpening = getOpeningStockForMonth(stockState, 2026, 1);
    expect(janOpening.Others?.weight).toBe(13528);
    expect(janOpening.Tuvar).toBeUndefined();

    // Jan 2026 closing ('2026-01'):
    // Others: 13528 - 3528 sold = 10000 kg remaining
    const janOthersClosing = stockState['2026-01']?.Others;
    expect(janOthersClosing?.weight).toBe(10000);
    expect(janOthersClosing?.amount).toBeCloseTo(104300, -2);

    // Tuvar in Jan: 10000 bought @ 10, 4000 sold -> 6000 kg closing @ 10 = 60000
    const janTuvarClosing = stockState['2026-01']?.Tuvar;
    expect(janTuvarClosing?.weight).toBe(6000);
    expect(janTuvarClosing?.amount).toBe(60000);

    // Feb 2026 opening is taken directly from 2026-01 closing
    const febOpening = getOpeningStockForMonth(stockState, 2026, 2);
    expect(febOpening.Others?.weight).toBe(10000);
    expect(febOpening.Tuvar?.weight).toBe(6000);

    // Feb 2026 closing ('2026-02'):
    // Available: 6000 + 5000 = 11000 kg @ 120000
    // Sold: 8000 kg
    // Closing: 3000 kg @ (120000/11000) ≈ 32727.27
    const febTuvarClosing = stockState['2026-02']?.Tuvar;
    expect(febTuvarClosing?.weight).toBe(3000);
    expect(febTuvarClosing?.amount).toBeCloseTo(32727.27, 0);

    // March 2026 opening is taken directly from 2026-02 closing
    const marchOpening = getOpeningStockForMonth(stockState, 2026, 3);
    expect(marchOpening.Tuvar?.weight).toBe(3000);
  });
});
