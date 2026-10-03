import { describe, expect, it } from 'vitest';
import { Customer, CustomerTransactionData } from '../../models';
import type { RootState } from '../index';
import {
  buildCustomerLedgerMap,
  selectAllCustomers,
  selectCustomerBalancesMap,
  selectCustomerById,
  selectCustomerLedgerDetailsMap,
  selectCustomerLedgerRecordById,
  selectCustomerLedgerSummaries,
  selectCustomerOutstandingById,
  selectCustomerOutstandingMetrics,
  selectCustomerOutstandingTenorDifference,
  selectCustomerOutstandingTenorLabel,
  selectCustomersMap,
  selectCustomersWithCredit,
  selectCustomersWithDues,
  selectCustomersWithDuesCount,
  selectIsCustomersLoading,
  selectPeriodCreditAdded,
  selectPeriodCollections,
  selectPeriodNetCustomerDueChange,
  selectPreviousCustomerLedgerDetailsMap,
  selectPreviousTotalCustomerOutstanding,
  selectSettledCustomers,
  selectTotalCustomerOutstanding,
} from './customerOutstandingSelectors';

const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Ramesh Patel' },
  { id: 'c2', name: 'Suresh Kumar' },
  { id: 'c3', name: 'Dinesh Shah' },
];

const mockCustomerTransactions: CustomerTransactionData[] = [
  // Starting opening dues via transaction events
  {
    id: 'tx-0a',
    date: '2025-01-01T00:00:00.000Z',
    type: 'OPENING_DUE',
    customerId: 'c1',
    customerName: 'Ramesh Patel',
    amount: 10000,
    cashPaid: 0,
    remainingDue: 10000,
  },
  {
    id: 'tx-0b',
    date: '2025-01-01T00:00:00.000Z',
    type: 'OPENING_DUE',
    customerId: 'c2',
    customerName: 'Suresh Kumar',
    amount: 5000,
    cashPaid: 0,
    remainingDue: 5000,
  },
  // Jan 2026 transactions
  {
    id: 'tx-1',
    date: '2026-01-10T10:00:00.000Z',
    type: 'SALE',
    category: 'Tuvar',
    customerId: 'c1',
    customerName: 'Ramesh Patel',
    weight: 1000,
    amount: 20000,
    cashPaid: 5000, // credit added = 15000
    remainingDue: 15000,
  },
  {
    id: 'tx-2',
    date: '2026-01-15T10:00:00.000Z',
    type: 'PAYMENT',
    customerId: 'c2',
    customerName: 'Suresh Kumar',
    amount: 3000, // collections = 3000
    cashPaid: 3000,
    remainingDue: 0,
  },
  // Feb 2026 transactions
  {
    id: 'tx-3',
    date: '2026-02-05T10:00:00.000Z',
    type: 'SERVICE',
    category: 'Pickup',
    customerId: 'c3',
    customerName: 'Dinesh Shah',
    amount: 4000,
    cashPaid: 0, // credit added = 4000
    remainingDue: 4000,
  },
  {
    id: 'tx-4',
    date: '2026-02-12T10:00:00.000Z',
    type: 'PAYMENT',
    customerId: 'c1',
    customerName: 'Ramesh Patel',
    amount: 10000, // collections = 10000
    cashPaid: 10000,
    remainingDue: 0,
  },
  // March 2026 transactions
  {
    id: 'tx-5',
    date: '2026-03-05T10:00:00.000Z',
    type: 'SALE',
    category: 'Chana',
    customerId: 'c2',
    customerName: 'Suresh Kumar',
    weight: 500,
    amount: 12000,
    cashPaid: 2000, // credit added = 10000
    remainingDue: 10000,
  },
  {
    id: 'tx-6',
    date: '2026-03-20T10:00:00.000Z',
    type: 'PAYMENT',
    customerId: 'c3',
    customerName: 'Dinesh Shah',
    amount: 5000, // Paid 5000 when due was 4000 -> -1000 advance/credit
    cashPaid: 5000,
    remainingDue: 0,
  },
];

