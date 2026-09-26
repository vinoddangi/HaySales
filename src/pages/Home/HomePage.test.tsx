import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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

describe('Modular Dashboard Cards', () => {
  it('renders TotalSalesCard with proper rupee and weight formatting', () => {
    const html = renderToStaticMarkup(
      <TotalSalesCard
        amount={125000}
        weight={15000}
        invoicesCount={12}
        avgRate={8.33}
      />,
    );

    expect(html).toContain('Total Sales');
    expect(html).toContain('12 Invoices');
    expect(html).toContain('15,000 kg');
    expect(html).toContain('8.33');
    expect(html).toContain('hs-total-sales-card');
  });

  it('renders TotalPurchasesCard with proper rupee and weight formatting', () => {
    const html = renderToStaticMarkup(
      <TotalPurchasesCard
        amount={95000}
        weight={14000}
        ordersCount={8}
        avgRate={6.79}
      />,
    );

    expect(html).toContain('Total Purchases');
    expect(html).toContain('8 Orders');
    expect(html).toContain('14,000 kg');
    expect(html).toContain('6.79');
    expect(html).toContain('hs-total-purchases-card');
  });

  it('renders SalesOnCashCard and SalesOnCreditCard with percentage badges', () => {
    const htmlCash = renderToStaticMarkup(
      <SalesOnCashCard amount={60000} percentage={60} />,
    );
    expect(htmlCash).toContain('Sales on Cash');
    expect(htmlCash).toContain('60%');
    expect(htmlCash).toContain('hs-sales-cash-card');

    const htmlCredit = renderToStaticMarkup(
      <SalesOnCreditCard amount={40000} percentage={40} />,
    );
    expect(htmlCredit).toContain('Sales on Credit');
    expect(htmlCredit).toContain('40%');
    expect(htmlCredit).toContain('hs-sales-credit-card');
  });

  it('renders EstimatedProfitCard with 3 sub-pills', () => {
    const html = renderToStaticMarkup(
      <EstimatedProfitCard
        netProfit={45000}
        profitMarginPct={36.0}
        grossCommission={30000}
        pickupNet={20000}
        operatingExpenses={5000}
        periodLabel="January 2026"
      />,
    );

    expect(html).toContain('Estimated Net Profit');
    expect(html).toContain('36.0% Margin');
    expect(html).toContain('Trading Margin');
    expect(html).toContain('Pickup Net');
    expect(html).toContain('Expenses');
    expect(html).toContain('hs-estimated-profit-card');
  });

  it('renders CustomerOutstandingCard with 3 sub-pills', () => {
    const html = renderToStaticMarkup(
      <CustomerOutstandingCard
        totalOutstanding={185000}
        customersWithDuesCount={14}
        periodCreditAdded={40000}
        periodCollections={25000}
        netChange={15000}
        periodLabel="January 2026"
      />,
    );

    expect(html).toContain('Customer Outstanding');
    expect(html).toContain('14 Due');
    expect(html).toContain('Credit Added');
    expect(html).toContain('Collected');
    expect(html).toContain('Net Change');
    expect(html).toContain('hs-customer-outstanding-card');
  });

  it('renders CashInHandCard with Total Assets and Liabilities sub-cards', () => {
    const html = renderToStaticMarkup(
      <CashInHandCard
        cashInHand={825000}
        cashAdjustment={12000}
        customerReceivables={185000}
        closingStockValue={140000}
        fixedAssetsValue={1084800}
        totalAssets={2234800}
        totalLiabilities={0}
        partnerCapital={2250000}
        retainedProfit={-15200}
      />,
    );

    expect(html).toContain('Cash in Hand');
    expect(html).toContain('Total Assets');
    expect(html).toContain('Liabilities &amp; Capital');
    expect(html).toContain('Fixed Assets:');
    expect(html).toContain('Partner Capital:');
    expect(html).toContain('hs-cash-in-hand-card');
  });

  it('renders NetCashflowCard with Cash In and Out sub-cards', () => {
    const html = renderToStaticMarkup(
      <NetCashflowCard
        netCashflow={35000}
        totalCashIn={85000}
        paymentsReceived={25000}
        salesOnCash={50000}
        servicesReceived={10000}
        totalCashOut={50000}
        purchaseOnCash={40000}
        expensesOnCash={10000}
      />,
    );

    expect(html).toContain('Net Cashflow');
    expect(html).toContain('Cash In');
    expect(html).toContain('Cash Out');
    expect(html).toContain('hs-net-cashflow-card');
  });

  it('renders RecentActivityCard with transactions', () => {
    const html = renderToStaticMarkup(
      <RecentActivityCard
        transactions={[
          {
            id: 'tx1',
            type: 'SALE',
            category: 'Tuvar',
            weight: 500,
            amount: 5000,
            cashPaid: 5000,
            remainingDue: 0,
            customerId: 'c1',
            customerName: 'Ramesh Patel',
            date: '2026-01-15',
          },
          {
            id: 'tx2',
            type: 'PAYMENT',
            amount: 2500,
            cashPaid: 2500,
            remainingDue: 0,
            customerId: 'c1',
            customerName: 'Ramesh Patel',
            date: '2026-01-16',
          },
        ]}
      />,
    );

    expect(html).toContain('Recent Activity &amp; Payments');
    expect(html).toContain('Ramesh Patel');
    expect(html).toContain('500 kg');
    expect(html).toContain('hs-recent-activity-card');
  });

  it('renders PeriodFilterBar properly', () => {
    const html = renderToStaticMarkup(
      <PeriodFilterBar
        filterMode="month"
        selectedMonth={0}
        selectedYear={2026}
        onFilterModeChange={() => {}}
        onMonthChange={() => {}}
      />,
    );

    expect(html).toContain('Monthly');
    expect(html).toContain('YTD 2026');
    expect(html).toContain('hs-period-filter-bar');
  });
});
