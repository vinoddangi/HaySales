import { createSelector } from '@reduxjs/toolkit';
import {
  CustomerTransactionData,
  isCropTransaction,
  isExpenseTransaction,
  isPaymentTransaction,
  isPurchaseTransaction,
  isSaleTransaction,
  isServiceTransaction,
  OperationsTransactionData,
  Transaction,
} from '../../models';
import { customerTransactionsApiSlice } from '../api/customerTransactionsApi';
import { operationTransactionsApiSlice } from '../api/operationTransactionsApi';
import {
  selectFromDate,
  selectPreviousFromDate,
  selectPreviousToDate,
  selectToDate,
} from './timelineSelectors';

// ── Base RTK Query Selectors ─────────────────────────────────────────────────

export const selectCustomerTransactionsQuery =
  customerTransactionsApiSlice.endpoints.getCustomerTransactions.select(
    undefined,
  );

export const selectOperationTransactionsQuery =
  operationTransactionsApiSlice.endpoints.getOperationTransactions.select();

export const selectAllCustomerTransactions = createSelector(
  [selectCustomerTransactionsQuery],
  (result): CustomerTransactionData[] => result.data || [],
);

export const selectAllOperationTransactions = createSelector(
  [selectOperationTransactionsQuery],
  (result): OperationsTransactionData[] => result.data || [],
);

export const selectAllTransactions = createSelector(
  [selectAllCustomerTransactions, selectAllOperationTransactions],
  (customerTxs, operationTxs): Transaction[] => [
    ...customerTxs,
    ...operationTxs,
  ],
);

export const selectIsTransactionsLoading = createSelector(
  [selectCustomerTransactionsQuery, selectOperationTransactionsQuery],
  (custResult, opResult): boolean =>
    Boolean(custResult.isLoading || opResult.isLoading),
);

// ── Period-Filtered Transactions Selectors ───────────────────────────────────

/**
 * Returns all transactions strictly within the active timeline period [fromDate, toDate].
 */
export const selectPeriodTransactions = createSelector(
  [selectAllTransactions, selectFromDate, selectToDate],
  (transactions, fromDate, toDate): Transaction[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d >= fromDate && d <= toDate;
    });
  },
);

/**
 * Returns customer transactions strictly within the active timeline period [fromDate, toDate].
 */
export const selectPeriodCustomerTransactions = createSelector(
  [selectAllCustomerTransactions, selectFromDate, selectToDate],
  (transactions, fromDate, toDate): CustomerTransactionData[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d >= fromDate && d <= toDate;
    });
  },
);

/**
 * Returns operation transactions strictly within the active timeline period [fromDate, toDate].
 */
export const selectPeriodOperationTransactions = createSelector(
  [selectAllOperationTransactions, selectFromDate, selectToDate],
  (transactions, fromDate, toDate): OperationsTransactionData[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d >= fromDate && d <= toDate;
    });
  },
);

// ── Till-Date (Cumulative) Transactions Selectors ────────────────────────────

/**
 * Returns all transactions from the beginning of history up to the active toDate (tx.date <= toDate).
 */
export const selectTillDateTransactions = createSelector(
  [selectAllTransactions, selectToDate],
  (transactions, toDate): Transaction[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d <= toDate;
    });
  },
);

/**
 * Returns customer transactions from the beginning of history up to the active toDate (tx.date <= toDate).
 */
export const selectTillDateCustomerTransactions = createSelector(
  [selectAllCustomerTransactions, selectToDate],
  (transactions, toDate): CustomerTransactionData[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d <= toDate;
    });
  },
);

/**
 * Returns operation transactions from the beginning of history up to the active toDate (tx.date <= toDate).
 */
export const selectTillDateOperationTransactions = createSelector(
  [selectAllOperationTransactions, selectToDate],
  (transactions, toDate): OperationsTransactionData[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d <= toDate;
    });
  },
);

// ── Previous Period & Previous Till-Date Selectors ───────────────────────────

/**
 * Returns transactions strictly within the previous comparison period [previousFromDate, previousToDate].
 */
export const selectPreviousPeriodTransactions = createSelector(
  [selectAllTransactions, selectPreviousFromDate, selectPreviousToDate],
  (transactions, fromDate, toDate): Transaction[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d >= fromDate && d <= toDate;
    });
  },
);

/**
 * Returns transactions from the beginning of history up to previousToDate (tx.date <= previousToDate).
 */