const createMockRootState = (
  customers = mockCustomers,
  transactions = mockCustomerTransactions,
  year = 2026,
  month = 2, // March (0-indexed)
  filterMode: 'month' | 'ytd' | 'all' = 'month',
): RootState => {
  return {
    timeline: {
      selectedYear: year,
      selectedMonth: month,
      filterMode,
    },
    api: {
      queries: {
        'getCustomers(undefined)': {
          status: 'fulfilled',
          data: customers,
        },
        'getCustomerTransactions(undefined)': {
          status: 'fulfilled',
          data: transactions,
        },
        'getOperationTransactions(undefined)': {
          status: 'fulfilled',
          data: [],
        },
      },
    },
  } as unknown as RootState;
};

describe('customerOutstandingSelectors', () => {
  describe('pure helper: buildCustomerLedgerMap', () => {
    it('calculates running ledger from openingDue and till-date transactions', () => {
      const map = buildCustomerLedgerMap(mockCustomers, mockCustomerTransactions);

      // c1: 10,000 opening + 20,000 sale - 5,000 cash - 10,000 payment = 15,000
      expect(map['c1'].openingDue).toBe(10000);
      expect(map['c1'].totalSales).toBe(20000);
      expect(map['c1'].totalPaid).toBe(15000);
      expect(map['c1'].currentOutstanding).toBe(15000);
      expect(map['c1'].transactionCount).toBe(3);

      // c2: 5,000 opening - 3,000 payment + 12,000 sale - 2,000 cash = 12,000
      expect(map['c2'].openingDue).toBe(5000);
      expect(map['c2'].totalSales).toBe(12000);
      expect(map['c2'].totalPaid).toBe(5000);
      expect(map['c2'].currentOutstanding).toBe(12000);
      expect(map['c2'].transactionCount).toBe(3);

      // c3: 0 opening + 4,000 service - 5,000 payment = -1000
      expect(map['c3'].openingDue).toBe(0);
      expect(map['c3'].totalServices).toBe(4000);
      expect(map['c3'].totalPaid).toBe(5000);
      expect(map['c3'].currentOutstanding).toBe(-1000);
    });
  });

  describe('base customer selectors', () => {
    it('selects customers array, map, and individual customer', () => {
      const state = createMockRootState();
      expect(selectAllCustomers(state)).toEqual(mockCustomers);
      expect(selectCustomersMap(state)['c1']).toEqual(mockCustomers[0]);
      expect(selectCustomerById('c1')(state)).toEqual(mockCustomers[0]);
      expect(selectIsCustomersLoading(state)).toBe(false);
    });
  });

  describe('till-date customer outstanding selectors (March 2026)', () => {
    it('calculates customer ledger records up to end of March 2026', () => {
      const state = createMockRootState(
        mockCustomers,
        mockCustomerTransactions,
        2026,
        2, // March
        'month',
      );

      const detailsMap = selectCustomerLedgerDetailsMap(state);
      expect(detailsMap['c1'].currentOutstanding).toBe(15000);
      expect(detailsMap['c2'].currentOutstanding).toBe(12000);
      expect(detailsMap['c3'].currentOutstanding).toBe(-1000);

      const summaries = selectCustomerLedgerSummaries(state);
      // Sorted descending: c1 (15,000), c2 (12,000), c3 (-1,000)
      expect(summaries.map((s) => s.customerId)).toEqual(['c1', 'c2', 'c3']);
      expect(summaries[0].currentOutstanding).toBe(15000);
      expect(summaries[1].currentOutstanding).toBe(12000);
      expect(summaries[2].currentOutstanding).toBe(-1000);

      expect(selectCustomerBalancesMap(state)).toEqual({
        c1: 15000,
        c2: 12000,
        c3: -1000,
      });

      expect(selectCustomerOutstandingById('c1')(state)).toBe(15000);
      expect(selectCustomerOutstandingById('c2')(state)).toBe(12000);
      expect(selectCustomerOutstandingById('c3')(state)).toBe(-1000);

      const c1Detail = selectCustomerLedgerRecordById('c1')(state);
      expect(c1Detail?.totalBilled).toBe(30000); // 10k opening + 20k sale
      expect(c1Detail?.totalPaid).toBe(15000); // 5k cash + 10k payment
    });

    it('calculates aggregate total customer receivables and segment lists', () => {
      const state = createMockRootState();

      // Total = 15,000 + 12,000 - 1,000 = 26,000
      expect(selectTotalCustomerOutstanding(state)).toBe(26000);

      // Customers with dues (>0): c1, c2 -> 2 customers
      expect(selectCustomersWithDuesCount(state)).toBe(2);
      expect(selectCustomersWithDues(state).map((s) => s.customerId)).toEqual([
        'c1',
        'c2',
      ]);

      // Customers with credit (<0): c3
      expect(selectCustomersWithCredit(state).map((s) => s.customerId)).toEqual([
        'c3',
      ]);

      // Settled (0): none
      expect(selectSettledCustomers(state)).toEqual([]);
    });
  });

  describe('period movement selectors (March 2026)', () => {
    it('calculates credit added and collections strictly inside March 2026', () => {
      const state = createMockRootState(
        mockCustomers,
        mockCustomerTransactions,
        2026,
        2, // March 2026
        'month',
      );

      // In March 2026:
      // tx-5: Sale of 12000 with 2000 cash paid -> credit added = 10000
      // tx-6: Payment of 5000 -> collections = 5000
      expect(selectPeriodCreditAdded(state)).toBe(10000);
      expect(selectPeriodCollections(state)).toBe(5000);
      expect(selectPeriodNetCustomerDueChange(state)).toBe(5000);
    });
  });

  describe('previous tenor comparison selectors (February 2026 vs March 2026)', () => {
    it('calculates previous tenor outstandings up to end of February 2026', () => {
      const state = createMockRootState(
        mockCustomers,
        mockCustomerTransactions,
        2026,
        2, // March 2026 (prev is Feb 2026)
        'month',
      );

      // Up to Feb 2026:
      // c1: 10,000 + 15,000 (Jan sale) - 10,000 (Feb payment) = 15,000
      // c2: 5,000 - 3,000 (Jan payment) = 2,000
      // c3: 0 + 4,000 (Feb service) = 4,000
      // Prev Total = 15,000 + 2,000 + 4,000 = 21,000
      const prevMap = selectPreviousCustomerLedgerDetailsMap(state);
      expect(prevMap['c1'].currentOutstanding).toBe(15000);
      expect(prevMap['c2'].currentOutstanding).toBe(2000);
      expect(prevMap['c3'].currentOutstanding).toBe(4000);

      expect(selectPreviousTotalCustomerOutstanding(state)).toBe(21000);

      // Tenor difference: Current (26,000) - Previous (21,000) = 5,000
      expect(selectCustomerOutstandingTenorDifference(state)).toBe(5000);
      expect(selectCustomerOutstandingTenorLabel(state)).toBe(
        'vs February 2026',
      );
    });
  });

  describe('composite metrics selector', () => {
    it('returns complete CustomerOutstandingMetrics structure for Home Page Cards', () => {
      const state = createMockRootState(
        mockCustomers,
        mockCustomerTransactions,
        2026,
        2,
        'month',
      );

      const metrics = selectCustomerOutstandingMetrics(state);
      expect(metrics).toEqual({
        totalOutstanding: 26000,
        previousOutstanding: 21000,
        tenorDifference: 5000,
        periodCreditAdded: 10000,
        periodCollections: 5000,
        netChange: 5000,
        customersWithDuesCount: 2,
        previousTenorLabel: 'vs February 2026',
      });
    });

    it('does not double count opening balance when explicit OPENING_DUE transaction exists', () => {
      const customers: Customer[] = [
        { id: 'c1', name: 'Akoliya Bhagvanbhai' },
      ];
      const transactions: CustomerTransactionData[] = [
        {
          id: 'opening_2025_c1',
          date: '2025-01-01',
          type: 'OPENING_DUE',
          customerId: 'c1',
          customerName: 'Akoliya Bhagvanbhai',
          amount: 13080,
          cashPaid: 0,
          remainingDue: 13080,
        },
      ];

      const ledgerMap = buildCustomerLedgerMap(customers, transactions);
      expect(ledgerMap['c1'].openingDue).toBe(13080);
      expect(ledgerMap['c1'].totalBilled).toBe(13080);
      expect(ledgerMap['c1'].currentOutstanding).toBe(13080);
    });
  });
});
