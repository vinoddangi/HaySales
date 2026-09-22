import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPendingPreviousYearRecords } from '../../api';
import {
  calculateCustomerOutstandingMetrics,
  calculateDashboardMetrics,
  calculateItemBreakdowns,
  calculateProfitMetrics,
  filterTransactionsByPeriod,
} from '../../business/dashboardBusiness';
import { BackupWarningBanner } from '../../components/common/BackupWarningBanner';
import { Fab } from '../../components/common/Fab';
import { PageContainer } from '../../components/common/PageContainer';
import { PeriodFilterBar as DashboardFilterBar } from '../../components/common/PeriodFilterBar';
import { Text } from '../../components/common/Text';
import { Flex } from '../../components/layout/Flex';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  useGetAllTransactionsQuery,
  useGetBackupStatusQuery,
  useGetCustomersQuery,
  useGetMonthlyRolloutStatusQuery,
} from '../../store/slices/customersApi';
import { setFilterMode, setSelectedMonth } from '../../store/slices/uiSlice';
import { DashboardBreakdown } from './components/DashboardBreakdown';
import { DashboardMetricCards } from './components/DashboardMetricCards';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();

  // Period Filter States: 'month' (default current month) or 'ytd' persisted globally
  const filterMode = useAppSelector((state) => state.ui.filterMode);
  const selectedMonth = useAppSelector((state) => state.ui.selectedMonth);

  // Fetch all transactions across customers & purchases
  const { data: allTransactions = [], isLoading } =
    useGetAllTransactionsQuery();

  // Fetch customers list for running outstanding calculations
  const { data: customers = [] } = useGetCustomersQuery();

  // Fetch monthly rollout status for historical snapshot references
  const { data: rolloutStatus } = useGetMonthlyRolloutStatusQuery();

  // Fetch backup metadata status
  const { data: backupStatus } = useGetBackupStatusQuery();

  // Check if previous year records are pending backup
  const hasPendingBackup = useMemo(() => {
    return hasPendingPreviousYearRecords(
      allTransactions,
      currentYear,
      backupStatus,
    );
  }, [allTransactions, currentYear, backupStatus]);

  // Filter transactions based on active period via Business Layer
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPeriod(
      allTransactions,
      filterMode,
      selectedMonth,
      currentDate,
    );
  }, [allTransactions, filterMode, selectedMonth, currentDate]);

  // Aggregate metrics, customer outstanding, profit & item breakdown via Business Layer
  const { metrics, itemBreakdown, customerOutstanding, profit } =
    useMemo(() => {
      const computedMetrics = calculateDashboardMetrics(filteredTransactions);
      const computedBreakdowns = calculateItemBreakdowns(
        allTransactions,
        filteredTransactions,
        {
          mode: filterMode,
          selectedMonth,
          year: currentYear,
        },
      );
      const computedOutstanding = calculateCustomerOutstandingMetrics(
        customers,
        filteredTransactions,
        {
          mode: filterMode,
          selectedMonth,
          year: currentYear,
          rolloutStatus,
        },
      );
      const computedProfit = calculateProfitMetrics(allTransactions, {
        mode: filterMode,
        selectedMonth,
        year: currentYear,
        totalSalesAmount: computedMetrics.totalSalesAmount,
        rolloutStatus,
      });

      return {
        metrics: computedMetrics,
        itemBreakdown: computedBreakdowns,
        customerOutstanding: computedOutstanding,
        profit: computedProfit,
      };
    }, [
      customers,
      rolloutStatus,
      allTransactions,
      filteredTransactions,
      filterMode,
      selectedMonth,
      currentYear,
    ]);

  const getPeriodLabel = () => {
    if (filterMode === 'ytd') {
      return `YTD ${currentYear}`;
    }
    const d = new Date(currentYear, selectedMonth, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* Pending Annual Backup Banner */}
      {hasPendingBackup && <BackupWarningBanner currentYear={currentYear} />}

      {/* Header */}
      <Flex direction="column" gap="xs" fullWidth className="pt-1">
        <Flex align="center" gap="xs">
          <Text styleAs="h2" weight="black">
            Business Overview
          </Text>
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </Flex>
        <Text styleAs="caption" appearance="secondary" weight="medium">
          Performance for{' '}
          <strong className="text-m3-primary">{getPeriodLabel()}</strong>
        </Text>
      </Flex>

      {/* Top Filter Bar: Current Month, YTD, Month Dropdown */}
      <DashboardFilterBar
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        onFilterModeChange={(mode) => dispatch(setFilterMode(mode))}
        onMonthChange={(month) => dispatch(setSelectedMonth(month))}
      />

      {/* Key Metric Cards */}
      <DashboardMetricCards
        metrics={metrics}
        profit={profit}
        customerOutstanding={customerOutstanding}
        periodMode={filterMode}
        periodLabel={getPeriodLabel()}
        isLoading={isLoading}
      />

      {/* Settlement Split & Item Breakdown */}
      <DashboardBreakdown
        itemBreakdown={itemBreakdown}
        totalSales={metrics.totalSalesAmount}
        salesOnCash={metrics.salesOnCash}
        salesOnCredit={metrics.salesOnCredit}
        servicesReceived={metrics.servicesReceived}
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
