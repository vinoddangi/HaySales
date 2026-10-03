import { describe, expect, it } from 'vitest';
import { PurchaseTransactionData, SaleTransactionData } from '../../models';
import type { RootState } from '../index';
import {
  selectAvailableStockPeriods,
  selectClosingStockByPeriod,
  selectClosingStockForMonth,
  selectCropClosingStock,
  selectOpeningStockForMonth,
  selectStock,
} from '../selectors/stockSelectors';
import stockReducer, {
  BASELINE_CLOSING_STOCK,
  setClosingStock,
  setStockState,
  updateStockFromTransactions,
} from './stockSlice';

describe('stockSlice & Selectors (YYYY-MM Format)', () => {
  it('initializes with baseline 2025-01 closing stock', () => {
    const state = stockReducer(undefined, { type: '@@INIT' });

    expect(state['2025-01']).toEqual(BASELINE_CLOSING_STOCK);

    const othersClosing = state['2025-01']?.Others;
    expect(othersClosing?.type).toBe('PURCHASE');
    expect(othersClosing?.category).toBe('Others');
    expect(othersClosing?.weight).toBe(0);
    expect(othersClosing?.amount).toBe(0);
  });

  it('updates closing stock for a period using setClosingStock', () => {
    const updated = stockReducer(
      undefined,
      setClosingStock({
        period: '2026-01',
        crop: {
          Tuvar: {
            id: 'closing-tuvar-2026-01',
            date: '2026-01-31',
            type: 'PURCHASE',
            category: 'Tuvar',
            weight: 5000,
            amount: 60000,
            cashPaid: 60000,
            remainingDue: 0,
          },
        },
      }),
    );

    expect(updated['2026-01']?.Tuvar?.weight).toBe(5000);
    expect(updated['2026-01']?.Tuvar?.amount).toBe(60000);
    expect(updated['2025-01']?.Others?.weight).toBe(0);
  });

  it('merges stock state using setStockState', () => {
    const updated = stockReducer(
      undefined,
      setStockState({
        '2026-02': {
          Chana: {
            id: 'closing-chana-2026-02',
            date: '2026-02-28',
            type: 'PURCHASE',
            category: 'Chana',
            weight: 2000,
            amount: 25000,
            cashPaid: 25000,
            remainingDue: 0,
          },
        },
      }),
    );

    expect(updated['2026-02']?.Chana?.weight).toBe(2000);
    expect(updated['2025-01']?.Others?.weight).toBe(0);
  });

  it('recalculates monthly closing stock from transactions using updateStockFromTransactions', () => {
    const samplePurchases: PurchaseTransactionData[] = [
      {
        id: 'p1',
        date: '2026-01-10',
        type: 'PURCHASE',
        category: 'Tuvar',
        weight: 10000,
        amount: 100000,
        cashPaid: 100000,
        remainingDue: 0,
      },
    ];
    const sampleSales: SaleTransactionData[] = [
      {
        id: 's1',
        date: '2026-01-15',
        type: 'SALE',
        category: 'Tuvar',
        customerId: 'c1',
        weight: 3000,
        amount: 36000,
        cashPaid: 36000,
        remainingDue: 0,
      },
    ];

    const updated = stockReducer(
      undefined,
      updateStockFromTransactions([...samplePurchases, ...sampleSales]),
    );

    // Tuvar closing for 2026-01
    expect(updated['2026-01']?.Tuvar?.weight).toBe(7000);
  });

  it('provides working selectors for querying closing stock and deriving opening stock by YYYY-MM', () => {
    const rootState = {
      stock: {
        '2025-01': BASELINE_CLOSING_STOCK,
        '2025-02': {
          Tuvar: {
            id: 'tuvar-1',
            date: '2025-02-28',
            type: 'PURCHASE' as const,
            category: 'Tuvar' as const,
            weight: 4000,
            amount: 48000,
            cashPaid: 48000,
            remainingDue: 0,
          },
        },
      },
    } as unknown as RootState;

    expect(selectStock(rootState)).toBe(rootState.stock);
    expect(selectAvailableStockPeriods(rootState)).toEqual([
      '2025-01',
      '2025-02',
    ]);
    expect(selectClosingStockByPeriod('2025-01')(rootState)).toEqual(
      BASELINE_CLOSING_STOCK,
    );

    // Feb 2025 opening is derived from 2025-01 closing
    expect(selectOpeningStockForMonth(2025, 2)(rootState)).toEqual(
      BASELINE_CLOSING_STOCK,
    );

    // Mar 2025 opening is derived from 2025-02 closing
    expect(selectOpeningStockForMonth(2025, 3)(rootState)).toEqual(
      rootState.stock['2025-02'],
    );

    // Closing stock selectors
    expect(selectClosingStockForMonth(2025, 2)(rootState)?.Tuvar?.weight).toBe(
      4000,
    );
    expect(selectCropClosingStock('2025-01', 'Others')(rootState)?.weight).toBe(
      0,
    );
    expect(selectCropClosingStock('2025-02', 'Tuvar')(rootState)?.weight).toBe(
      4000,
    );
    expect(
      selectCropClosingStock('2025-02', 'Chana')(rootState),
    ).toBeUndefined();
  });
});
