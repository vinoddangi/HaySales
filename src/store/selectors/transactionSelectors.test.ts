import { describe, expect, it } from 'vitest';
import {
  CustomerTransactionData,
  OperationsTransactionData,
} from '../../models';
import type { RootState } from '../index';
import {
  selectAllCustomerTransactions,
  selectAllOperationTransactions,
  selectAllTransactions,
  selectCustomerTransactionsByCustomerId,
  selectIsTransactionsLoading,
  selectPeriodCropTransactions,
  selectPeriodCustomerTransactions,
  selectPeriodExpenseTransactions,
  selectPeriodOperationTransactions,
  selectPeriodPaymentsTransactions,
  selectPeriodPurchasesTransactions,
  selectPeriodSalesTransactions,
  selectPeriodServiceTransactions,
  selectPeriodTransactions,
  selectPeriodTransactionsByCustomerId,
  selectPreviousPeriodTransactions,
  selectPreviousTillDateTransactions,
  selectTillDateCropTransactions,
  selectTillDateCustomerTransactions,
  selectTillDateExpenseTransactions,
  selectTillDateOperationTransactions,
  selectTillDatePaymentsTransactions,
  selectTillDatePurchasesTransactions,
  selectTillDateSalesTransactions,
  selectTillDateServiceTransactions,
  selectTillDateTransactions,
  selectTillDateTransactionsByCustomerId,
  selectTransactionsByDateRange,
} from './transactionSelectors';

// Sample mock transactions
const mockCustomerTransactions: CustomerTransactionData[] = [
  {
    id: 'tx-c1',
    date: '2026-03-10T10:00:00.000Z',
    type: 'SALE',
    category: 'Tuvar',
    customerId: 'cust-1',
    customerName: 'Ramesh Patel',
    weight: 500,
    amount: 15000,
    cashPaid: 0,
    remainingDue: 15000,
  },
  {
    id: 'tx-c2',
    date: '2026-03-20T10:00:00.000Z',
    type: 'SERVICE',
    category: 'Pickup',
    customerId: 'cust-2',
    customerName: 'Suresh Kumar',
    amount: 4000,
    cashPaid: 0,
    remainingDue: 4000,
  },
  {
    id: 'tx-c3',
    date: '2026-03-25T10:00:00.000Z',
    type: 'PAYMENT',
    customerId: 'cust-1',
    customerName: 'Ramesh Patel',
    amount: 10000,
    cashPaid: 10000,
    remainingDue: 0,
  },
  {
    id: 'tx-c4',
    date: '2026-02-15T10:00:00.000Z',
    type: 'SALE',
    category: 'Chana',
    customerId: 'cust-1',
    customerName: 'Ramesh Patel',
    weight: 200,
    amount: 6000,
    cashPaid: 0,
    remainingDue: 6000,
  },
  {
    id: 'tx-c5',
    date: '2026-04-05T10:00:00.000Z',
    type: 'SALE',
    category: 'Tuvar',
    customerId: 'cust-3',
    customerName: 'Amit Shah',
    weight: 100,
    amount: 3000,
    cashPaid: 0,
    remainingDue: 3000,
  },
];

const mockOperationTransactions: OperationsTransactionData[] = [
  {
    id: 'tx-o1',
    date: '2026-03-12T10:00:00.000Z',
    type: 'EXPENSE',
    category: 'Fuel',
    amount: 2500,
    cashPaid: 2500,
    remainingDue: 0,
    vendorName: 'Fuel Station',
  },
  {
    id: 'tx-o2',
    date: '2026-03-18T10:00:00.000Z',
    type: 'PURCHASE',
    category: 'Tuvar',
    weight: 300,
    amount: 9000,
    cashPaid: 9000,
    remainingDue: 0,
    vendorName: 'Mandi Trader',
  },
  {
    id: 'tx-o3',
    date: '2026-02-20T10:00:00.000Z',
    type: 'EXPENSE',
    category: 'Labor',
    amount: 1500,
    cashPaid: 1500,
    remainingDue: 0,
    vendorName: 'Labor Contractor',
  },
];

