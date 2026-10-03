import { createSelector } from '@reduxjs/toolkit';
import { formatYearMonth } from '../../business/stockBusiness';
import type { RootState } from '../index';
import type {
  CustomerBalanceRecord,
  CustomerOutstandingState,
  MonthlyCustomerOutstandingState,
} from '../slices/customerOutstandingSlice';

// ── Base Customer Outstanding Input Selector ─────────────────────────────────

export const selectCustomerOutstandingState = (
  state: RootState,
): CustomerOutstandingState => state.customerOutstanding;

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
