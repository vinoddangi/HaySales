import React from 'react';
import { StackLayout, Text } from '@salt-ds/core';
import { PageContainer } from '../../views/PageContainer';
import { PeriodFilterBar } from '../Home/components/PeriodFilterBar';
import {
  ExpenseFormCard,
  PurchaseFormCard,
  PurchasesOverviewMetricsCard,
  PurchaseTypeSelector,
} from './components';
import './PurchasesPage.css';
import { usePurchasesPage } from './usePurchasesPage';

export const PurchasesPage: React.FC = () => {
  const {
    activeType,
    setActiveType,
    filterMode,
    selectedMonth,
    selectedYear,
    totalPurchaseAmount,
    totalPurchaseWeight,
    totalExpenseAmount,
    totalSoldWeight,
    currentStock,
    avgBuyRate,
    isSaving,
    handleFilterModeChange,
    handleMonthChange,
    handlePurchaseSubmit,
    handleExpenseSubmit,
  } = usePurchasesPage();

  return (
    <PageContainer
      spacing="md"
      bottomPadding="lg"
      className="hs-purchases-page"
    >
      {/* 1. Page Header */}
      <StackLayout gap={0.5} className="hs-purchases-page__header">
        <Text styleAs="h2">
          <b>Purchases & Expenses</b>
        </Text>
        <Text color="secondary">
          Record raw crop procurement and operational farm costs
        </Text>
      </StackLayout>

      {/* 2. Period Filter Bar */}
      <PeriodFilterBar
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onFilterModeChange={handleFilterModeChange}
        onMonthChange={handleMonthChange}
      />

      {/* 3. Header Overview Metrics */}
      <PurchasesOverviewMetricsCard
        totalPurchaseAmount={totalPurchaseAmount}
        totalPurchaseWeight={totalPurchaseWeight}
        totalExpenseAmount={totalExpenseAmount}
        totalSoldWeight={totalSoldWeight}
        currentStock={currentStock}
        avgBuyRate={avgBuyRate}
      />

      {/* 4. Type Selector (Stock Purchase vs Farm Expense) */}
      <PurchaseTypeSelector
        activeType={activeType}
        onChange={(type) => setActiveType(type)}
      />

      {/* 5. Form Card */}
      {activeType === 'PURCHASE' ? (
        <PurchaseFormCard isSaving={isSaving} onSubmit={handlePurchaseSubmit} />
      ) : (
        <ExpenseFormCard isSaving={isSaving} onSubmit={handleExpenseSubmit} />
      )}
    </PageContainer>
  );
};

export default PurchasesPage;
