import { describe, expect, it } from 'vitest';
import { Customer, CustomerTransactionData } from '../models';
import {
  calculateAllCustomersLedger,
  calculateCustomerLedgerDetail,
  calculateCustomerOutstanding,
  filterCustomerTransactionsUpToTimeline,
  getTimelineCutoffTimestamp,
} from './ledgerBusiness';
import { TimelineFilter } from './profitBusiness';

describe('ledgerBusiness', () => {
  const mockCustomer: Customer = {
    id: 'cust_1',
    name: 'Ramesh Patel',
    mobile: '9876543210',
    village: 'Viramgam',
  };

  const mockTransactions: CustomerTransactionData[] = [
    // Historical 2025 Sale: 15,000
    {
      id: 'tx_2025_sale',
      customerId: 'cust_1',
      date: '2025-11-10T10:00:00.000Z',
      type: 'SALE',
      category: 'Tuvar',
      weight: 1500,
      amount: 15000,
      cashPaid: 5000,
      remainingDue: 10000,
    },
    // Jan 2026 Sale: 20,000 (10,000 cash paid, 10,000 remaining due)
    {
      id: 'tx_jan_sale',
      customerId: 'cust_1',
      date: '2026-01-10T10:00:00.000Z',
      type: 'SALE',
      category: 'Tuvar',
      weight: 2000,
      amount: 20000,
      cashPaid: 10000,
      remainingDue: 10000,
    },
    // Feb 2026 Service: 5,000 (0 cash paid, 5,000 remaining due)
    {
      id: 'tx_feb_service',
      customerId: 'cust_1',
      date: '2026-02-15T10:00:00.000Z',
      type: 'SERVICE',
      category: 'Pickup',
      amount: 5000,
      cashPaid: 0,
      remainingDue: 5000,
    },
    // March 2026 Payment: 15,000 + 1,000 discount
    {
      id: 'tx_mar_payment',
      customerId: 'cust_1',
      date: '2026-03-20T10:00:00.000Z',
      type: 'PAYMENT',
      amount: 15000,
      cashPaid: 15000,
      remainingDue: 0,
      discount: 1000,
    },
    // May 12, 2026 Sale: 30,000 (0 cash paid, 30,000 remaining due)
    {
      id: 'tx_may_sale',
      customerId: 'cust_1',
      date: '2026-05-12T10:00:00.000Z',
      type: 'SALE',
      category: 'Chana',
      weight: 3000,
      amount: 30000,
      cashPaid: 0,
      remainingDue: 30000,
    },
    // May 25, 2026 Payment: 10,000
    {
      id: 'tx_may_late_payment',
      customerId: 'cust_1',
      date: '2026-05-25T10:00:00.000Z',
      type: 'PAYMENT',
      amount: 10000,
      cashPaid: 10000,
      remainingDue: 0,
    },
    // June 2026 Payment: 20,000 (after May)
    {
      id: 'tx_june_payment',
      customerId: 'cust_1',
      date: '2026-06-05T10:00:00.000Z',
      type: 'PAYMENT',
      amount: 20000,
      cashPaid: 20000,
      remainingDue: 0,
    },
  ];

  describe('getTimelineCutoffTimestamp & filterCustomerTransactionsUpToTimeline', () => {
    it('computes exact end of month timestamp and includes all history up to May 31', () => {
      const timelineMay: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 4, // May
      };

      const cutoff = getTimelineCutoffTimestamp(timelineMay);
      const cutoffDate = new Date(cutoff);
      expect(cutoffDate.getFullYear()).toBe(2026);
      expect(cutoffDate.getMonth()).toBe(4); // May
      expect(cutoffDate.getDate()).toBe(31); // 31 days in May

      const filtered = filterCustomerTransactionsUpToTimeline(
        mockTransactions,
        timelineMay,
      );

      // Should include 2025, Jan, Feb, Mar, May 12, May 25 (6 transactions), excluding June
      expect(filtered).toHaveLength(6);
      expect(filtered.map((t) => t.id)).toEqual([
        'tx_2025_sale',
        'tx_jan_sale',
        'tx_feb_service',
        'tx_mar_payment',
        'tx_may_sale',
        'tx_may_late_payment',
      ]);
    });

    it('filters strictly up to a specific day when selectedDay is provided', () => {
      const timelineMay15: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 4, // May
        selectedDay: 15,
      };

      const filtered = filterCustomerTransactionsUpToTimeline(
        mockTransactions,
        timelineMay15,
      );

      // Should include 2025, Jan, Feb, Mar, May 12 (5 transactions), excluding May 25 and June
      expect(filtered).toHaveLength(5);
      expect(filtered.map((t) => t.id)).toEqual([
        'tx_2025_sale',
        'tx_jan_sale',
        'tx_feb_service',
        'tx_mar_payment',
        'tx_may_sale',
      ]);
    });
  });

  describe('calculateCustomerLedgerDetail', () => {
    it('aggregates running balance from transactions up to May 31st correctly', () => {
      const timelineMay: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 4, // May (0-indexed)
      };

      const result = calculateCustomerLedgerDetail(
        mockCustomer,
        mockTransactions,
        timelineMay,
      );

      // Sales: 15,000 (2025) + 20,000 (Jan) + 30,000 (May) = 65,000
      expect(result.totalSales).toBe(65000);
      // Services: 5,000 (Feb)
      expect(result.totalServices).toBe(5000);
      // Total Billed: 65,000 sales + 5,000 services = 70,000
      expect(result.totalBilled).toBe(70000);
      // Total Paid: 5,000 (2025 cash) + 10,000 (Jan cash) + 15,000 (Mar payment) + 10,000 (May payment) = 40,000
      expect(result.totalPaid).toBe(40000);
      // Total Discounts: 1,000 (Mar discount)
      expect(result.totalDiscounts).toBe(1000);
      // Outstanding = 70,000 - 40,000 - 1,000 = 29,000
      expect(result.currentOutstanding).toBe(29000);
      expect(result.transactionCount).toBe(6);
    });
  });

  describe('calculateCustomerOutstanding', () => {
    it('returns accurate single numeric outstanding balance up to timeline', () => {
      const timelineMay: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 4, // May
      };

      const outstanding = calculateCustomerOutstanding(
        'cust_1',
        mockTransactions,
        timelineMay,
      );

      expect(outstanding).toBe(29000);
    });
  });

  describe('calculateAllCustomersLedger', () => {
    it('computes overall accounts receivable and ranks customers by outstanding up to timeline', () => {
      const customers: Customer[] = [
        mockCustomer,
        {
          id: 'cust_2',
          name: 'Suresh Kumar',
        },
      ];

      const allTxs: CustomerTransactionData[] = [
        ...mockTransactions,
        // Cust 2 sale in Feb
        {
          id: 'tx_c2_sale',
          customerId: 'cust_2',
          date: '2026-02-01T00:00:00.000Z',
          type: 'SALE',
          category: 'Tuvar',
          weight: 1000,
          amount: 12000,
          cashPaid: 2000,
          remainingDue: 10000,
        },
      ];

      const timelineMay: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 4, // May
      };

      const result = calculateAllCustomersLedger(
        customers,
        allTxs,
        timelineMay,
      );

      expect(result.customerCount).toBe(2);
      expect(result.customersWithDuesCount).toBe(2);
      // Cust 1: 29,000
      // Cust 2: 12,000 sale - 2,000 paid = 10,000
      expect(result.totalOutstanding).toBe(29000 + 10000);

      // Sorted by highest outstanding descending
      expect(result.customers[0]?.customerId).toBe('cust_1');
      expect(result.customers[0]?.currentOutstanding).toBe(29000);
      expect(result.customers[1]?.customerId).toBe('cust_2');
      expect(result.customers[1]?.currentOutstanding).toBe(10000);
    });
  });
});
