import React from 'react';
import { StackLayout, Text } from '@salt-ds/core';
import { PageContainer } from '../../views/PageContainer';
import './ActivityPage.css';
import {
  ActivityDetailDrawer,
  ActivityEditDrawer,
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
    editingTx,
    handleFilterTypeChange,
    handleResetFilters,
    handleFilterModeChange,
    handleMonthChange,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenEdit,
    handleCloseEdit,
    handleSaveEdit,
  } = useActivityPage();

  return (
    <PageContainer spacing="md" bottomPadding="lg" className="hs-activity-page">
      {/* 1. Page Header */}
      <StackLayout gap={0.5} className="hs-activity-page__header">
        <Text styleAs="h2">
          <b>Activity & Audit Log</b>
        </Text>
        <Text color="secondary">
          Complete ledger history across sales, purchases, payments, and
          expenses
        </Text>
      </StackLayout>

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
        onEditTransaction={handleOpenEdit}
      />

      {/* 6. Transaction Detail Drawer */}
      <ActivityDetailDrawer
        isOpen={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={handleCloseDetail}
        onEdit={handleOpenEdit}
      />

      {/* 7. Transaction Edit Drawer */}
      <ActivityEditDrawer
        key={editingTx?.id || 'none'}
        isOpen={Boolean(editingTx)}
        transaction={editingTx}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />
    </PageContainer>
  );
};

export default ActivityPage;
