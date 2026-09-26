import { describe, expect, it } from 'vitest';
import { Customer, CustomerTransactionData } from '../../models';
import type { RootState } from '../index';
import {
  selectAvailableOutstandingPeriods,
  selectCustomerBalanceForPeriod,
  selectCustomerOutstandingForMonth,
  selectCustomerOutstandingForPeriod,
  selectCustomerOutstandingState,
} from '../selectors/inputselectors';
import customerOutstandingReducer, {
  resetCustomerOutstanding,
  setCustomerOutstandingState,
  setMonthlyCustomerOutstanding,
  updateCustomerOutstandingFromData,
} from './customerOutstandingSlice';

describe('customerOutstandingSlice & Selectors', () => {
  it('initializes with baseline 2025-12 period', () => {
    const state = customerOutstandingReducer(undefined, { type: '@@INIT' });

    expect(state['2025-12']).toBeDefined();
    expect(state['2025-12'].period).toBe('2025-12');
  });

  it('updates monthly outstanding using setMonthlyCustomerOutstanding', () => {
    const updated = customerOutstandingReducer(
      undefined,
      setMonthlyCustomerOutstanding({
        period: '2026-01',
        data: {
          period: '2026-01',
          totalOutstanding: 45000,
          customersWithDuesCount: 3,
          periodCreditAdded: 20000,
          periodCollections: 5000,
          netChange: 15000,
          byCustomer: {
            c1: {
              customerId: 'c1',
              customerName: 'Ramesh',
              outstanding: 45000,
            },
          },
        },
      }),
    );

    expect(updated['2026-01']?.totalOutstanding).toBe(45000);
    expect(updated['2026-01']?.byCustomer['c1'].outstanding).toBe(45000);
  });

  it('merges state with setCustomerOutstandingState', () => {
    const updated = customerOutstandingReducer(
      undefined,
      setCustomerOutstandingState({
        '2026-02': {
          period: '2026-02',
          totalOutstanding: 30000,
          customersWithDuesCount: 1,
          periodCreditAdded: 10000,
          periodCollections: 25000,
          netChange: -15000,
          byCustomer: {
            c2: {
              customerId: 'c2',
              customerName: 'Suresh',
              outstanding: 30000,
            },
          },
        },
      }),
    );

    expect(updated['2026-02']?.totalOutstanding).toBe(30000);

    const reset = customerOutstandingReducer(
      updated,
      resetCustomerOutstanding(),
    );
    expect(reset['2025-12']).toBeDefined();
    expect(reset['2026-02']).toBeUndefined();
  });

  it('recalculates monthly outstandings from data using updateCustomerOutstandingFromData', () => {
    const sampleCustomers: Customer[] = [
      { id: 'c1', name: 'Ramesh Patel', openingDue: 10000 },
    ];
    const sampleTxs: CustomerTransactionData[] = [
      {
        id: 'tx1',
        date: '2026-01-10',
        type: 'SALE',
        category: 'Tuvar',
        customerId: 'c1',
        weight: 1000,
        amount: 15000,
        cashPaid: 5000, // credit = 10000
        remainingDue: 10000,
      },
    ];

    const updated = customerOutstandingReducer(
      undefined,
      updateCustomerOutstandingFromData({
        customers: sampleCustomers,
        transactions: sampleTxs,
      }),
    );

    expect(updated['2026-01']?.totalOutstanding).toBe(20000);
    expect(updated['2026-01']?.byCustomer['c1'].outstanding).toBe(20000);
  });

  it('provides working selectors for querying customer outstandings', () => {
    const rootState = {
      customerOutstanding: {
        '2025-12': {
          period: '2025-12',
          totalOutstanding: 15000,
          customersWithDuesCount: 1,
          periodCreditAdded: 0,
          periodCollections: 0,
          netChange: 0,
          byCustomer: {
            c1: {
              customerId: 'c1',
              customerName: 'Ramesh',
              outstanding: 15000,
            },
          },
        },
        '2026-01': {
          period: '2026-01',
          totalOutstanding: 25000,
          customersWithDuesCount: 1,
          periodCreditAdded: 15000,
          periodCollections: 5000,
          netChange: 10000,
          byCustomer: {
            c1: {
              customerId: 'c1',
              customerName: 'Ramesh',
              outstanding: 25000,
            },
          },
        },
      },
    } as unknown as RootState;

    expect(selectCustomerOutstandingState(rootState)).toBe(
      rootState.customerOutstanding,
    );
    expect(selectAvailableOutstandingPeriods(rootState)).toEqual([
      '2025-12',
      '2026-01',
    ]);
    expect(
      selectCustomerOutstandingForPeriod('2026-01')(rootState)
        ?.totalOutstanding,
    ).toBe(25000);
    expect(
      selectCustomerOutstandingForMonth(2026, 1)(rootState)?.totalOutstanding,
    ).toBe(25000);
    expect(
      selectCustomerBalanceForPeriod('c1', '2026-01')(rootState)?.outstanding,
    ).toBe(25000);
  });
});
