import { createSelector } from '@reduxjs/toolkit';
import {
  formatYearMonth,
  getOpeningStockForMonth,
} from '../../business/stockBusiness';
import type { CropCategory, PurchaseTransactionData } from '../../models';
import type { RootState } from '../index';
import type { CropRecord, StockState } from '../slices/stockSlice';

// ── Base Stock Input Selector ───────────────────────────────────────────────

export const selectStock = (state: RootState): StockState => state.stock;

// ── Stock Memoized Selectors (Reselect / RTK createSelector) ───────────────

export const selectAvailableStockPeriods = createSelector(
  [selectStock],
  (stock): string[] => Object.keys(stock),
);

export const selectClosingStockByPeriod = (period: string) =>
  createSelector(
    [selectStock],
    (stock): CropRecord | undefined => stock[period],
  );

export const selectOpeningStockForMonth = (year: number, month: number) =>
  createSelector([selectStock], (stock): CropRecord =>
    getOpeningStockForMonth(stock, year, month),
  );

export const selectClosingStockForMonth = (year: number, month: number) => {
  const periodKey = formatYearMonth(year, month);
  return createSelector(
    [selectStock],
    (stock): CropRecord | undefined => stock[periodKey],
  );
};

export const selectCropClosingStock = (period: string, crop: CropCategory) =>
  createSelector(
    [selectStock],
    (stock): PurchaseTransactionData | undefined => stock[period]?.[crop],
  );
