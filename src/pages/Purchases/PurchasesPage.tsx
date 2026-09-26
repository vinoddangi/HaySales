import React from 'react';
import { Flex } from '../../components/layouts/Flex';
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
      <Flex
        direction="column"
        gap="none"
        fullWidth
        className="hs-purchases-page__header"
      >
        <h2 className="hs-purchases-page__title">Purchases & Expenses</h2>
        <p className="hs-purchases-page__subtitle">
          Record raw crop procurement and operational farm costs
        </p>
      </Flex>

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
