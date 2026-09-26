import {
  Customer,
  CustomerTransactionData,
  INITIAL_CUSTOMER_RECEIVABLES,
  isPaymentTransaction,
  isSaleTransaction,
  isServiceTransaction,
  Transaction,
} from '../models';
import { MONTH_NAMES, parseTransactionDate } from '../utils';
import { TimelineFilter } from './profitBusiness';

// ── Result Type Interfaces ──────────────────────────────────────────────────

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

export interface CustomerLedgerSummary {
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

export interface CustomerLedgerDetail extends CustomerLedgerSummary {
  customer: Customer;
  transactions: CustomerTransactionData[];
}

export interface OverallLedgerSummary {
  totalOpeningDue: number;
  totalSales: number;
  totalServices: number;
  totalBilled: number;
  totalPaid: number;
  totalDiscounts: number;
  totalOutstanding: number;
  customerCount: number;
  customersWithDuesCount: number;
  customers: CustomerLedgerSummary[];
}

// ── Timeline Cutoff Helper ──────────────────────────────────────────────────

/**
 * Computes the timestamp cutoff (end of day 23:59:59.999) for a timeline selection, date string, or Date.
 */
export function getTimelineCutoffTimestamp(
  timeline?: TimelineFilter | string | number | Date,
): number {
  if (!timeline) return Infinity;

  if (timeline instanceof Date) {
    return new Date(
      timeline.getFullYear(),
      timeline.getMonth(),
      timeline.getDate(),
      23,
      59,
      59,
      999,
    ).getTime();
  }

  if (typeof timeline === 'number') {
    return timeline;
  }

  if (typeof timeline === 'string') {
    const d = parseTransactionDate(timeline);
    if (!d) return Infinity;
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999,
    ).getTime();
  }

  // TimelineFilter object
  const year = timeline.selectedYear;
  const month = timeline.selectedMonth;
  const day = timeline.selectedDay;
  const mode = timeline.filterMode;

  if (mode === 'ytd') {
    return new Date(year, 11, 31, 23, 59, 59, 999).getTime();
  }

  // If a specific day is selected (e.g. May 15th): cutoff is end of that day
  if (day !== undefined && day > 0) {
    return new Date(year, month, day, 23, 59, 59, 999).getTime();
  }

  // If month is selected (e.g. May): cutoff is the last millisecond of the selected month
  return new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
}

/**
 * Computes the timestamp cutoff for the previous tenor period (e.g. previous month or previous year).
 */
export function getPreviousTimelineCutoffTimestamp(
  timeline?: TimelineFilter,
): number {
  if (!timeline) return 0;
  const year = timeline.selectedYear;
  const month = timeline.selectedMonth;
  const mode = timeline.filterMode;

  if (mode === 'ytd') {
    // End of prior year (Dec 31 23:59:59.999)
    return new Date(year - 1, 11, 31, 23, 59, 59, 999).getTime();
  }

  // Month mode
  if (month === 0) {
    // Previous tenor is end of previous year (Dec 31 of year - 1)
    return new Date(year - 1, 11, 31, 23, 59, 59, 999).getTime();
  }

  // Previous month cutoff (e.g., for May (month 4), end of April (month 3))
  return new Date(year, month, 0, 23, 59, 59, 999).getTime();
}

/**
 * Filters customer transactions from the very beginning of accounting ledger history
 * up to the exact day / end-of-period of the selected timeline.
 */
export function filterCustomerTransactionsUpToTimeline(
  transactions: CustomerTransactionData[],
  timeline?: TimelineFilter | string | number | Date,
): CustomerTransactionData[] {
  if (!timeline) return transactions;
  const cutoffTime = getTimelineCutoffTimestamp(timeline);

  return transactions.filter((tx) => {
    const d = parseTransactionDate(tx.date);
    if (!d) return false;
    return d.getTime() <= cutoffTime;
  });
}

// ── Individual Customer Ledger Calculation ──────────────────────────────────

/**
 * Calculates full running ledger detail and outstanding balance for a customer
 * aggregated cumulatively from the beginning of time up to the selected day/period.
 *
 * Formula:
 * Outstanding = Total Sales + Total Services - Total Payments - Total Discounts
 */
