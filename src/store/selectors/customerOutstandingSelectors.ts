import { createSelector } from '@reduxjs/toolkit';
import {
  Customer,
  CustomerTransactionData,
  isOpeningDueTransaction,
  isPaymentTransaction,
  isSaleTransaction,
  isServiceTransaction,
} from '../../models';
import { parseIsoDate } from '../../utils';
import { customersApiSlice } from '../api/customersApi';
import {
  selectFilterMode,
  selectPreviousPeriodLabel,
  selectSelectedMonth,
  selectSelectedYear,
} from './timelineSelectors';
import {
  selectPeriodCustomerTransactions,
  selectPreviousTillDateCustomerTransactions,
  selectTillDateCustomerTransactions,
} from './transactionSelectors';

// ── Models & Types ──────────────────────────────────────────────────────────

export interface CustomerLedgerRecord {
  customerId: string;
  customerName: string;
  openingDue: number;
  totalSales: number;
  totalServices: number;
  totalBilled: number;
  totalPaid: number;
  totalDiscounts: number;
  currentOutstanding: number;
  transactionCount: number;
  lastTransactionDate?: string;
}

export interface CustomerOutstandingMetrics {
  totalOutstanding: number;
  previousOutstanding: number;
  tenorDifference: number;
  periodCreditAdded: number;
  periodCollections: number;
  netChange: number;
  customersWithDuesCount: number;
  previousTenorLabel: string;
}

// ── Pure Calculation Helpers ────────────────────────────────────────────────

/**
 * Builds customer ledger records cumulatively from all transactions up to a date.
 * Strictly calculates running customer ledger:
 * totalBilled = openingDue + totalSales + totalServices
 * totalPaid = cashPaid (from sales & services) + paymentAmounts
 * currentOutstanding = totalBilled - totalPaid - totalDiscounts
 */
export function buildCustomerLedgerMap(
  customers: Customer[],
  transactions: CustomerTransactionData[],
): Record<string, CustomerLedgerRecord> {
  const map: Record<string, CustomerLedgerRecord> = {};

  // 1. Initialize with all registered customers (ledger derived strictly from transaction events)
  for (const cust of customers) {
    map[cust.id] = {
      customerId: cust.id,
      customerName: cust.name || 'Unnamed Customer',
      openingDue: 0,
      totalSales: 0,
      totalServices: 0,
      totalBilled: 0,
      totalPaid: 0,
      totalDiscounts: 0,
      currentOutstanding: 0,
      transactionCount: 0,
      lastTransactionDate: undefined,
    };
  }

  // 2. Sort transactions chronologically ascending
  const sortedTxs = [...transactions].sort((a, b) =>
    (a.date || '').localeCompare(b.date || ''),
  );

  // 3. Process each transaction
  for (const tx of sortedTxs) {
    const custId = tx.customerId;
    if (!custId) continue;

    let record = map[custId];
    if (!record) {
      record = {
        customerId: custId,
        customerName: tx.customerName || 'Customer',
        openingDue: 0,
        totalSales: 0,
        totalServices: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalDiscounts: 0,
        currentOutstanding: 0,
        transactionCount: 0,
        lastTransactionDate: undefined,
      };
      map[custId] = record;
    }

    record.transactionCount += 1;
    if (tx.date) {
      record.lastTransactionDate = parseIsoDate(tx.date);
    }

    if (isSaleTransaction(tx)) {
      const amt = Number(tx.amount || 0);
      const cash = Number(tx.cashPaid || 0);
      const disc = Number(tx.discount || 0);
      record.totalSales += amt;
      record.totalPaid += cash;
      record.totalDiscounts += disc;
    } else if (isServiceTransaction(tx)) {
      const amt = Number(tx.amount || 0);
      const cash = Number(tx.cashPaid || 0);
      const disc = Number(tx.discount || 0);
      record.totalServices += amt;
      record.totalPaid += cash;
      record.totalDiscounts += disc;
    } else if (isPaymentTransaction(tx)) {
      const pAmt = Number(tx.amount || 0);
      const disc = Number(tx.discount || 0);
      record.totalPaid += pAmt;
      record.totalDiscounts += disc;
    } else if (isOpeningDueTransaction(tx)) {
      record.openingDue += Number(tx.amount || 0);
    }
  }

  // 4. Finalize computed totals and round to integers
  for (const record of Object.values(map)) {
    record.totalSales = Math.round(record.totalSales);
    record.totalServices = Math.round(record.totalServices);
    record.totalPaid = Math.round(record.totalPaid);
    record.totalDiscounts = Math.round(record.totalDiscounts);
    record.totalBilled = Math.round(
      record.openingDue + record.totalSales + record.totalServices,
    );
    record.currentOutstanding = Math.round(
      record.totalBilled - record.totalPaid - record.totalDiscounts,
    );
  }

  return map;
}

