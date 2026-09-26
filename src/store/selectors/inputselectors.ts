import { createSelector } from '@reduxjs/toolkit';
import {
  formatYearMonth,
  getOpeningStockForMonth,
} from '../../business/stockBusiness';
import type { CropCategory, PurchaseTransactionData } from '../../models';
import type { RootState } from '../index';
import type {
  CustomerBalanceRecord,
  CustomerOutstandingState,
  MonthlyCustomerOutstandingState,
} from '../slices/customerOutstandingSlice';
import type { CropRecord, StockState } from '../slices/stockSlice';

// ── Base Input Selectors ────────────────────────────────────────────────────

export const selectStock = (state: RootState): StockState => state.stock;

export const selectCustomerOutstandingState = (
  state: RootState,
): CustomerOutstandingState => state.customerOutstanding;

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

// ── Customer Outstanding Memoized Selectors ─────────────────────────────────

export const selectAvailableOutstandingPeriods = createSelector(
  [selectCustomerOutstandingState],
  (outstandings): string[] => Object.keys(outstandings),
);

export const selectCustomerOutstandingForPeriod = (period: string) =>
  createSelector(
    [selectCustomerOutstandingState],
    (outstandings): MonthlyCustomerOutstandingState | undefined =>
      outstandings[period],
  );

export const selectCustomerOutstandingForMonth = (
  year: number,
  month: number,
) => {
  const periodKey = formatYearMonth(year, month);
  return createSelector(
    [selectCustomerOutstandingState],
    (outstandings): MonthlyCustomerOutstandingState | undefined =>
      outstandings[periodKey],
  );
};

export const selectCustomerBalanceForPeriod = (
  customerId: string,
  period: string,
) =>
  createSelector(
    [selectCustomerOutstandingState],
    (outstandings): CustomerBalanceRecord | undefined =>
      outstandings[period]?.byCustomer[customerId],
  );
