import { describe, expect, it } from 'vitest';
import { Customer, Transaction } from '../types';
import {
  customerCsvColumns,
  purchasesCsvColumns,
  transactionCsvColumns,
} from './dataBackup.api';

describe('dataBackup.api column definitions', () => {
  it('formats customer rows properly', () => {
    const cust: Customer = {
      id: 'cust-10',
      name: 'Ramesh Patel',
      mobile: '9876543210',
      village: 'Sanand',
      creditLimit: 50000,
      outstandingAmount: 12500,
    };

    const headers = customerCsvColumns.map((c) => c.header);
    const values = customerCsvColumns.map((c) => c.accessor(cust));

    expect(headers).toEqual([
      'CustomerID',
      'CustomerName',
      'Mobile',
      'Village',
      'CreditLimit',
      'OutstandingAmount',
    ]);
    expect(values).toEqual([
      'cust-10',
      'Ramesh Patel',
      '9876543210',
      'Sanand',
      50000,
      12500,
    ]);
  });

  it('formats sales transaction rows properly in transactionCsvColumns', () => {
    const sale: Transaction = {
      id: 'sale-1',
      type: 'SALE',
      customerId: 'cust-10',
      customerName: 'Ramesh Patel',
      date: '2026-02-15T10:00:00.000Z',
      category: 'Others',
      weightKg: 1200,
      rate: 10.5,
      amount: 12600,
      cashPaid: 2600,
      remainingDue: 10000,
      note: 'First load',
    };

    const values = transactionCsvColumns.map((c) => c.accessor(sale));
    expect(values[0]).toBe('sale-1');
    expect(values[1]).toBe('cust-10');
    expect(values[2]).toBe('Ramesh Patel');
    expect(values[3]).toBe('SALE');
    expect(values[5]).toBe('Others');
    expect(values[6]).toBe(1200);
    expect(values[7]).toBe(10.5);
    expect(values[8]).toBe(12600);
    expect(values[9]).toBe(2600);
    expect(values[10]).toBe(10000);
  });

  it('formats payments and services properly in transactionCsvColumns', () => {
    const payment: Transaction = {
      id: 'pay-1',
      type: 'PAYMENT',
      customerId: 'cust-10',
      customerName: 'Ramesh Patel',
      date: '2026-02-20T00:00:00.000Z',
      amount: 5000,
      note: 'Partial cash payment',
    };
    const payValues = transactionCsvColumns.map((c) => c.accessor(payment));
    expect(payValues[0]).toBe('pay-1');
    expect(payValues[3]).toBe('PAYMENT');
    expect(payValues[8]).toBe(5000);

    const service: Transaction = {
      id: 'serv-1',
      type: 'SERVICE',
      customerId: '307',
      customerName: 'Retail Customer',
      date: '2026-05-31T00:00:00.000Z',
      category: 'Pickup',
      amount: 80000,
    };
    const servValues = transactionCsvColumns.map((c) => c.accessor(service));
    expect(servValues[0]).toBe('serv-1');
    expect(servValues[3]).toBe('SERVICE');
    expect(servValues[5]).toBe('Pickup');
    expect(servValues[8]).toBe(80000);
  });

  it('formats purchases and expenses properly', () => {
    const purchase: Transaction = {
      id: 'purch-1',
      type: 'PURCHASE',
      date: '2026-03-01T00:00:00.000Z',
      category: 'Others',
      weightKg: 5000,
      rate: 8.5,
      amount: 42500,
      vendorName: 'Supplier A',
    };
    // purchasesCsvColumns: [PurchaseID, Type, Date, Category, WeightKg, Rate, Amount, VendorName, Notes]
    const purchValues = purchasesCsvColumns.map((c) => c.accessor(purchase));
    expect(purchValues[0]).toBe('purch-1');
    expect(purchValues[1]).toBe('PURCHASE');
    expect(purchValues[3]).toBe('Others');
    expect(purchValues[4]).toBe(5000);
    expect(purchValues[5]).toBe(8.5);
    expect(purchValues[6]).toBe(42500);

    const expense: Transaction = {
      id: 'exp-1',
      type: 'EXPENSE',
      date: '2026-03-05T00:00:00.000Z',
      category: 'Fuel',
      amount: 3500,
    };
    const expValues = purchasesCsvColumns.map((c) => c.accessor(expense));
    expect(expValues[0]).toBe('exp-1');
    expect(expValues[1]).toBe('EXPENSE');
    expect(expValues[3]).toBe('Fuel');
    expect(expValues[6]).toBe(3500);
  });
});