// ── Base Customer RTK Query Selectors ────────────────────────────────────────

export const selectCustomersQuery =
  customersApiSlice.endpoints.getCustomers.select();

export const selectAllCustomers = createSelector(
  [selectCustomersQuery],
  (result): Customer[] => result.data || [],
);

export const selectCustomersMap = createSelector(
  [selectAllCustomers],
  (customers): Record<string, Customer> => {
    const map: Record<string, Customer> = {};
    for (const c of customers) {
      map[c.id] = c;
    }
    return map;
  },
);

export const selectIsCustomersLoading = createSelector(
  [selectCustomersQuery],
  (result): boolean => Boolean(result.isLoading),
);

export const selectCustomerById = (customerId: string) =>
  createSelector([selectCustomersMap], (map): Customer | undefined => {
    return map[customerId];
  });

// ── Till-Date Customer Ledger & Outstanding Selectors ────────────────────────

/**
 * Returns a map of customer ledger records (customerId -> CustomerLedgerRecord)
 * calculated cumulatively from the beginning of history up to the active toDate.
 */
export const selectCustomerLedgerDetailsMap = createSelector(
  [selectAllCustomers, selectTillDateCustomerTransactions],
  (customers, tillDateTxs): Record<string, CustomerLedgerRecord> => {
    return buildCustomerLedgerMap(customers, tillDateTxs);
  },
);

/**
 * Returns an array of customer ledger records sorted descending by currentOutstanding.
 */
export const selectCustomerLedgerSummaries = createSelector(
  [selectCustomerLedgerDetailsMap],
  (map): CustomerLedgerRecord[] => {
    return Object.values(map).sort(
      (a, b) => b.currentOutstanding - a.currentOutstanding,
    );
  },
);

/**
 * Returns a simplified map of customerId -> currentOutstanding balance.
 */
export const selectCustomerBalancesMap = createSelector(
  [selectCustomerLedgerDetailsMap],
  (map): Record<string, number> => {
    const balances: Record<string, number> = {};
    for (const [id, record] of Object.entries(map)) {
      balances[id] = record.currentOutstanding;
    }
    return balances;
  },
);

/**
 * Returns the total customer outstanding (accounts receivable) across all customers till date.
 */
export const selectTotalCustomerOutstanding = createSelector(
  [selectCustomerLedgerSummaries],
  (summaries): number => {
    return summaries.reduce(
      (sum, record) => sum + record.currentOutstanding,
      0,
    );
  },
);

/**
 * Returns the count of customers who currently have outstanding dues (> 0).
 */
export const selectCustomersWithDuesCount = createSelector(
  [selectCustomerLedgerSummaries],
  (summaries): number => {
    return summaries.filter((r) => r.currentOutstanding > 0).length;
  },
);

/**
 * Returns the list of customers who currently have outstanding dues (> 0).
 */
export const selectCustomersWithDues = createSelector(
  [selectCustomerLedgerSummaries],
  (summaries): CustomerLedgerRecord[] => {
    return summaries.filter((r) => r.currentOutstanding > 0);
  },
);

/**
 * Returns the list of customers who currently have an advance / credit balance (< 0).
 */
export const selectCustomersWithCredit = createSelector(
  [selectCustomerLedgerSummaries],
  (summaries): CustomerLedgerRecord[] => {
    return summaries.filter((r) => r.currentOutstanding < 0);
  },
);

/**
 * Returns the list of customers who are fully settled (currentOutstanding === 0).
 */
export const selectSettledCustomers = createSelector(
  [selectCustomerLedgerSummaries],
  (summaries): CustomerLedgerRecord[] => {
    return summaries.filter((r) => r.currentOutstanding === 0);
  },
);

/**
 * Parameterized selector to get the current outstanding balance for a specific customer.
 */
export const selectCustomerOutstandingById = (customerId: string) =>
  createSelector(
    [selectCustomerBalancesMap],
    (balances): number => balances[customerId] || 0,
  );

/**
 * Parameterized selector to get the full ledger record for a specific customer.
 */
