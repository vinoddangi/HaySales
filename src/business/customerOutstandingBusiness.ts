import {
  Customer,
  CustomerTransactionData,
  INITIAL_CUSTOMER_RECEIVABLES,
  isPaymentTransaction,
  isSaleTransaction,
  isServiceTransaction,
} from '../models';
import { parseTransactionDate } from '../utils';
import {
  calculateCustomerLedgerDetail,
  getTimelineCutoffTimestamp,
} from './ledgerBusiness';
import { extractChronologicalMonths, formatYearMonth } from './stockBusiness';

export interface CustomerBalanceRecord {
  customerId: string;
  customerName: string;
  outstanding: number;
}

export interface MonthlyCustomerOutstandingState {
  period: string; // 'YYYY-MM'
  totalOutstanding: number;
  customersWithDuesCount: number;
  periodCreditAdded: number;
  periodCollections: number;
  netChange: number;
  byCustomer: Record<string, CustomerBalanceRecord>;
}

export type CustomerOutstandingState = Record<
  string,
  MonthlyCustomerOutstandingState
>;

/**
 * Creates baseline December 2025 ('2025-12') customer outstanding state.
 */
export function createBaselineCustomerOutstanding(
  customers: Customer[],
  initialBaseReceivables: number = INITIAL_CUSTOMER_RECEIVABLES,
): MonthlyCustomerOutstandingState {
  const byCustomer: Record<string, CustomerBalanceRecord> = {};
  let totalOpeningDue = 0;
  let customersWithDuesCount = 0;

  for (const cust of customers) {
    const openingDue = Number(cust.openingDue || 0);
    byCustomer[cust.id] = {
      customerId: cust.id,
      customerName: cust.name,
      outstanding: openingDue,
    };
    totalOpeningDue += openingDue;
    if (openingDue > 0) {
      customersWithDuesCount++;
    }
  }

  const baseReceivables =
    totalOpeningDue > 0 ? totalOpeningDue : initialBaseReceivables;

  return {
    period: '2025-12',
    totalOutstanding: Number(baseReceivables.toFixed(2)),
    customersWithDuesCount,
    periodCreditAdded: 0,
    periodCollections: 0,
    netChange: 0,
    byCustomer,
  };
}

/**
 * Calculates continuous monthly customer outstandings from all customers and transactions,
 * maintaining state keyed strictly by 'YYYY-MM'.
 *
 * For each month:
 * 1. Computes running cumulative balances for each customer up to the end of that month.
 * 2. Aggregates monthly period credit added, collections, and net change.
 * 3. Records state directly under 'YYYY-MM' key.
 */
export function calculateMonthlyCustomerOutstandings(
  customers: Customer[],
  transactions: CustomerTransactionData[],
  initialBaseReceivables: number = INITIAL_CUSTOMER_RECEIVABLES,
): CustomerOutstandingState {
  const state: CustomerOutstandingState = {
    '2025-12': createBaselineCustomerOutstanding(
      customers,
      initialBaseReceivables,
    ),
  };

  const months = extractChronologicalMonths(transactions, 2026, 1);

  // Check if customers have explicit opening dues configured
  let totalExplicitOpening = 0;
  for (const cust of customers) {
    totalExplicitOpening += Number(cust.openingDue || 0);
  }
  const baseOffset = totalExplicitOpening > 0 ? 0 : initialBaseReceivables;

  for (const yearMonth of months) {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed

    const monthTimeline = {
      selectedYear: year,
      selectedMonth: month - 1, // 0-indexed for timeline cutoff
      filterMode: 'month' as const,
    };

    const monthEndCutoff = getTimelineCutoffTimestamp(monthTimeline);
    const txsUpToMonth = transactions.filter((tx) => {
      const d = parseTransactionDate(tx.date);
      return d ? d.getTime() <= monthEndCutoff : false;
    });

    const byCustomer: Record<string, CustomerBalanceRecord> = {};
    let totalOutstanding = 0;
    let customersWithDuesCount = 0;

    for (const cust of customers) {
      const detail = calculateCustomerLedgerDetail(
        cust,
        txsUpToMonth,
        monthTimeline,
      );

      byCustomer[cust.id] = {
        customerId: cust.id,
        customerName: cust.name,
        outstanding: detail.currentOutstanding,
      };

      totalOutstanding += detail.currentOutstanding;
      if (detail.currentOutstanding > 0) {
        customersWithDuesCount++;
      }
    }

    // Calculate period movements strictly inside this calendar month
    const monthTransactions = transactions.filter((tx) => {
      const d = parseTransactionDate(tx.date);
      if (!d) return false;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    let periodCreditAdded = 0;
    let periodCollections = 0;

    for (const tx of monthTransactions) {
      if (isSaleTransaction(tx) || isServiceTransaction(tx)) {
        const amt = Number(tx.amount || 0);
        const cash = Number(tx.cashPaid || 0);
        const credit =
          tx.remainingDue !== undefined
            ? Number(tx.remainingDue) || 0
            : Math.max(0, amt - cash);
        periodCreditAdded += credit;
      } else if (isPaymentTransaction(tx)) {
        const pAmt = Number(tx.amount || 0);
        const disc = Number(tx.discount || 0);
        periodCollections += pAmt + disc;
      }
    }

    periodCreditAdded = Number(periodCreditAdded.toFixed(2));
    periodCollections = Number(periodCollections.toFixed(2));
    const netChange = Number(
      (periodCreditAdded - periodCollections).toFixed(2),
    );

    state[yearMonth] = {
      period: yearMonth,
      totalOutstanding: Number((baseOffset + totalOutstanding).toFixed(2)),
      customersWithDuesCount,
      periodCreditAdded,
      periodCollections,
      netChange,
      byCustomer,
    };
  }

  return state;
}

/**
 * Retrieves the customer outstanding state for a given year and month (1-indexed month 1..12).
 */
export function getCustomerOutstandingForMonth(
  state: CustomerOutstandingState,
  year: number,
  month: number,
): MonthlyCustomerOutstandingState | undefined {
  const periodKey = formatYearMonth(year, month);
  return state[periodKey];
}
