import { describe, expect, it } from 'vitest';
import { Customer, CustomerTransactionData } from '../models';
import {
  calculateMonthlyCustomerOutstandings,
  createBaselineCustomerOutstanding,
  getCustomerOutstandingForMonth,
} from './customerOutstandingBusiness';

describe('customerOutstandingBusiness - Monthly Customer Outstandings by YYYY-MM', () => {
  const sampleCustomers: Customer[] = [
    { id: 'c1', name: 'Ramesh Patel', openingDue: 10000 },
    { id: 'c2', name: 'Suresh Kumar', openingDue: 5000 },
    { id: 'c3', name: 'Dinesh Shah', openingDue: 0 },
  ];

  it('creates baseline December 2025 (2025-12) customer outstanding state', () => {
    const baseline = createBaselineCustomerOutstanding(sampleCustomers);

    expect(baseline.period).toBe('2025-12');
    expect(baseline.totalOutstanding).toBe(15000);
    expect(baseline.customersWithDuesCount).toBe(2);
    expect(baseline.byCustomer['c1'].outstanding).toBe(10000);
    expect(baseline.byCustomer['c2'].outstanding).toBe(5000);
    expect(baseline.byCustomer['c3'].outstanding).toBe(0);
  });

  it('calculates monthly customer outstandings across multiple months with sales, services, and payments', () => {
    const sampleTxs: CustomerTransactionData[] = [
      // January transactions
      {
        id: 'tx1',
        date: '2026-01-10',
        type: 'SALE',
        category: 'Tuvar',
        customerId: 'c1',
        weight: 1000,
        amount: 20000,
        cashPaid: 5000, // credit added = 15000
        remainingDue: 15000,
      },
      {
        id: 'tx2',
        date: '2026-01-15',
        type: 'PAYMENT',
        customerId: 'c2',
        amount: 3000, // payment = 3000
        cashPaid: 3000,
        remainingDue: 0,
      },
      // February transactions
      {
        id: 'tx3',
        date: '2026-02-05',
        type: 'SERVICE',
        category: 'Pickup',
        customerId: 'c3',
        amount: 4000,
        cashPaid: 0, // credit added = 4000
        remainingDue: 4000,
      },
      {
        id: 'tx4',
        date: '2026-02-12',
        type: 'PAYMENT',
        customerId: 'c1',
        amount: 10000, // payment = 10000
        cashPaid: 10000,
        remainingDue: 0,
      },
    ];

    const monthlyState = calculateMonthlyCustomerOutstandings(
      sampleCustomers,
      sampleTxs,
    );

    // Baseline: 2025-12
    expect(monthlyState['2025-12'].totalOutstanding).toBe(15000);

    // January 2026 ('2026-01'):
    // c1: 10000 opening + 15000 credit = 25000
    // c2: 5000 opening - 3000 payment = 2000
    // c3: 0
    // Total = 27000
    const jan = getCustomerOutstandingForMonth(monthlyState, 2026, 1);
    expect(jan).toBeDefined();
    expect(jan?.totalOutstanding).toBe(27000);
    expect(jan?.byCustomer['c1'].outstanding).toBe(25000);
    expect(jan?.byCustomer['c2'].outstanding).toBe(2000);
    expect(jan?.byCustomer['c3'].outstanding).toBe(0);
    expect(jan?.periodCreditAdded).toBe(15000);
    expect(jan?.periodCollections).toBe(3000);
    expect(jan?.netChange).toBe(12000);
    expect(jan?.customersWithDuesCount).toBe(2);

    // February 2026 ('2026-02'):
    // c1: 25000 - 10000 payment = 15000
    // c2: 2000
    // c3: 0 + 4000 pickup service = 4000
    // Total = 21000
    const feb = getCustomerOutstandingForMonth(monthlyState, 2026, 2);
    expect(feb).toBeDefined();
    expect(feb?.totalOutstanding).toBe(21000);
    expect(feb?.byCustomer['c1'].outstanding).toBe(15000);
    expect(feb?.byCustomer['c2'].outstanding).toBe(2000);
    expect(feb?.byCustomer['c3'].outstanding).toBe(4000);
    expect(feb?.periodCreditAdded).toBe(4000);
    expect(feb?.periodCollections).toBe(10000);
    expect(feb?.netChange).toBe(-6000);
    expect(feb?.customersWithDuesCount).toBe(3);
  });
});