const createMockRootState = (
  custData: CustomerTransactionData[] = mockCustomerTransactions,
  opData: OperationsTransactionData[] = mockOperationTransactions,
  year = 2026,
  month = 2, // March (0-indexed)
  filterMode: 'month' | 'ytd' | 'all' = 'month',
  isLoading = false,
): RootState => {
  return {
    timeline: {
      selectedYear: year,
      selectedMonth: month,
      filterMode,
    },
    api: {
      queries: {
        'getCustomerTransactions(undefined)': {
          status: isLoading ? 'pending' : 'fulfilled',
          data: custData,
          isLoading,
        },
        'getOperationTransactions(undefined)': {
          status: isLoading ? 'pending' : 'fulfilled',
          data: opData,
          isLoading,
        },
      },
    },
  } as unknown as RootState;
};

describe('transactionSelectors', () => {
  describe('base query selectors', () => {
    it('returns all customer, operation, and combined transactions', () => {
      const state = createMockRootState();
      expect(selectAllCustomerTransactions(state)).toEqual(
        mockCustomerTransactions,
      );
      expect(selectAllOperationTransactions(state)).toEqual(
        mockOperationTransactions,
      );
      expect(selectAllTransactions(state)).toEqual([
        ...mockCustomerTransactions,
        ...mockOperationTransactions,
      ]);
      expect(selectIsTransactionsLoading(state)).toBe(false);
    });

    it('handles loading state correctly', () => {
      const state = createMockRootState(
        mockCustomerTransactions,
        mockOperationTransactions,
        2026,
        2,
        'month',
        true,
      );
      expect(selectIsTransactionsLoading(state)).toBe(true);
    });

    it('falls back to empty array if query data is missing', () => {
      const emptyState = {
        timeline: { selectedYear: 2026, selectedMonth: 2, filterMode: 'month' },
        api: { queries: {} },
      } as unknown as RootState;

      expect(selectAllCustomerTransactions(emptyState)).toEqual([]);
      expect(selectAllOperationTransactions(emptyState)).toEqual([]);
      expect(selectAllTransactions(emptyState)).toEqual([]);
    });
  });

  describe('period filtered transactions (March 2026: 2026-03-01 to 2026-03-31)', () => {
    it('filters customer and operation transactions strictly within March 2026', () => {
      const state = createMockRootState(
        mockCustomerTransactions,
        mockOperationTransactions,
        2026,
        2, // March
        'month',
      );

      const periodTxs = selectPeriodTransactions(state);
      expect(periodTxs.map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c2',
        'tx-c3',
        'tx-o1',
        'tx-o2',
      ]);

      const periodCustTxs = selectPeriodCustomerTransactions(state);
      expect(periodCustTxs.map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c2',
        'tx-c3',
      ]);

      const periodOpTxs = selectPeriodOperationTransactions(state);
      expect(periodOpTxs.map((t) => t.id)).toEqual(['tx-o1', 'tx-o2']);
    });
  });

  describe('till-date (cumulative) transactions (up to 2026-03-31)', () => {
    it('includes all transactions up to the end of March 2026, excluding April 2026', () => {
      const state = createMockRootState(
        mockCustomerTransactions,
        mockOperationTransactions,
        2026,
        2,
        'month',
      );

      const tillDateTxs = selectTillDateTransactions(state);
      expect(tillDateTxs.map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c2',
        'tx-c3',
        'tx-c4',
        'tx-o1',
        'tx-o2',
        'tx-o3',
      ]);
      expect(tillDateTxs.some((t) => t.id === 'tx-c5')).toBe(false); // April excluded

      const tillDateCustTxs = selectTillDateCustomerTransactions(state);
      expect(tillDateCustTxs.map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c2',
        'tx-c3',
        'tx-c4',
      ]);

      const tillDateOpTxs = selectTillDateOperationTransactions(state);
      expect(tillDateOpTxs.map((t) => t.id)).toEqual([
        'tx-o1',
        'tx-o2',
        'tx-o3',
      ]);
    });
  });

  describe('previous period & previous till-date transactions (February 2026)', () => {
    it('selects transactions for previous comparison month (Feb 2026)', () => {
      const state = createMockRootState(
        mockCustomerTransactions,
        mockOperationTransactions,
        2026,
        2, // March -> Prev is Feb
        'month',
      );

      const prevPeriodTxs = selectPreviousPeriodTransactions(state);
      expect(prevPeriodTxs.map((t) => t.id)).toEqual(['tx-c4', 'tx-o3']);

      const prevTillDateTxs = selectPreviousTillDateTransactions(state);
      expect(prevTillDateTxs.map((t) => t.id)).toEqual(['tx-c4', 'tx-o3']);
    });
  });

  describe('segmented transaction type selectors (Period & Till-Date)', () => {
    const state = createMockRootState();

    it('segments period transactions by type', () => {
      expect(selectPeriodSalesTransactions(state).map((t) => t.id)).toEqual([
        'tx-c1',
      ]);
      expect(selectPeriodPurchasesTransactions(state).map((t) => t.id)).toEqual(
        ['tx-o2'],
      );
      expect(selectPeriodCropTransactions(state).map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-o2',
      ]);
      expect(selectPeriodPaymentsTransactions(state).map((t) => t.id)).toEqual([
        'tx-c3',
      ]);
      expect(selectPeriodExpenseTransactions(state).map((t) => t.id)).toEqual([
        'tx-o1',
      ]);
      expect(selectPeriodServiceTransactions(state).map((t) => t.id)).toEqual([
        'tx-c2',
      ]);
    });

    it('segments till-date transactions by type', () => {
      expect(selectTillDateSalesTransactions(state).map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c4',
      ]);
      expect(
        selectTillDatePurchasesTransactions(state).map((t) => t.id),
      ).toEqual(['tx-o2']);
      expect(selectTillDateCropTransactions(state).map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c4',
        'tx-o2',
      ]);
      expect(
        selectTillDatePaymentsTransactions(state).map((t) => t.id),
      ).toEqual(['tx-c3']);
      expect(selectTillDateExpenseTransactions(state).map((t) => t.id)).toEqual(
        ['tx-o1', 'tx-o3'],
      );
      expect(selectTillDateServiceTransactions(state).map((t) => t.id)).toEqual(
        ['tx-c2'],
      );
    });
  });

  describe('parameterized customer transaction selectors', () => {
    const state = createMockRootState();

    it('selectCustomerTransactionsByCustomerId returns all transactions for the given customer', () => {
      const cust1Txs = selectCustomerTransactionsByCustomerId('cust-1')(state);
      expect(cust1Txs.map((t) => t.id)).toEqual(['tx-c1', 'tx-c3', 'tx-c4']);

      const cust2Txs = selectCustomerTransactionsByCustomerId('cust-2')(state);
      expect(cust2Txs.map((t) => t.id)).toEqual(['tx-c2']);
    });

    it('selectPeriodTransactionsByCustomerId returns period-only transactions for the customer', () => {
      const cust1PeriodTxs =
        selectPeriodTransactionsByCustomerId('cust-1')(state);
      expect(cust1PeriodTxs.map((t) => t.id)).toEqual(['tx-c1', 'tx-c3']);
    });

    it('selectTillDateTransactionsByCustomerId returns cumulative transactions for the customer', () => {
      const cust1TillDateTxs =
        selectTillDateTransactionsByCustomerId('cust-1')(state);
      expect(cust1TillDateTxs.map((t) => t.id)).toEqual([
        'tx-c1',
        'tx-c3',
        'tx-c4',
      ]);
    });

    it('selectTransactionsByDateRange filters custom ranges', () => {
      const customRangeTxs = selectTransactionsByDateRange(
        '2026-02-01',
        '2026-02-28',
      )(state);
      expect(customRangeTxs.map((t) => t.id)).toEqual(['tx-c4', 'tx-o3']);
    });
  });
});
