import React from 'react';
import { Flex } from '../../components/layouts/Flex';
import { Text } from '../../components/Text';
import { PageContainer } from '../../views/PageContainer';
import './ActivityPage.css';
import {
  ActivityDetailDrawer,
  ActivityFilterBar,
  ActivityList,
  ActivityMetricsCard,
  ActivityPeriodBar,
} from './components';
import { useActivityPage } from './useActivityPage';

export const ActivityPage: React.FC = () => {
  const {
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    filterMode,
    selectedMonth,
    selectedYear,
    periodLabel,
    categoryLabel,
    allCount,
    salesCount,
    paymentsCount,
    othersCount,
    transactions,
    metrics,
    selectedTx,
    handleFilterTypeChange,
    handleResetFilters,
    handleFilterModeChange,
    handleMonthChange,
    handleOpenDetail,
    handleCloseDetail,
  } = useActivityPage();

  return (
    <PageContainer spacing="md" bottomPadding="lg" className="hs-activity-page">
      {/* 1. Page Header */}
      <Flex
        direction="column"
        gap="none"
        fullWidth
        className="hs-activity-page__header"
      >
        <Text as="h2" variant="headline-sm" weight="bold">
          Activity &amp; Audit Log
        </Text>
        <Text variant="body-md" appearance="secondary">
          Complete ledger history across sales, purchases, payments, and
          expenses
        </Text>
      </Flex>

      {/* 2. Period Filter Bar (Month / YTD / All-Time) */}
      <ActivityPeriodBar
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />

      {/* 3. Summary Metrics Card */}
      <ActivityMetricsCard
        totalCount={metrics.totalCount}
        totalAmount={metrics.totalAmount}
        totalWeight={metrics.totalWeight}
        cashAmount={metrics.cashAmount}
        creditAmount={metrics.creditAmount}
        periodLabel={periodLabel}
        categoryLabel={categoryLabel}
      />

      {/* 4. Filter & Search Bar: All, Sales, Payments, Others */}
      <ActivityFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={handleFilterTypeChange}
        allCount={allCount}
        salesCount={salesCount}
        paymentsCount={paymentsCount}
        othersCount={othersCount}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Transactions Activity List */}
      <ActivityList
        transactions={transactions}
        isLoading={isLoading}
        onSelectTransaction={handleOpenDetail}
      />

      {/* 6. Transaction Detail Drawer */}
      <ActivityDetailDrawer
        isOpen={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={handleCloseDetail}
      />
    </PageContainer>
  );
};

export default ActivityPage;
