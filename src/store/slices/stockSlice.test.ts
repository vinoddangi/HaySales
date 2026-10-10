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
  setClosingStock,
  setStockState,
  updateStockFromTransactions,
} from './stockSlice';

describe('stockSlice & Selectors (YYYY-MM Format)', () => {
  it('initializes with empty stock state', () => {
    const state = stockReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({});
  });

  it('updates closing stock for a period using setClosingStock', () => {
    const updated = stockReducer(
      undefined,
      setClosingStock({
        period: '2026-08',
        crop: {
          Chana: {
            id: 'closing-chana-2026-08',
            date: '2026-08-31',
            type: 'PURCHASE',
            category: 'Chana',
            weight: 5403,
            amount: 58029.96,
            cashPaid: 58029.96,
            remainingDue: 0,
          },
        },
      }),
    );

    expect(updated['2026-08']?.Chana?.weight).toBe(5403);
    expect(updated['2026-08']?.Chana?.amount).toBe(58029.96);
  });

  it('merges stock state using setStockState', () => {
    const updated = stockReducer(
      undefined,
      setStockState({
        '2026-09': {
          Tuvar: {
            id: 'closing-tuvar-2026-09',
            date: '2026-09-30',
            type: 'PURCHASE',
            category: 'Tuvar',
            weight: 2000,
            amount: 25000,
            cashPaid: 25000,
            remainingDue: 0,
          },
        },
      }),
    );

    expect(updated['2026-09']?.Tuvar?.weight).toBe(2000);
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
    const chanaClosing = {
      Chana: {
        id: 'chana-aug-2026',
        date: '2026-08-31',
        type: 'PURCHASE' as const,
        category: 'Chana' as const,
        weight: 5403,
        amount: 58029.96,
        cashPaid: 58029.96,
        remainingDue: 0,
      },
    };
    const rootState = {
      stock: {
        '2026-08': chanaClosing,
        '2026-09': {
          Tuvar: {
            id: 'tuvar-1',
            date: '2026-09-30',
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
      '2026-08',
      '2026-09',
    ]);
    expect(selectClosingStockByPeriod('2026-08')(rootState)).toEqual(
      chanaClosing,
    );

    // Sep 2026 opening is derived from 2026-08 closing
    expect(selectOpeningStockForMonth(2026, 9)(rootState)).toEqual(
      chanaClosing,
    );

    // Oct 2026 opening is derived from 2026-09 closing
    expect(selectOpeningStockForMonth(2026, 10)(rootState)).toEqual(
      rootState.stock['2026-09'],
    );

    // Closing stock selectors
    expect(selectClosingStockForMonth(2026, 9)(rootState)?.Tuvar?.weight).toBe(
      4000,
    );
    expect(selectCropClosingStock('2026-08', 'Chana')(rootState)?.weight).toBe(
      5403,
    );
    expect(selectCropClosingStock('2026-09', 'Tuvar')(rootState)?.weight).toBe(
      4000,
    );
    expect(
      selectCropClosingStock('2026-09', 'Chana')(rootState),
    ).toBeUndefined();
  });
});
