import {
  Customer,
  CustomerTransactionData,
  isPaymentTransaction,
  isSaleTransaction,
  isServiceTransaction,
  Transaction,
} from '../models';
import { MONTH_NAMES, parseIsoDate } from '../utils';
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
 * Computes the 'YYYY-MM-DD' cutoff date string for a timeline selection.
 */
export function getTimelineCutoffDate(
  timeline?: TimelineFilter | string,
): string {
  if (!timeline) return '9999-99-99';

  if (typeof timeline === 'string') {
    return timeline.slice(0, 10);
  }

  const mode = timeline.filterMode;
  if (mode === 'all') {
    return '9999-99-99';
  }

  const year = timeline.selectedYear;
  const month = timeline.selectedMonth; // 0-indexed (0 = Jan, 11 = Dec)
  const day = timeline.selectedDay;

  // If a specific day is selected (e.g. May 15th)
  if (day !== undefined && day > 0) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  // If month or YTD is selected: cutoff is the last day of the selected month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(lastDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Computes the 'YYYY-MM-DD' cutoff date string for the previous tenor period.
 */
export function getPreviousTimelineCutoffDate(
  timeline?: TimelineFilter,
): string {
  if (!timeline) return '0000-00-00';
  const mode = timeline.filterMode;
  if (mode === 'all') {
    return '0000-00-00';
  }

  const year = timeline.selectedYear;
  const month = timeline.selectedMonth;

  if (mode === 'ytd' || month === 0) {
    // End of prior year (Dec 31 of year - 1)
    return `${year - 1}-12-31`;
  }

  // Previous month cutoff (e.g., for May (month 4), end of April (month 3))
  const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  const dd = String(lastDayOfPrevMonth).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Filters customer transactions from the very beginning of accounting ledger history
 * up to the exact day / end-of-period of the selected timeline.
 */
export function filterCustomerTransactionsUpToTimeline(
  transactions: CustomerTransactionData[],
  timeline?: TimelineFilter | string,
): CustomerTransactionData[] {
  if (!timeline) return transactions;
  const cutoffDate = getTimelineCutoffDate(timeline);

  return transactions.filter((tx) => {
    if (!tx.date) return false;
    return tx.date.slice(0, 10) <= cutoffDate;
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
  timeline?: TimelineFilter | string,
): CustomerLedgerDetail {
  const customerTxs = allCustomerTransactions.filter(
    (tx) => tx.customerId === customer.id,
  );

  const filteredTxs = filterCustomerTransactionsUpToTimeline(
    customerTxs,
    timeline,
  );

  // Sort chronologically ascending
  filteredTxs.sort((a, b) => a.date.localeCompare(b.date));

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

  const totalBilled = Math.round(openingDue + totalSales + totalServices);
  const currentOutstanding = Math.round(totalBilled - totalPaid - totalDiscounts);

  const lastTx = filteredTxs[filteredTxs.length - 1];
  const lastTransactionDate = lastTx
    ? parseIsoDate(lastTx.date)
    : undefined;

  return {
    customer,
    customerId: customer.id,
    customerName: customer.name,
    openingDue,
    totalSales: Math.round(totalSales),
    totalServices: Math.round(totalServices),
    totalBilled,
    totalPaid: Math.round(totalPaid),
    totalDiscounts: Math.round(totalDiscounts),
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
  timeline?: TimelineFilter | string,
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
  timeline?: TimelineFilter | string,
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
    totalOpeningDue: Math.round(totalOpeningDue),
    totalSales: Math.round(totalSales),
    totalServices: Math.round(totalServices),
    totalBilled: Math.round(totalBilled),
    totalPaid: Math.round(totalPaid),
    totalDiscounts: Math.round(totalDiscounts),
    totalOutstanding: Math.round(totalOutstanding),
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
): CustomerOutstandingMetrics {
  // 1. Current tenor cumulative ledger
  const currentLedger = calculateAllCustomersLedger(
    customers,
    allCustomerTransactions,
    timeline,
  );

  const totalOutstanding = Math.round(currentLedger.totalOutstanding);

  // 2. Previous tenor cumulative ledger
  const previousCutoffDate = getPreviousTimelineCutoffDate(timeline);
  const prevCustomerTransactions = allCustomerTransactions.filter((tx) => {
    return tx.date ? tx.date.slice(0, 10) <= previousCutoffDate : false;
  });

  const prevLedger = calculateAllCustomersLedger(
    customers,
    prevCustomerTransactions,
  );
  const previousOutstanding = Math.round(prevLedger.totalOutstanding);

  // 3. Difference between current and previous tenor
  const tenorDifference = Math.round(totalOutstanding - previousOutstanding);

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

  periodCreditAdded = Math.round(periodCreditAdded);
  periodCollections = Math.round(periodCollections);
  const netChange = Math.round(periodCreditAdded - periodCollections);

  // 5. Build Previous Tenor Label
  const year = timeline.selectedYear;
  const month = timeline.selectedMonth;
  const mode = timeline.filterMode;

  const previousTenorLabel =
    mode === 'all'
      ? ''
      : mode === 'ytd' || month === 0
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
