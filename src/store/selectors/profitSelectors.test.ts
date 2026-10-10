import { describe, expect, it } from 'vitest';
import { calculateMonthlyStockFromTransactions } from '../../business/stockBusiness';
import {
  ExpenseTransactionData,
  OperationsTransactionData,
  SaleTransactionData,
  ServiceTransactionData,
} from '../../models';
import { RootState } from '../index';
import {
  selectCalculatedMonthlyStock,
  selectCumulativeExpectedProfitSummary,
  selectEstimatedProfitMetrics,
  selectOpeningStockForPeriod,
  selectPeriodCommissionProfit,
  selectPeriodExpectedProfitSummary,
  selectPeriodOperatingExpenses,
  selectPeriodServiceProfit,
} from './profitSelectors';

describe('profitSelectors', () => {
  const mockPurchases: OperationsTransactionData[] = [
    {
      id: 'p1',
      date: '2026-01-10',
      type: 'PURCHASE',
      category: 'Tuvar',
      weight: 10000,
      amount: 100000,
      cashPaid: 100000,
      remainingDue: 0,
      vendorName: 'Supplier A',
    },
    {
      id: 'p2',
      date: '2026-02-05',
      type: 'PURCHASE',
      category: 'Tuvar',
      weight: 5000,
      amount: 55000,
      cashPaid: 55000,
      remainingDue: 0,
      vendorName: 'Supplier B',
    },
  ];

  const mockSales: SaleTransactionData[] = [
    {
      id: 's1',
      date: '2026-01-20',
      type: 'SALE',
      category: 'Tuvar',
      customerId: 'c1',
      weight: 4000,
      amount: 48000,
      cashPaid: 48000,
      remainingDue: 0,
    },
    {
      id: 's2',
      date: '2026-02-15',
      type: 'SALE',
      category: 'Tuvar',
      customerId: 'c2',
      weight: 6000,
      amount: 78000,
      cashPaid: 78000,
      remainingDue: 0,
    },
  ];

  const mockServices: ServiceTransactionData[] = [
    {
      id: 'srv1',
      date: '2026-01-25',
      type: 'SERVICE',
      category: 'Pickup',
      customerId: 'c1',
      amount: 10000,
      cashPaid: 10000,
      remainingDue: 0,
    },
  ];

  const mockFuel: ExpenseTransactionData = {
    id: 'srv-fuel',
    date: '2026-01-26',
    type: 'EXPENSE',
    category: 'Fuel',
    amount: 4000,
    cashPaid: 4000,
    remainingDue: 0,
  };

  const mockExpenses: ExpenseTransactionData[] = [
    {
      id: 'exp1',
      date: '2026-01-28',
      type: 'EXPENSE',
      category: 'Others',
      amount: 2000,
      cashPaid: 2000,
      remainingDue: 0,
    },
  ];

  const allMockTransactions = [
    ...mockPurchases,
    ...mockSales,
    ...mockServices,
    mockFuel,
    ...mockExpenses,
  ];

  function createMockState(
    year: number,
    month: number,
    filterMode: 'month' | 'ytd' | 'all' = 'month',
  ): RootState {
    const rawMonthlyStock = calculateMonthlyStockFromTransactions(
      allMockTransactions,
      {},
      2026,
      1,
    );

    return {
      timeline: {
        selectedYear: year,
        selectedMonth: month,
        filterMode,
      },
      api: {
        queries: {
          'getCustomerTransactions(undefined)': {
            status: 'fulfilled',
            data: [...mockSales, ...mockServices],
            isLoading: false,
          },
          'getOperationTransactions(undefined)': {
            status: 'fulfilled',
            data: [...mockPurchases, mockFuel, ...mockExpenses],
            isLoading: false,
          },
        },
      },
      stock: rawMonthlyStock,
    } as unknown as RootState;
  }

  it('selectCalculatedMonthlyStock computes rolling monthly closing stock', () => {
    const state = createMockState(2026, 0, 'month');
    const monthlyStock = selectCalculatedMonthlyStock(state);

    // 2026-01: bought 10,000 kg Tuvar @ ₹10/kg (₹100,000), sold 4,000 kg @ ₹12/kg (₹48,000)
    // Closing stock = 6,000 kg @ ₹10/kg = ₹60,000
    expect(monthlyStock['2026-01']?.Tuvar?.weight).toBe(6000);
    expect(monthlyStock['2026-01']?.Tuvar?.amount).toBe(60000);

    // 2026-02: opened with 6,000 kg (₹60,000) + bought 5,000 kg (₹55,000)
    // Total available = 11,000 kg (₹115,000) -> Avg Rate = ₹10.4545/kg
    // Sold 6,000 kg -> Closing stock = 5,000 kg @ ₹10.4545/kg ≈ ₹52,272.73
    expect(monthlyStock['2026-02']?.Tuvar?.weight).toBe(5000);
    expect(Math.round(monthlyStock['2026-02']?.Tuvar?.amount || 0)).toBe(52273);
  });

  it('selectOpeningStockForPeriod returns N0 - 1 closing stock', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const janOpening = selectOpeningStockForPeriod(stateJan);
    expect(janOpening).toEqual({});

    const stateFeb = createMockState(2026, 1, 'month');
    const febOpening = selectOpeningStockForPeriod(stateFeb);
    expect(febOpening?.Tuvar?.weight).toBe(6000);
    expect(febOpening?.Tuvar?.amount).toBe(60000);
  });

  it('selectPeriodCommissionProfit computes COGS, gross sales, and gross commission', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const commission = selectPeriodCommissionProfit(stateJan);

    // Jan: Sold 4,000 kg for ₹48,000. Avg buying rate = ₹10/kg -> COGS = ₹40,000 -> Gross Profit = ₹8,000
    expect(commission.totalSales.amount).toBe(48000);
    expect(commission.totalCostOfGoodsSold).toBe(40000);
    expect(commission.totalGrossCommissionProfit).toBe(8000);
    expect(commission.byCrop.Tuvar?.sales.weight).toBe(4000);
    expect(commission.byCrop.Tuvar?.totalAvailableStock.weightedRate).toBe(10);
  });

  it('selectPeriodServiceProfit computes pickup revenue minus fuel expenses', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const serviceProfit = selectPeriodServiceProfit(stateJan);

    // PickUp: ₹10,000 income - ₹4,000 diesel expense = ₹6,000 net
    expect(serviceProfit.serviceIncome).toBe(10000);
    expect(serviceProfit.fuelExpenses).toBe(4000);
    expect(serviceProfit.netServiceProfit).toBe(6000);
  });

  it('selectPeriodOperatingExpenses computes non-fuel expenses', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const expenses = selectPeriodOperatingExpenses(stateJan);
    expect(expenses).toBe(2000);
  });

  it('selectPeriodExpectedProfitSummary computes full net operating profit', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const summary = selectPeriodExpectedProfitSummary(stateJan);

    // Commission (8,000) + Service Net (6,000) - Operating Expenses (2,000) = ₹12,000
    expect(summary.commission.totalGrossCommissionProfit).toBe(8000);
    expect(summary.service.netServiceProfit).toBe(6000);
    expect(summary.operatingExpenses).toBe(2000);
    expect(summary.netOperatingProfit).toBe(12000);
  });

  it('selectCumulativeExpectedProfitSummary calculates all-time cumulative profit from transactions', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const cumulative = selectCumulativeExpectedProfitSummary(stateJan);

    expect(cumulative.netOperatingProfit).toBeDefined();
    expect(cumulative.commission.totalGrossCommissionProfit).toBeDefined();
    expect(cumulative.service.netServiceProfit).toBeDefined();
  });

  it('selectEstimatedProfitMetrics formats metrics correctly for Home page', () => {
    const stateJan = createMockState(2026, 0, 'month');
    const metrics = selectEstimatedProfitMetrics(stateJan);

    expect(metrics.grossCommission).toBe(8000);
    expect(metrics.pickupNet).toBe(6000);
    expect(metrics.operatingExpenses).toBe(2000);
    expect(metrics.netProfit).toBe(12000);
  });
});
