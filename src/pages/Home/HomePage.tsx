import { Plus, RefreshCw } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fab } from '../../components/common/Fab';
import { PageContainer } from '../../components/common/PageContainer';
import {
  PeriodFilterBar as DashboardFilterBar,
  PeriodFilterMode,
} from '../../components/common/PeriodFilterBar';
import { useGetAllTransactionsQuery } from '../../store/slices/customersApi';
import { Transaction } from '../../types';
import { parseTransactionDate } from '../../utils/formatters';
import {
  DashboardBreakdown,
  ItemBreakdownItem,
} from './components/DashboardBreakdown';
import {
  DashboardMetricCards,
  DashboardMetricsData,
} from './components/DashboardMetricCards';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Period Filter States
  const [filterMode, setFilterMode] =
    useState<PeriodFilterMode>('currentMonth');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Fetch all transactions across customers & purchases
  const {
    data: allTransactions = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetAllTransactionsQuery();

  // Filter transactions based on active period
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx: Transaction) => {
      const txDate = parseTransactionDate(tx.date);
      if (!txDate) return false;

      if (filterMode === 'currentMonth') {
        return (
          txDate.getFullYear() === currentYear &&
          txDate.getMonth() === currentMonth
        );
      }

      if (filterMode === 'ytd') {
        return txDate.getFullYear() === currentYear && txDate <= currentDate;
      }

      if (filterMode === 'customMonth') {
        return (
          txDate.getFullYear() === currentYear &&
          txDate.getMonth() === selectedMonth
        );
      }

      return true;
    });
  }, [
    allTransactions,
    filterMode,
    selectedMonth,
    currentYear,
    currentMonth,
    currentDate,
  ]);

  // Aggregate metrics
  const { metrics, itemBreakdown } = useMemo(() => {
    let totalSalesAmount = 0;
    let totalSalesWeightKg = 0;
    let salesCount = 0;
    let salesOnCash = 0;
    let salesOnCredit = 0;

    let totalPurchaseAmount = 0;
    let totalPurchaseWeightKg = 0;
    let purchasesCount = 0;

    let totalExpenseAmount = 0;
    let expensesCount = 0;

    let paymentsReceived = 0;

    const itemMap = new Map<
      string,
      { amount: number; weightKg: number; count: number }
    >();

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'SALE' || tx.type === 'SERVICE') {
        const amt = Number(tx.amount) || 0;
        const wt = Number(tx.weightKg) || 0;
        const cash = Number(tx.cashPaid) || 0;
        const credit =
          tx.remainingDue !== undefined
            ? Number(tx.remainingDue) || 0
            : Math.max(0, amt - cash);

        totalSalesAmount += amt;
        totalSalesWeightKg += wt;
        salesCount += 1;
        salesOnCash += cash;
        salesOnCredit += credit;

        const itemName = (tx.item || 'General').trim();
        const existing = itemMap.get(itemName) || {
          amount: 0,
          weightKg: 0,
          count: 0,
        };
        itemMap.set(itemName, {
          amount: existing.amount + amt,
          weightKg: existing.weightKg + wt,
          count: existing.count + 1,
        });
      } else if (tx.type === 'PURCHASE') {
        const amt = Number(tx.amount) || 0;
        const wt = Number(tx.weightKg) || 0;
        totalPurchaseAmount += amt;
        totalPurchaseWeightKg += wt;
        purchasesCount += 1;
      } else if (tx.type === 'EXPENSE') {
        const amt = Number(tx.amount) || 0;
        totalExpenseAmount += amt;
        expensesCount += 1;
      } else if (tx.type === 'PAYMENT') {
        paymentsReceived += Number(tx.paymentAmount) || Number(tx.amount) || 0;
      }
    });

    const avgSalesRate =
      totalSalesWeightKg > 0 ? totalSalesAmount / totalSalesWeightKg : 0;
    const avgBuyRate =
      totalPurchaseWeightKg > 0
        ? totalPurchaseAmount / totalPurchaseWeightKg
        : 0;
    const totalCashIn = salesOnCash + paymentsReceived;
    const netCashflow =
      totalCashIn - (totalPurchaseAmount + totalExpenseAmount);

    const computedMetrics: DashboardMetricsData = {
      totalSalesAmount,
      totalSalesWeightKg,
      salesCount,
      totalPurchaseAmount,
      totalPurchaseWeightKg,
      purchasesCount,
      totalExpenseAmount,
      expensesCount,
      avgSalesRate,
      avgBuyRate,
      totalCashIn,
      netCashflow,
      salesOnCredit,
      salesOnCash,
      paymentsReceived,
    };

    const purchaseStatsMap = new Map<
      string,
      { amount: number; weightKg: number }
    >();

    allTransactions.forEach((tx) => {
      if (tx.type === 'PURCHASE') {
        const pItem = (tx.item || 'General').trim();
        const existing = purchaseStatsMap.get(pItem) || {
          amount: 0,
          weightKg: 0,
        };
        purchaseStatsMap.set(pItem, {
          amount: existing.amount + (Number(tx.amount) || 0),
          weightKg: existing.weightKg + (Number(tx.weightKg) || 0),
        });
      }
    });

    const breakdownList: ItemBreakdownItem[] = Array.from(itemMap.entries())
      .map(([item, stats]) => {
        const pStats = purchaseStatsMap.get(item);
        const pWeight = pStats?.weightKg || 0;
        const pAmt = pStats?.amount || 0;
        const stockKg = Math.max(0, pWeight - stats.weightKg);
        const avgBuyRate = pWeight > 0 ? pAmt / pWeight : 0;

        return {
          item,
          amount: stats.amount,
          weightKg: stats.weightKg,
          count: stats.count,
          stockKg: pWeight > 0 ? stockKg : undefined,
          avgBuyRate: avgBuyRate > 0 ? avgBuyRate : undefined,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { metrics: computedMetrics, itemBreakdown: breakdownList };
  }, [allTransactions, filteredTransactions]);

  const getPeriodLabel = () => {
    if (filterMode === 'currentMonth') {
      return currentDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
    }
    if (filterMode === 'ytd') {
      return `YTD ${currentYear}`;
    }
    const d = new Date(currentYear, selectedMonth, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black tracking-tight text-m3-on-surface">
              Business Overview
            </h1>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xs font-medium text-m3-on-surface-variant">
            Performance for{' '}
            <strong className="text-m3-primary">{getPeriodLabel()}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-full border border-m3-outline-variant bg-m3-surface-container-low p-2 text-m3-on-surface-variant transition-all hover:bg-m3-surface-container active:scale-95 disabled:opacity-50"
          title="Refresh dashboard metrics"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? 'animate-spin text-m3-primary' : ''}`}
          />
        </button>
      </div>

      {/* Top Filter Bar: Current Month, YTD, Month Dropdown */}
      <DashboardFilterBar
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        onFilterModeChange={setFilterMode}
        onMonthChange={setSelectedMonth}
      />

      {/* Key Metric Cards */}
      <DashboardMetricCards metrics={metrics} isLoading={isLoading} />

      {/* Settlement Split, Item Breakdown & Fast Shortcuts */}
      <DashboardBreakdown
        itemBreakdown={itemBreakdown}
        totalSales={metrics.totalSalesAmount}
        salesOnCash={metrics.salesOnCash}
        salesOnCredit={metrics.salesOnCredit}
        onNavigateToSales={() => navigate('/sales')}
        onNavigateToLedger={() => navigate('/ledger')}
      />

      {/* Quick New Sale Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-30">
        <Fab
          icon={<Plus className="h-6 w-6" />}
          label="New Sale"
          variant="primary"
          size="md"
          onClick={() => navigate('/sales')}
        />
      </div>
    </PageContainer>
  );
};
export default HomePage;