export const selectPreviousTillDateTransactions = createSelector(
  [selectAllTransactions, selectPreviousToDate],
  (transactions, toDate): Transaction[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d <= toDate;
    });
  },
);

/**
 * Returns customer transactions from the beginning of history up to previousToDate (tx.date <= previousToDate).
 */
export const selectPreviousTillDateCustomerTransactions = createSelector(
  [selectAllCustomerTransactions, selectPreviousToDate],
  (transactions, toDate): CustomerTransactionData[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d <= toDate;
    });
  },
);

/**
 * Returns operation transactions from the beginning of history up to previousToDate (tx.date <= previousToDate).
 */
export const selectPreviousTillDateOperationTransactions = createSelector(
  [selectAllOperationTransactions, selectPreviousToDate],
  (transactions, toDate): OperationsTransactionData[] => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return d <= toDate;
    });
  },
);

// ── Segmented Period Selectors (by transaction type) ─────────────────────────

export const selectPeriodSalesTransactions = createSelector(
  [selectPeriodTransactions],
  (transactions) => transactions.filter(isSaleTransaction),
);

export const selectPeriodPurchasesTransactions = createSelector(
  [selectPeriodTransactions],
  (transactions) => transactions.filter(isPurchaseTransaction),
);

export const selectPeriodCropTransactions = createSelector(
  [selectPeriodTransactions],
  (transactions) => transactions.filter(isCropTransaction),
);

export const selectPeriodPaymentsTransactions = createSelector(
  [selectPeriodTransactions],
  (transactions) => transactions.filter(isPaymentTransaction),
);

export const selectPeriodServiceTransactions = createSelector(
  [selectPeriodTransactions],
  (transactions) => transactions.filter(isServiceTransaction),
);

export const selectPeriodExpenseTransactions = createSelector(
  [selectPeriodTransactions],
  (transactions) => transactions.filter(isExpenseTransaction),
);

// ── Segmented Till-Date Selectors (by transaction type) ───────────────────────

export const selectTillDateSalesTransactions = createSelector(
  [selectTillDateTransactions],
  (transactions) => transactions.filter(isSaleTransaction),
);

export const selectTillDatePurchasesTransactions = createSelector(
  [selectTillDateTransactions],
  (transactions) => transactions.filter(isPurchaseTransaction),
);

export const selectTillDateCropTransactions = createSelector(
  [selectTillDateTransactions],
  (transactions) => transactions.filter(isCropTransaction),
);

export const selectTillDatePaymentsTransactions = createSelector(
  [selectTillDateTransactions],
  (transactions) => transactions.filter(isPaymentTransaction),
);

export const selectTillDateServiceTransactions = createSelector(
  [selectTillDateTransactions],
  (transactions) => transactions.filter(isServiceTransaction),
);

export const selectTillDateExpenseTransactions = createSelector(
  [selectTillDateTransactions],
  (transactions) => transactions.filter(isExpenseTransaction),
);

// ── Parameterized Customer Transaction Selectors ─────────────────────────────

/**
 * Returns all historical transactions for a specific customer.
 */
export const selectCustomerTransactionsByCustomerId = (customerId: string) =>
  createSelector([selectAllCustomerTransactions], (transactions) =>
    transactions.filter((tx) => tx.customerId === customerId),
  );

/**
 * Returns period-filtered transactions for a specific customer.
 */
export const selectPeriodTransactionsByCustomerId = (customerId: string) =>
  createSelector([selectPeriodCustomerTransactions], (transactions) =>
    transactions.filter((tx) => tx.customerId === customerId),
  );

/**
 * Returns cumulative till-date transactions for a specific customer.
 */
export const selectTillDateTransactionsByCustomerId = (customerId: string) =>
  createSelector([selectTillDateCustomerTransactions], (transactions) =>
    transactions.filter((tx) => tx.customerId === customerId),
  );

/**
 * Returns custom date-range filtered transactions.
 */
export const selectTransactionsByDateRange = (
  startDate: string,
  endDate: string,
) =>
  createSelector([selectAllTransactions], (transactions) => {
    const start = startDate ? startDate.slice(0, 10) : '';
    const end = endDate ? endDate.slice(0, 10) : '9999-99-99';
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = tx.date.slice(0, 10);
      return (!start || d >= start) && (!end || d <= end);
    });
  });
