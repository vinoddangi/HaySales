import { createSelector } from '@reduxjs/toolkit';
import type { CropCategory, PurchaseTransactionData } from '../../models';
import type { RootState } from '../index';
import type { CropRecord, StockState } from '../slices/stockSlice';

// ── Base Input Selector ─────────────────────────────────────────────────────

export const selectStock = (state: RootState): StockState => state.stock;

// ── Memoized Selectors (Reselect / RTK createSelector) ──────────────────────

export const selectAvailableStockDates = createSelector(
  [selectStock],
  (stock): string[] => Object.keys(stock),
);

export const selectOpeningStockByDate = (date: string) =>
  createSelector([selectStock], (stock): CropRecord | undefined => stock[date]);

export const selectCropOpeningStock = (date: string, crop: CropCategory) =>
  createSelector(
    [selectStock],
    (stock): PurchaseTransactionData | undefined => stock[date]?.[crop],
  );
