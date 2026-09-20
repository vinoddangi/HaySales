import { beforeEach, describe, expect, it } from 'vitest';
import { mockDataStore } from './mockDataStore';

describe('mockDataStore engine', () => {
  beforeEach(() => {
    mockDataStore.resetToDefault();
    mockDataStore.setEnabled(false);
  });

  it('toggles mock mode status correctly', () => {
    expect(mockDataStore.isEnabled()).toBe(false);
    mockDataStore.setEnabled(true);
    expect(mockDataStore.isEnabled()).toBe(true);
    mockDataStore.setEnabled(false);
    expect(mockDataStore.isEnabled()).toBe(false);
  });

  it('returns initial baseline mock data', () => {
    const customers = mockDataStore.getCustomers();
    expect(customers.length).toBeGreaterThanOrEqual(4);
    expect(customers[0].name).toBe('Abbasbhai Chadotar');

    const purchases = mockDataStore.getPurchases();
    expect(purchases.length).toBeGreaterThanOrEqual(2);
  });

  it('ingests customer CSV data correctly', () => {
    const sampleCsv = `CustomerID,CustomerName,Mobile,Village,CreditLimit,OutstandingAmount\r\n101,Ramesh Patel,9898000000,Sanand,60000,15000\r\n102,Haresh Bera,9898000001,Chadotar,45000,8000`;
    const res = mockDataStore.ingestCsv('customers', sampleCsv);

    expect(res.count).toBe(2);
    const customers = mockDataStore.getCustomers();
    expect(customers.length).toBe(2);
    expect(customers[0].name).toBe('Haresh Bera');
    expect(customers[0].outstandingAmount).toBe(8000);
    expect(customers[1].name).toBe('Ramesh Patel');
    expect(customers[1].outstandingAmount).toBe(15000);
  });

  it('ingests sales CSV data and filters by customer', () => {
    const sampleSalesCsv = `TransactionID,CustomerID,CustomerName,Date,Item,WeightKg,Rate,TotalAmount,CashPaid,RemainingDue,Notes\r\nsale_101,1,Bera Hareshbhai,2026-02-10T12:00:00.000Z,Others,1200,10,12000,2000,10000,First slip`;
    const res = mockDataStore.ingestCsv('sales', sampleSalesCsv);

    expect(res.count).toBe(1);
    const customerTx = mockDataStore.getTransactions('1');
    const sales = customerTx.filter((t) => t.type === 'SALE');
    expect(sales.length).toBe(1);
    expect(sales[0].amount).toBe(12000);
    expect(sales[0].remainingDue).toBe(10000);
  });

  it('adds a transaction and automatically updates customer balance in mock state', () => {
    const initialCust = mockDataStore.getCustomers().find((c) => c.id === '1');
    const initialDue = initialCust?.outstandingAmount || 0;

    mockDataStore.addTransaction({
      id: 'new_sale',
      type: 'SALE',
      customerId: '1',
      amount: 5000,
      remainingDue: 5000,
      date: '2026-03-01T12:00:00.000Z',
    });

    const updatedCust = mockDataStore.getCustomers().find((c) => c.id === '1');
    expect(updatedCust?.outstandingAmount).toBe(initialDue + 5000);
  });
});
