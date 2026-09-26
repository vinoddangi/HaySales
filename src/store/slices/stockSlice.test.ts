import { describe, expect, it } from 'vitest';
import type { RootState } from '../index';
import {
  selectAvailableStockDates,
  selectCropOpeningStock,
  selectOpeningStockByDate,
  selectStock,
} from '../selectors/inputselectors';
import stockReducer, { INITIAL_STOCK, setOpeningStock } from './stockSlice';

describe('stockSlice & Selectors', () => {
  it('initializes with default date (2026-01-01) and initial baseline crop stock', () => {
    const state = stockReducer(undefined, { type: '@@INIT' });

    expect(state['2026-01-01']).toEqual(INITIAL_STOCK);

    const others = state['2026-01-01']?.Others;
    expect(others?.type).toBe('PURCHASE');
    expect(others?.category).toBe('Others');
    expect(others?.weight).toBe(13528);
    expect(others?.amount).toBe(141097.04);
    expect(others?.date).toBe('2026-01-01');
  });

  it('updates opening stock for a date using setOpeningStock', () => {
    const updated = stockReducer(
      undefined,
      setOpeningStock({
        date: '2026-02-01',
        crop: {
          Tuvar: {
            id: 'opening-tuvar-2026-02-01',
            date: '2026-02-01',
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

    expect(updated['2026-02-01']?.Tuvar?.weight).toBe(5000);
    expect(updated['2026-02-01']?.Tuvar?.amount).toBe(60000);
    expect(updated['2026-01-01']?.Others?.weight).toBe(13528);
  });

  it('provides working selectors for querying opening stock', () => {
    const rootState = {
      stock: {
        '2026-01-01': INITIAL_STOCK,
        '2026-02-01': {
          Tuvar: {
            id: 'tuvar-2',
            date: '2026-02-01',
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
    expect(selectAvailableStockDates(rootState)).toEqual([
      '2026-01-01',
      '2026-02-01',
    ]);
    expect(selectOpeningStockByDate('2026-01-01')(rootState)).toEqual(
      INITIAL_STOCK,
    );
    expect(
      selectCropOpeningStock('2026-01-01', 'Others')(rootState)?.weight,
    ).toBe(13528);
    expect(
      selectCropOpeningStock('2026-02-01', 'Tuvar')(rootState)?.weight,
    ).toBe(4000);
    expect(
      selectCropOpeningStock('2026-02-01', 'Chana')(rootState),
    ).toBeUndefined();
  });
});
