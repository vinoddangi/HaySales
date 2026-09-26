import { Plus } from 'lucide-react';
import React from 'react';
import { Fab } from '../../components/Fab';
import { Flex } from '../../components/layouts/Flex';
import { Grid } from '../../components/layouts/Grid';
import { PageContainer } from '../../views/PageContainer';
import {
  CashInHandCard,
  CustomerOutstandingCard,
  EstimatedProfitCard,
  NetCashflowCard,
  PeriodFilterBar,
  RecentActivityCard,
  SalesOnCashCard,
  SalesOnCreditCard,
  TotalPurchasesCard,
  TotalSalesCard,
} from './components';
import './HomePage.css';
import { useHomePage } from './useHomePage';

export const HomePage: React.FC = () => {
  const {
    filterMode,
    selectedMonth,
    selectedYear,
    periodLabel,
    salesMetrics,
    purchaseMetrics,
    profitMetrics,
    customerOutstandingMetrics,
    cashflowMetrics,
    balanceSheetMetrics,
    allTransactions,
    handleFilterModeChange,
    handleMonthChange,
    handleNavigate,
    handleNewSale,
  } = useHomePage();

  return (
    <PageContainer spacing="md" bottomPadding="lg" className="hs-home-page">
      {/* 1. Header Overview & Period Indicator */}
      <Flex direction="column" gap="none" fullWidth className="hs-home-header">
        <Flex align="center" gap="xs">
          <h2 className="hs-home-header__title">Business Overview</h2>
          <span className="hs-home-header__live-dot" />
        </Flex>
        <p className="hs-home-header__subtitle">
          Performance for{' '}
          <strong className="hs-home-header__highlight">{periodLabel}</strong>
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

      {/* 3. Row 1: Top Main Cards (Total Sales & Total Purchases) */}
      <Grid columns={1} gap="sm" fullWidth>
        <Grid.Item>
          <TotalSalesCard
            amount={salesMetrics.totalAmount}
            weight={salesMetrics.totalWeight}
            invoicesCount={salesMetrics.count}
            avgRate={salesMetrics.avgRate}
            onClick={() => handleNavigate('/activity?category=SALES')}
          />
        </Grid.Item>
        <Grid.Item>
          <TotalPurchasesCard
            amount={purchaseMetrics.totalAmount}
            weight={purchaseMetrics.totalWeight}
            ordersCount={purchaseMetrics.count}
            avgRate={purchaseMetrics.avgRate}
            onClick={() =>
              handleNavigate('/activity?category=PURCHASES_EXPENSES')
            }
          />
        </Grid.Item>
      </Grid>

      {/* 4. Row 2: Sales Breakdown (Sales on Cash & Sales on Credit) */}
      <Grid columns={2} gap="sm" fullWidth>
        <Grid.Item>
          <SalesOnCashCard
            amount={salesMetrics.salesOnCash}
            percentage={salesMetrics.cashPercentage}
            onClick={() =>
              handleNavigate('/activity?category=SALES&nature=CASH')
            }
          />
        </Grid.Item>
        <Grid.Item>
          <SalesOnCreditCard
            amount={salesMetrics.salesOnCredit}
            percentage={salesMetrics.creditPercentage}
            onClick={() =>
              handleNavigate('/activity?category=SALES&nature=CREDIT')
            }
          />
        </Grid.Item>
      </Grid>

      {/* 5. Row 3: Estimated Net Profit Card */}
      <EstimatedProfitCard
        netProfit={profitMetrics.netProfit}
        profitMarginPct={profitMetrics.profitMarginPct}
        grossCommission={profitMetrics.grossCommission}
        pickupNet={profitMetrics.pickupNet}
        operatingExpenses={profitMetrics.operatingExpenses}
        periodLabel={periodLabel}
        cumulativeProfit={profitMetrics.cumulativeProfit}
        onClick={() => handleNavigate('/profile')}
      />

      {/* 6. Row 4: Customer Outstanding Card */}
      <CustomerOutstandingCard
        totalOutstanding={customerOutstandingMetrics.totalOutstanding}
        customersWithDuesCount={
          customerOutstandingMetrics.customersWithDuesCount
        }
        periodCreditAdded={customerOutstandingMetrics.periodCreditAdded}
        periodCollections={customerOutstandingMetrics.periodCollections}
        netChange={customerOutstandingMetrics.netChange}
        previousOutstanding={customerOutstandingMetrics.previousOutstanding}
        tenorDifference={customerOutstandingMetrics.tenorDifference}
        previousTenorLabel={customerOutstandingMetrics.previousTenorLabel}
        periodLabel={periodLabel}
        onClick={() => handleNavigate('/ledger')}
      />

      {/* 7. Row 5: Balance Sheet & Cash in Hand Card */}
      <CashInHandCard
        cashInHand={balanceSheetMetrics.cashInHand}
        cashAdjustment={balanceSheetMetrics.cashAdjustment}
        customerReceivables={balanceSheetMetrics.customerReceivables}
        closingStockValue={balanceSheetMetrics.closingStockValue}
        fixedAssetsValue={balanceSheetMetrics.fixedAssetsValue}
        totalAssets={balanceSheetMetrics.totalAssets}
        totalLiabilities={balanceSheetMetrics.totalLiabilities}
        partnerCapital={balanceSheetMetrics.partnerCapital}
        retainedProfit={balanceSheetMetrics.retainedProfit}
        onNavigateBalanceSheet={() => handleNavigate('/profile')}
      />

      {/* 8. Row 6: Net Cashflow Card */}
      <NetCashflowCard
        netCashflow={cashflowMetrics.netCashflow}
        totalCashIn={cashflowMetrics.totalCashIn}
        paymentsReceived={cashflowMetrics.paymentsReceived}
        salesOnCash={cashflowMetrics.salesOnCash}
        servicesReceived={cashflowMetrics.servicesReceived}
        totalCashOut={cashflowMetrics.totalCashOut}
        purchaseOnCash={cashflowMetrics.purchaseOnCash}
        expensesOnCash={cashflowMetrics.expensesOnCash}
        onCashInClick={() => handleNavigate('/activity?category=PAYMENTS')}
        onCashOutClick={() =>
          handleNavigate('/activity?category=PURCHASES_EXPENSES')
        }
      />

      {/* 9. Row 7: Recent Activity Card */}
      <RecentActivityCard
        transactions={allTransactions}
        onViewAll={() => handleNavigate('/ledger')}
      />

      {/* 10. Floating Action Button for New Sale */}
      <div className="hs-home-fab">
        <Fab
          icon={<Plus className="hs-home-fab__icon" />}
          label="New Sale"
          variant="primary"
          size="md"
          onClick={handleNewSale}
        />
      </div>
    </PageContainer>
  );
};

export default HomePage;