export const selectCustomerLedgerRecordById = (customerId: string) =>
  createSelector(
    [selectCustomerLedgerDetailsMap],
    (map): CustomerLedgerRecord | undefined => map[customerId],
  );

// ── Period Movement Selectors ────────────────────────────────────────────────

/**
 * Calculates the total new credit extended to customers strictly within the active timeline period.
 */
export const selectPeriodCreditAdded = createSelector(
  [selectPeriodCustomerTransactions],
  (periodTxs): number => {
    let creditAdded = 0;
    for (const tx of periodTxs) {
      if (isSaleTransaction(tx) || isServiceTransaction(tx)) {
        const amt = Number(tx.amount || 0);
        const cash = Number(tx.cashPaid || 0);
        const disc = Number(tx.discount || 0);
        const credit =
          tx.remainingDue !== undefined
            ? Number(tx.remainingDue) || 0
            : Math.max(0, amt - cash - disc);
        creditAdded += credit;
      }
    }
    return Math.round(creditAdded);
  },
);

/**
 * Calculates the total collections received from customers strictly within the active timeline period.
 */
export const selectPeriodCollections = createSelector(
  [selectPeriodCustomerTransactions],
  (periodTxs): number => {
    let collections = 0;
    for (const tx of periodTxs) {
      if (isPaymentTransaction(tx)) {
        const pAmt = Number(tx.amount || 0);
        const disc = Number(tx.discount || 0);
        collections += pAmt + disc;
      }
    }
    return Math.round(collections);
  },
);

/**
 * Calculates net change in customer dues during the period (Credit Added - Collections).
 */
export const selectPeriodNetCustomerDueChange = createSelector(
  [selectPeriodCreditAdded, selectPeriodCollections],
  (creditAdded, collections): number => {
    return Math.round(creditAdded - collections);
  },
);

// ── Previous Comparison Period Selectors ─────────────────────────────────────

/**
 * Map of customer ledger records up to previousToDate.
 */
export const selectPreviousCustomerLedgerDetailsMap = createSelector(
  [selectAllCustomers, selectPreviousTillDateCustomerTransactions],
  (customers, prevTillDateTxs): Record<string, CustomerLedgerRecord> => {
    return buildCustomerLedgerMap(customers, prevTillDateTxs);
  },
);

/**
 * Total customer outstanding up to previousToDate.
 */
export const selectPreviousTotalCustomerOutstanding = createSelector(
  [selectPreviousCustomerLedgerDetailsMap],
  (map): number => {
    return Object.values(map).reduce(
      (sum, record) => sum + record.currentOutstanding,
      0,
    );
  },
);

/**
 * Difference in customer outstandings between current tenor and previous tenor.
 */
export const selectCustomerOutstandingTenorDifference = createSelector(
  [selectTotalCustomerOutstanding, selectPreviousTotalCustomerOutstanding],
  (totalOutstanding, previousOutstanding): number => {
    return Math.round(totalOutstanding - previousOutstanding);
  },
);

/**
 * Human-readable label for comparison against previous tenor.
 */
export const selectCustomerOutstandingTenorLabel = createSelector(
  [
    selectFilterMode,
    selectSelectedYear,
    selectSelectedMonth,
    selectPreviousPeriodLabel,
  ],
  (mode, year, month, prevPeriodLabel): string => {
    if (mode === 'all') {
      return '';
    }
    if (mode === 'ytd' || month === 0) {
      return `vs ${year - 1} Closing`;
    }
    return `vs ${prevPeriodLabel}`;
  },
);

// ── Composite Customer Outstanding Metrics Selector ──────────────────────────

/**
 * Composite selector returning complete customer outstanding metrics for UI cards.
 */
export const selectCustomerOutstandingMetrics = createSelector(
  [
    selectTotalCustomerOutstanding,
    selectPreviousTotalCustomerOutstanding,
    selectCustomerOutstandingTenorDifference,
    selectPeriodCreditAdded,
    selectPeriodCollections,
    selectPeriodNetCustomerDueChange,
    selectCustomersWithDuesCount,
    selectCustomerOutstandingTenorLabel,
  ],
  (
    totalOutstanding,
    previousOutstanding,
    tenorDifference,
    periodCreditAdded,
    periodCollections,
    netChange,
    customersWithDuesCount,
    previousTenorLabel,
  ): CustomerOutstandingMetrics => ({
    totalOutstanding,
    previousOutstanding,
    tenorDifference,
    periodCreditAdded,
    periodCollections,
    netChange,
    customersWithDuesCount,
    previousTenorLabel,
  }),
);