export function calculateCustomerLedgerDetail(
  customer: Customer,
  allCustomerTransactions: CustomerTransactionData[],
  timeline?: TimelineFilter | string | number | Date,
): CustomerLedgerDetail {
  const customerTxs = allCustomerTransactions.filter(
    (tx) => tx.customerId === customer.id,
  );

  const filteredTxs = filterCustomerTransactionsUpToTimeline(
    customerTxs,
    timeline,
  );

  // Sort chronologically ascending
  filteredTxs.sort((a, b) => {
    const dateA = parseTransactionDate(a.date)?.getTime() || 0;
    const dateB = parseTransactionDate(b.date)?.getTime() || 0;
    return dateA - dateB;
  });

  const openingDue = Number(customer.openingDue || 0);

  let totalSales = 0;
  let totalServices = 0;
  let totalPaid = 0;
  let totalDiscounts = 0;

  for (const tx of filteredTxs) {
    if (isSaleTransaction(tx)) {
      const amt = Number(tx.amount || 0);
      const cash = Number(tx.cashPaid || 0);
      const disc = Number(tx.discount || 0);
      totalSales += amt;
      totalPaid += cash;
      totalDiscounts += disc;
    } else if (isServiceTransaction(tx)) {
      const amt = Number(tx.amount || 0);
      const cash = Number(tx.cashPaid || 0);
      const disc = Number(tx.discount || 0);
      totalServices += amt;
      totalPaid += cash;
      totalDiscounts += disc;
    } else if (isPaymentTransaction(tx)) {
      const pAmt = Number(tx.amount || 0);
      const disc = Number(tx.discount || 0);
      totalPaid += pAmt;
      totalDiscounts += disc;
    }
  }

  const totalBilled = Number(
    (openingDue + totalSales + totalServices).toFixed(2),
  );
  const currentOutstanding = Number(
    (totalBilled - totalPaid - totalDiscounts).toFixed(2),
  );

  const lastTx = filteredTxs[filteredTxs.length - 1];
  const lastTransactionDate = lastTx
    ? typeof lastTx.date === 'string'
      ? lastTx.date
      : parseTransactionDate(lastTx.date)?.toISOString()
    : undefined;

  return {
    customer,
    customerId: customer.id,
    customerName: customer.name,
    openingDue,
    totalSales: Number(totalSales.toFixed(2)),
    totalServices: Number(totalServices.toFixed(2)),
    totalBilled,
    totalPaid: Number(totalPaid.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    currentOutstanding,
    transactions: filteredTxs,
    transactionCount: filteredTxs.length,
    lastTransactionDate,
  };
}

/**
 * Calculates single running outstanding balance for a customer from beginning up to timeline.
 * Outstanding = Opening Due + Sales + Services - Payments - Discounts
 */
export function calculateCustomerOutstanding(
  customerId: string,
  transactions: CustomerTransactionData[],
  timeline?: TimelineFilter | string | number | Date,
  openingDue: number = 0,
): number {
  const dummyCustomer: Customer = {
    id: customerId,
    name: '',
    openingDue,
  };

  const detail = calculateCustomerLedgerDetail(
    dummyCustomer,
    transactions,
    timeline,
  );
  return detail.currentOutstanding;
}

// ── Overall All-Customers Ledger Calculation ────────────────────────────────

/**
 * Calculates aggregate ledger summaries and overall accounts receivable across all customers
 * from the beginning of history up to the specified timeline selection.
 */
export function calculateAllCustomersLedger(
  customers: Customer[],
  allCustomerTransactions: CustomerTransactionData[],
  timeline?: TimelineFilter | string | number | Date,
): OverallLedgerSummary {
  const customerSummaries: CustomerLedgerSummary[] = [];

  let totalOpeningDue = 0;
  let totalSales = 0;
  let totalServices = 0;
  let totalBilled = 0;
  let totalPaid = 0;
  let totalDiscounts = 0;
  let totalOutstanding = 0;
  let customersWithDuesCount = 0;

  for (const cust of customers) {
    const detail = calculateCustomerLedgerDetail(
      cust,
      allCustomerTransactions,
      timeline,
    );

    customerSummaries.push({
      customerId: detail.customerId,
      customerName: detail.customerName,
      openingDue: detail.openingDue,
      totalSales: detail.totalSales,
      totalServices: detail.totalServices,
      totalBilled: detail.totalBilled,
      totalPaid: detail.totalPaid,
      totalDiscounts: detail.totalDiscounts,
      currentOutstanding: detail.currentOutstanding,
      transactionCount: detail.transactionCount,
      lastTransactionDate: detail.lastTransactionDate,
    });

    totalOpeningDue += detail.openingDue;
    totalSales += detail.totalSales;
    totalServices += detail.totalServices;
    totalBilled += detail.totalBilled;
    totalPaid += detail.totalPaid;
    totalDiscounts += detail.totalDiscounts;
    totalOutstanding += detail.currentOutstanding;

    if (detail.currentOutstanding > 0) {
      customersWithDuesCount++;
    }
  }

  // Sort by highest outstanding balance descending
  customerSummaries.sort((a, b) => b.currentOutstanding - a.currentOutstanding);

  return {
    totalOpeningDue: Number(totalOpeningDue.toFixed(2)),
    totalSales: Number(totalSales.toFixed(2)),
    totalServices: Number(totalServices.toFixed(2)),
    totalBilled: Number(totalBilled.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    customerCount: customers.length,
    customersWithDuesCount,
    customers: customerSummaries,
  };
}

/**
 * Calculates aggregate customer outstanding metrics for the active period (month or YTD)
 * including previous tenor comparison and period movement.
 */
export function calculateCustomerOutstandingMetrics(
  customers: Customer[],
  allCustomerTransactions: CustomerTransactionData[],
  filteredTransactions: Transaction[],
  timeline: TimelineFilter,
  initialBaseReceivables: number = INITIAL_CUSTOMER_RECEIVABLES,
): CustomerOutstandingMetrics {
  // 1. Current tenor cumulative ledger
  const currentLedger = calculateAllCustomersLedger(
    customers,
    allCustomerTransactions,
    timeline,
  );

  // If opening dues are directly configured on customer items, use sum; otherwise use baseline
  const hasCustomerOpeningDues = currentLedger.totalOpeningDue > 0;
  const baseReceivables = hasCustomerOpeningDues ? 0 : initialBaseReceivables;

  const totalOutstanding = Number(
    (baseReceivables + currentLedger.totalOutstanding).toFixed(2),
  );

  // 2. Previous tenor cumulative ledger
  const previousCutoff = getPreviousTimelineCutoffTimestamp(timeline);
  const prevCustomerTransactions = allCustomerTransactions.filter((tx) => {
    const d = parseTransactionDate(tx.date);
    return d ? d.getTime() <= previousCutoff : false;
  });

  const prevLedger = calculateAllCustomersLedger(
    customers,
    prevCustomerTransactions,
  );
  const previousOutstanding = Number(
    (baseReceivables + prevLedger.totalOutstanding).toFixed(2),
  );

  // 3. Difference between current and previous tenor
  const tenorDifference = Number(
    (totalOutstanding - previousOutstanding).toFixed(2),
  );

  // 4. Period Credit Added & Period Collections strictly within active period
  let periodCreditAdded = 0;
  let periodCollections = 0;

  for (const tx of filteredTransactions) {
    if (isSaleTransaction(tx)) {
      const amt = Number(tx.amount || 0);
      const cash = Number(tx.cashPaid || 0);
      const credit =
        tx.remainingDue !== undefined
          ? Number(tx.remainingDue) || 0
          : Math.max(0, amt - cash);
      periodCreditAdded += credit;
    } else if (isServiceTransaction(tx)) {
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
  const netChange = Number((periodCreditAdded - periodCollections).toFixed(2));

  // 5. Build Previous Tenor Label
  const year = timeline.selectedYear;
  const month = timeline.selectedMonth;
  const mode = timeline.filterMode;

  const previousTenorLabel =
    mode === 'ytd' || month === 0
      ? `vs ${year - 1} Closing`
      : `vs ${MONTH_NAMES[month - 1] || 'Last Month'}`;

  return {
    totalOutstanding,
    previousOutstanding,
    tenorDifference,
    periodCreditAdded,
    periodCollections,
    netChange,
    customersWithDuesCount: currentLedger.customersWithDuesCount,
    previousTenorLabel,
  };
}
