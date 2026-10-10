import React from 'react';
import { Button, GridItem, GridLayout, StackLayout, Text } from '@salt-ds/core';
import { Plus } from 'lucide-react';
import { PageContainer } from '../../views/PageContainer';
import {
  CashInHandCard,
  CustomerOutstandingCard,
  EstimatedProfitCard,
  NetCashflowCard,
  PeriodFilterBar,
  SalesOnCashCard,
  SalesOnCreditCard,
  StockCard,
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
    stockMetrics,
    customerOutstandingMetrics,
    cashflowMetrics,
    balanceSheetMetrics,
    handleFilterModeChange,
    handleMonthChange,
    handleNavigate,
    handleNewSale,
  } = useHomePage();

  return (
    <PageContainer spacing="md" bottomPadding="lg" className="hs-home-page">
      {/* 1. Header Overview & Period Indicator */}
      <StackLayout direction="column" gap={1} className="hs-home-header">
        <StackLayout direction="row" align="center" gap={1}>
          <Text styleAs="h2">
            <b>Business Overview</b>
          </Text>
          <span className="hs-home-header__live-dot" />
        </StackLayout>
        <Text color="secondary">
          Performance for <b>{periodLabel}</b>
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

      {/* 3. Row 1: Top Main Cards (Total Sales & Total Purchases side-by-side) */}
      <GridLayout columns={2} gap={2}>
        <GridItem>
          <TotalSalesCard
            amount={salesMetrics.totalAmount}
            weight={salesMetrics.totalWeight}
            invoicesCount={salesMetrics.count}
            avgRate={salesMetrics.avgRate}
            onClick={() => handleNavigate('/activity?category=SALES')}
          />
        </GridItem>
        <GridItem>
          <TotalPurchasesCard
            amount={purchaseMetrics.totalAmount}
            weight={purchaseMetrics.totalWeight}
            ordersCount={purchaseMetrics.count}
            avgRate={purchaseMetrics.avgRate}
            onClick={() =>
              handleNavigate('/activity?category=PURCHASES_EXPENSES')
            }
          />
        </GridItem>
      </GridLayout>

      {/* 4. Row 2: Sales Breakdown (Sales on Cash & Sales on Credit) */}
      <GridLayout columns={2} gap={2}>
        <GridItem>
          <SalesOnCashCard
            amount={salesMetrics.salesOnCash}
            percentage={salesMetrics.cashPercentage}
            onClick={() =>
              handleNavigate('/activity?category=SALES&nature=CASH')
            }
          />
        </GridItem>
        <GridItem>
          <SalesOnCreditCard
            amount={salesMetrics.salesOnCredit}
            percentage={salesMetrics.creditPercentage}
            onClick={() =>
              handleNavigate('/activity?category=SALES&nature=CREDIT')
            }
          />
        </GridItem>
      </GridLayout>

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

      {/* 9. Crop Stock & Valuation Card */}
      <StockCard
        totalClosingStock={stockMetrics.totalClosingStock}
        totalOpeningStock={stockMetrics.totalOpeningStock}
        totalPurchases={stockMetrics.totalPurchases}
        totalSales={stockMetrics.totalSales}
        totalGrossCommissionProfit={stockMetrics.totalGrossCommissionProfit}
        totalCostOfGoodsSold={stockMetrics.totalCostOfGoodsSold}
        cropItems={stockMetrics.crops}
        periodLabel={periodLabel}
        onClick={() => handleNavigate('/activity?category=PURCHASES_EXPENSES')}
      />

      {/* 10. Floating Action Button for New Sale */}
      <div className="hs-home-fab">
        <Button variant="cta" onClick={handleNewSale}>
          <Plus size={18} />
          New Sale
        </Button>
      </div>
    </PageContainer>
  );
};

export default HomePage;
