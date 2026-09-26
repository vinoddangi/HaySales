import { describe, expect, it } from 'vitest';
import {
  PurchaseTransactionData,
  SaleTransactionData,
  Transaction,
} from '../models';
import { CropRecord } from '../store/slices/stockSlice';
import {
  calculateCommissionProfit,
  calculateCropCommissionProfit,
  calculateExpectedProfit,
  calculateServiceProfit,
  calculateTimelineExpectedProfit,
  filterTransactionsByTimeline,
  TimelineFilter,
} from './profitBusiness';

describe('profitBusiness', () => {
  describe('filterTransactionsByTimeline', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx_jan',
        date: '2026-01-15T10:00:00.000Z',
        type: 'SALE',
        category: 'Tuvar',
        weight: 1000,
        amount: 15000,
        customerId: 'c1',
        cashPaid: 15000,
        remainingDue: 0,
      },
      {
        id: 'tx_feb',
        date: '2026-02-20T10:00:00.000Z',
        type: 'SALE',
        category: 'Tuvar',
        weight: 2000,
        amount: 30000,
        customerId: 'c1',
        cashPaid: 30000,
        remainingDue: 0,
      },
      {
        id: 'tx_mar',
        date: '2026-03-10T10:00:00.000Z',
        type: 'SALE',
        category: 'Tuvar',
        weight: 3000,
        amount: 45000,
        customerId: 'c1',
        cashPaid: 45000,
        remainingDue: 0,
      },
    ];

    it('filters strictly for single month selection', () => {
      const timeline: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 1, // February (0-indexed)
        filterMode: 'month',
      };

      const result = filterTransactionsByTimeline(transactions, timeline);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('tx_feb');
    });

    it('filters cumulative transactions for YTD (Year-To-Date) selection', () => {
      const timeline: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 1, // February (0-indexed: Jan + Feb)
        filterMode: 'ytd',
      };

      const result = filterTransactionsByTimeline(transactions, timeline);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['tx_jan', 'tx_feb']);
    });
  });

  describe('calculateCropCommissionProfit', () => {
    it('calculates weighted cost, closing stock, and gross commission for a single crop', () => {
      const openingStock: PurchaseTransactionData = {
        id: 'op_tuvar',
        date: '2026-01-01',
        type: 'PURCHASE',
        category: 'Tuvar',
        weight: 20000,
        amount: 200000,
        cashPaid: 200000,
        remainingDue: 0,
      };

      const purchases: PurchaseTransactionData[] = [
        {
          id: 'p1',
          date: '2026-01-10',
          type: 'PURCHASE',
          category: 'Tuvar',
          weight: 30000,
          amount: 360000, // buy rate = 12.0
          cashPaid: 360000,
          remainingDue: 0,
        },
      ];

      const sales: SaleTransactionData[] = [
        {
          id: 's1',
          date: '2026-01-15',
          type: 'SALE',
          category: 'Tuvar',
          weight: 40000,
          amount: 600000, // sale rate = 15.0
          customerId: 'cust1',
          cashPaid: 600000,
          remainingDue: 0,
        },
      ];

      const result = calculateCropCommissionProfit(
        'Tuvar',
        openingStock,
        purchases,
        sales,
      );

      // Available stock: 20000 + 30000 = 50000 Kg, Amount: 200000 + 360000 = 560000, Weighted Rate: 11.20
      expect(result.totalAvailableStock.weight).toBe(50000);
      expect(result.totalAvailableStock.amount).toBe(560000);
      expect(result.totalAvailableStock.weightedRate).toBe(11.2);

      // Sales: 40000 Kg @ 15.00 = 600000
      expect(result.sales.weight).toBe(40000);
      expect(result.sales.amount).toBe(600000);
      expect(result.sales.avgRate).toBe(15);

      // Closing stock: 50000 - 40000 = 10000 Kg @ 11.20 = 112000
      expect(result.closingStock.weight).toBe(10000);
      expect(result.closingStock.rate).toBe(11.2);
      expect(result.closingStock.amount).toBe(112000);

      // COGS = 40000 * 11.20 = 448000
      expect(result.costOfGoodsSold).toBe(448000);

      // Gross Commission Profit = Sales Amount (600,000) - COGS (448,000) = 152,000
      expect(result.grossCommissionProfit).toBe(152000);
    });

    it('handles zero sales and zero purchases gracefully', () => {
      const openingStock: PurchaseTransactionData = {
        id: 'op_chana',
        date: '2026-01-01',
        type: 'PURCHASE',
        category: 'Chana',
        weight: 10000,
        amount: 100000,
        cashPaid: 100000,
        remainingDue: 0,
      };

      const result = calculateCropCommissionProfit(
        'Chana',
        openingStock,
        [],
        [],
      );

      expect(result.totalAvailableStock.weight).toBe(10000);
      expect(result.totalAvailableStock.weightedRate).toBe(10);
      expect(result.closingStock.weight).toBe(10000);
      expect(result.closingStock.amount).toBe(100000);
      expect(result.costOfGoodsSold).toBe(0);
      expect(result.grossCommissionProfit).toBe(0);
    });
  });

  describe('calculateCommissionProfit', () => {
    it('aggregates multiple crops with baseline opening stock correctly across period', () => {
      const openingStock: CropRecord = {
        Others: {
          id: 'opening-others',
          date: '2026-01-01',
          type: 'PURCHASE',
          category: 'Others',
          weight: 13528,
          amount: 141097.04,
          cashPaid: 141097.04,
          remainingDue: 0,
        },
      };

      const periodTransactions: Transaction[] = [
        // Others sale
        {
          id: 's_others',
          date: '2026-01-10',
          type: 'SALE',
          category: 'Others',
          weight: 13528,
          amount: 162336, // ~12/kg
          customerId: 'cust_1',
          cashPaid: 162336,
          remainingDue: 0,
        },
        // Tuvar purchase and sale
        {
          id: 'p_tuvar',
          date: '2026-01-12',
          type: 'PURCHASE',
          category: 'Tuvar',
          weight: 10000,
          amount: 100000, // 10/kg
          cashPaid: 100000,
          remainingDue: 0,
        },
        {
          id: 's_tuvar',
          date: '2026-01-15',
          type: 'SALE',
          category: 'Tuvar',
          weight: 8000,
          amount: 96000, // 12/kg
          customerId: 'cust_2',
          cashPaid: 96000,
          remainingDue: 0,
        },
      ];

      const result = calculateCommissionProfit(
        periodTransactions,
        openingStock,
      );

      // By Crop: Others
      const othersResult = result.byCrop['Others'];
      expect(othersResult).toBeDefined();
      expect(othersResult?.openingStock.weight).toBe(13528);
      expect(othersResult?.closingStock.weight).toBe(0);
      expect(othersResult?.grossCommissionProfit).toBe(
        Number((162336 - 141097.04).toFixed(2)),
      );

      // By Crop: Tuvar
      const tuvarResult = result.byCrop['Tuvar'];
      expect(tuvarResult).toBeDefined();
      expect(tuvarResult?.purchases.weight).toBe(10000);
      expect(tuvarResult?.sales.weight).toBe(8000);
      expect(tuvarResult?.closingStock.weight).toBe(2000);
      expect(tuvarResult?.closingStock.amount).toBe(20000);
      // Sold 8000 @ 10 cost = 80000 COGS, Sales = 96000, Profit = 16000
      expect(tuvarResult?.grossCommissionProfit).toBe(16000);

      // Totals
      expect(result.totalOpeningStock.weight).toBe(13528);
      expect(result.totalPurchases.weight).toBe(10000);
      expect(result.totalSales.weight).toBe(21528);
      expect(result.totalClosingStock.weight).toBe(2000);
      expect(result.totalGrossCommissionProfit).toBe(
        Number((162336 - 141097.04 + 16000).toFixed(2)),
      );
    });
  });

  describe('calculateServiceProfit', () => {
    it('calculates service income, fuel expense, and net service profit across period', () => {
      const periodTransactions: Transaction[] = [
        {
          id: 'srv_1',
          date: '2026-01-05',
          type: 'SERVICE',
          category: 'Pickup',
          customerId: 'cust_1',
          amount: 25000,
          cashPaid: 25000,
          remainingDue: 0,
        },
        {
          id: 'srv_2',
          date: '2026-01-18',
          type: 'SERVICE',
          category: 'Tractor',
          customerId: 'cust_2',
          amount: 15000,
          cashPaid: 15000,
          remainingDue: 0,
        },
        {
          id: 'exp_fuel',
          date: '2026-01-20',
          type: 'EXPENSE',
          category: 'Fuel',
          amount: 8000,
          cashPaid: 8000,
          remainingDue: 0,
        },
        {
          id: 'exp_maint',
          date: '2026-01-22',
          type: 'EXPENSE',
          category: 'Maintenance',
          amount: 3000,
          cashPaid: 3000,
          remainingDue: 0,
        },
      ];

      const result = calculateServiceProfit(periodTransactions);

      expect(result.serviceIncome).toBe(40000);
      expect(result.fuelExpenses).toBe(8000);
      expect(result.netServiceProfit).toBe(32000);
    });
  });

  describe('calculateExpectedProfit', () => {
    it('calculates expected profit directly for a transaction array', () => {
      const openingStock: CropRecord = {
        Tuvar: {
          id: 'op_tuvar',
          date: '2026-01-01',
          type: 'PURCHASE',
          category: 'Tuvar',
          weight: 10000,
          amount: 100000,
          cashPaid: 100000,
          remainingDue: 0,
        },
      };

      const transactions: Transaction[] = [
        {
          id: 's_tuvar',
          date: '2026-01-10T00:00:00.000Z',
          type: 'SALE',
          category: 'Tuvar',
          weight: 10000,
          amount: 120000,
          customerId: 'c_1',
          cashPaid: 120000,
          remainingDue: 0,
        },
        {
          id: 'srv',
          date: '2026-01-12T00:00:00.000Z',
          type: 'SERVICE',
          category: 'Pickup',
          customerId: 'c_1',
          amount: 15000,
          cashPaid: 15000,
          remainingDue: 0,
        },
      ];

      const result = calculateExpectedProfit(transactions, openingStock);
      expect(result.commission.totalGrossCommissionProfit).toBe(20000);
      expect(result.service.netServiceProfit).toBe(15000);
      expect(result.netOperatingProfit).toBe(35000);
    });
  });

  describe('calculateTimelineExpectedProfit', () => {
    it('filters ledger transactions based on timeline selection and calculates profit', () => {
      const openingStock: CropRecord = {
        Tuvar: {
          id: 'op_tuvar',
          date: '2026-01-01',
          type: 'PURCHASE',
          category: 'Tuvar',
          weight: 10000,
          amount: 100000, // 10/kg
          cashPaid: 100000,
          remainingDue: 0,
        },
      };

      const allTransactions: Transaction[] = [
        // Jan Sale: 10000 Tuvar @ 12 = 120000 (Gross profit = 20000)
        {
          id: 's_jan',
          date: '2026-01-10T00:00:00.000Z',
          type: 'SALE',
          category: 'Tuvar',
          weight: 10000,
          amount: 120000,
          customerId: 'c_1',
          cashPaid: 120000,
          remainingDue: 0,
        },
        // Jan Service: 15000
        {
          id: 'srv_jan',
          date: '2026-01-12T00:00:00.000Z',
          type: 'SERVICE',
          category: 'Pickup',
          customerId: 'c_1',
          amount: 15000,
          cashPaid: 15000,
          remainingDue: 0,
        },
        // Jan Fuel: 4000
        {
          id: 'fuel_jan',
          date: '2026-01-15T00:00:00.000Z',
          type: 'EXPENSE',
          category: 'Fuel',
          amount: 4000,
          cashPaid: 4000,
          remainingDue: 0,
        },
        // Feb Service (should be excluded when timeline is Jan)
        {
          id: 'srv_feb',
          date: '2026-02-10T00:00:00.000Z',
          type: 'SERVICE',
          category: 'Pickup',
          customerId: 'c_1',
          amount: 50000,
          cashPaid: 50000,
          remainingDue: 0,
        },
      ];

      const timeline: TimelineFilter = {
        selectedYear: 2026,
        selectedMonth: 0, // January
        filterMode: 'month',
      };

      const result = calculateTimelineExpectedProfit(
        allTransactions,
        timeline,
        openingStock,
      );

      // Commission: 120000 - 100000 = 20000
      expect(result.commission.totalGrossCommissionProfit).toBe(20000);
      // Service: 15000 - 4000 = 11000 (Feb service not included)
      expect(result.service.netServiceProfit).toBe(11000);
      // Net Profit: 20000 + 11000 = 31000
      expect(result.netOperatingProfit).toBe(31000);
    });
  });
});
