import { Provider } from 'react-redux';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { store } from '../../store';
import {
  ActivityDetailDrawer,
  ActivityEditDrawer,
  ActivityFilterBar,
  ActivityItemCard,
  ActivityList,
  ActivityMetricsCard,
  ActivityPeriodBar,
} from './components';

describe('Activity Page Modular Components', () => {
  it('renders ActivityMetricsCard with proper rupee and weight formatting', () => {
    const html = renderToStaticMarkup(
      <ActivityMetricsCard
        totalCount={42}
        totalAmount={350000}
        totalWeight={45000}
        cashAmount={200000}
        creditAmount={150000}
        periodLabel="January 2026"
        categoryLabel="Sales"
      />,
    );

    expect(html).toContain('Activity Summary • Sales');
    expect(html).toContain('42 Records');
    expect(html).toContain('₹3,50,000');
    expect(html).toContain('45,000 kg');
    expect(html).toContain('Cash Paid:');
    expect(html).toContain('Remaining Due:');
    expect(html).toContain('hs-activity-metrics-card');
  });

  it('renders ActivityFilterBar with All, Sales, Payments, and Others filter tabs', () => {
    const html = renderToStaticMarkup(
      <ActivityFilterBar
        searchTerm="Ramesh"
        onSearchChange={() => {}}
        filterType="sales"
        onFilterTypeChange={() => {}}
        allCount={55}
        salesCount={35}
        paymentsCount={12}
        othersCount={8}
        onResetFilters={() => {}}
      />,
    );

    expect(html).toContain('Search by customer, vendor, note, ID...');
    expect(html).toContain('value="Ramesh"');
    expect(html).toContain('All (55)');
    expect(html).toContain('Sales (35)');
    expect(html).toContain('Payments (12)');
    expect(html).toContain('Others (8)');
    expect(html).toContain('Reset');
    expect(html).toContain('hs-activity-filter-bar');
  });

  it('renders ActivityItemCard for a sale transaction with derived rate in ₹/Kg and weight in Kg', () => {
    const saleTx = {
      id: 'tx_sale_001',
      date: '2026-01-15',
      type: 'SALE' as const,
      category: 'Tuvar' as const,
      weight: 1000,
      amount: 10500,
      cashPaid: 5000,
      remainingDue: 5500,
      customerId: 'cust_101',
      customerName: 'Sureshbhai Patel',
      note: 'Delivered at farm gate',
    };

    const html = renderToStaticMarkup(
      <ActivityItemCard transaction={saleTx} />,
    );

    expect(html).toContain('Sale: Tuvar');
    expect(html).toContain('Sureshbhai Patel');
    expect(html).toContain('1,000 kg');
    expect(html).toContain('₹10.5/Kg');
    expect(html).toContain('₹10,500');
    expect(html).toContain('Partial Credit');
    expect(html).toContain('hs-activity-item-card');
  });

  it('renders ActivityItemCard for a payment transaction', () => {
    const paymentTx = {
      id: 'tx_pay_002',
      date: '2026-01-18',
      type: 'PAYMENT' as const,
      amount: 25000,
      cashPaid: 25000,
      remainingDue: 0,
      customerId: 'cust_101',
      customerName: 'Sureshbhai Patel',
    };

    const html = renderToStaticMarkup(
      <ActivityItemCard transaction={paymentTx} />,
    );

    expect(html).toContain('Payment Received');
    expect(html).toContain('Sureshbhai Patel');
    expect(html).toContain('₹25,000');
    expect(html).toContain('Payment');
  });

  it('renders ActivityItemCard with Cash and Credit badges accurately', () => {
    const cashSaleTx = {
      id: 'tx_sale_cash',
      date: '2026-01-20',
      type: 'SALE' as const,
      category: 'Chana' as const,
      weight: 2000,
      amount: 20000,
      cashPaid: 20000,
      remainingDue: 0,
      customerId: 'cust_102',
      customerName: 'Ramesh Patel',
    };

    const fullCreditSaleTx = {
      id: 'tx_sale_credit',
      date: '2026-01-22',
      type: 'SALE' as const,
      category: 'Tuvar' as const,
      weight: 1500,
      amount: 15000,
      cashPaid: 0,
      remainingDue: 15000,
      customerId: 'cust_103',
      customerName: 'Dineshbhai',
    };

    const cashHtml = renderToStaticMarkup(
      <ActivityItemCard transaction={cashSaleTx} />,
    );
    expect(cashHtml).toContain('Cash');

    const creditHtml = renderToStaticMarkup(
      <ActivityItemCard transaction={fullCreditSaleTx} />,
    );
    expect(creditHtml).toContain('Credit');
  });

  it('renders ActivityList with empty state when list is empty', () => {
    const html = renderToStaticMarkup(<ActivityList transactions={[]} />);

    expect(html).toContain('No Transactions Found');
    expect(html).toContain(
      'No registered activity matches your active search and filter criteria.',
    );
  });

  it('renders ActivityDetailDrawer with all transaction metadata', () => {
    const tx = {
      id: 'tx_detail_003',
      date: '2026-02-10',
      type: 'PURCHASE' as const,
      category: 'Chana' as const,
      weight: 5000,
      amount: 42500,
      cashPaid: 42500,
      remainingDue: 0,
      vendorName: 'Kishan Mandi',
      note: 'Batch A quality certified',
    };

    render(
      <ActivityDetailDrawer
        isOpen={true}
        transaction={tx}
        onClose={() => {}}
      />,
    );

    const html = document.body.innerHTML;
    expect(html).toContain('Transaction Details');
    expect(html).toContain('tx_detail_003');
    expect(html).toContain('Kishan Mandi');
    expect(html).toContain('5,000 kg');
    expect(html).toContain('₹8.5 / Kg');
    expect(html).toContain('₹42,500');
    expect(html).toContain('Batch A quality certified');
  });

  it('renders ActivityPeriodBar properly', () => {
    const html = renderToStaticMarkup(
      <ActivityPeriodBar
        filterMode="month"
        selectedMonth={1}
        selectedYear={2026}
        onFilterModeChange={() => {}}
        onMonthChange={() => {}}
      />,
    );

    expect(html).toContain('Monthly');
    expect(html).toContain('YTD 2026');
    expect(html).toContain('hs-activity-period-bar');
  });

  it('renders ActivityDetailDrawer with Edit Transaction button when onEdit is provided', () => {
    const tx = {
      id: 'tx_detail_004',
      date: '2026-03-01',
      type: 'SALE' as const,
      category: 'Grass' as const,
      weight: 2000,
      amount: 18000,
      cashPaid: 18000,
      remainingDue: 0,
      customerId: 'cust_01',
      customerName: 'Suresh Patel',
    };

    render(
      <ActivityDetailDrawer
        isOpen={true}
        transaction={tx}
        onClose={() => {}}
        onEdit={() => {}}
      />,
    );

    const html = document.body.innerHTML;
    expect(html).toContain('Edit Transaction');
    expect(html).toContain('Close');
  });

  it('renders ActivityEditDrawer form with fields and summary for editing a transaction', () => {
    const tx = {
      id: 'tx_edit_001',
      date: '2026-03-02',
      type: 'SALE' as const,
      category: 'Tuvar' as const,
      weight: 3000,
      amount: 27000,
      cashPaid: 15000,
      remainingDue: 12000,
      customerId: 'cust_02',
      customerName: 'Ramesh Patel',
      note: 'Advance payment received',
    };

    render(
      <Provider store={store}>
        <ActivityEditDrawer
          isOpen={true}
          transaction={tx}
          onClose={() => {}}
          onSave={async () => {}}
        />
      </Provider>,
    );

    const html = document.body.innerHTML;
    expect(html).toContain('Edit Transaction');
    expect(html).toContain('Sale');
    expect(html).toContain('Save Changes');
    expect(html).toContain('Cancel');
    expect(html).toContain('₹27,000');
    expect(html).toContain('₹15,000');
    expect(html).toContain('₹12,000');
    expect(html).toContain('₹9 / Kg');
  });
});
