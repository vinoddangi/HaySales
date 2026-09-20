import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPendingPreviousYearRecords } from '../../api';
import {
  calculateDashboardMetrics,
  calculateItemBreakdowns,
  filterTransactionsByPeriod,
} from '../../business/dashboardBusiness';
import { BackupWarningBanner } from '../../components/common/BackupWarningBanner';
import { Fab } from '../../components/common/Fab';
import { PageContainer } from '../../components/common/PageContainer';
import {
  PeriodFilterBar as DashboardFilterBar,
  PeriodFilterMode,
} from '../../components/common/PeriodFilterBar';
import { Text } from '../../components/common/Text';
import { Flex } from '../../components/layout/Flex';
import {
  useGetAllTransactionsQuery,
  useGetBackupStatusQuery,
} from '../../store/slices/customersApi';
import { DashboardBreakdown } from './components/DashboardBreakdown';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { RecentTransactionsWidget } from './components/RecentTransactionsWidget';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Period Filter States: 'month' (default current month) or 'ytd'
  const [filterMode, setFilterMode] = useState<PeriodFilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Fetch all transactions across customers & purchases
  const { data: allTransactions = [], isLoading } =
    useGetAllTransactionsQuery();

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

  // Aggregate metrics & item breakdown via Business Layer
  const { metrics, itemBreakdown } = useMemo(() => {
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
    return { metrics: computedMetrics, itemBreakdown: computedBreakdowns };
  }, [
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
        onFilterModeChange={setFilterMode}
        onMonthChange={setSelectedMonth}
      />

      {/* Key Metric Cards */}
      <DashboardMetricCards metrics={metrics} isLoading={isLoading} />

      {/* Settlement Split & Item Breakdown */}
      <DashboardBreakdown
        itemBreakdown={itemBreakdown}
        totalSales={metrics.totalSalesAmount}
        salesOnCash={metrics.salesOnCash}
        salesOnCredit={metrics.salesOnCredit}
      />

      {/* Recent Activity & Payments Stream */}
      <RecentTransactionsWidget
        transactions={filteredTransactions}
        onViewAll={() => navigate('/activity')}
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
