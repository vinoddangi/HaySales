import { describe, expect, it } from 'vitest';
import {
  CustomerTransactionData,
  getRate,
  parseCustomerTransactionFromRaw,
  PaymentTransactionData,
  serializeTransactionToRaw,
} from '../models';
import {
  extractLinkedExpenseEntry,
  requiresDoubleEntry,
} from './transactionBusiness';

describe('extractLinkedExpenseEntry & requiresDoubleEntry', () => {
  it('extracts linked Expense transaction when Payment has discount > 0', () => {
    const paymentTx: CustomerTransactionData = {
      id: 'ctx_pay_1',
      type: 'PAYMENT',
      customerId: 'cust_101',
      customerName: 'Ramesh Patel',
      date: '2026-09-26',
      amount: 4500,
      discount: 500,
      cashPaid: 4500,
      remainingDue: 0,
    };

    const linkedExpense = extractLinkedExpenseEntry(paymentTx);

    expect(linkedExpense).toBeDefined();
    expect(linkedExpense).toEqual({
      id: 'otx_disc_ctx_pay_1',
      type: 'EXPENSE',
      category: 'Discount',
      date: '2026-09-26',
      amount: 500,
      cashPaid: 500,
      remainingDue: 0,
      note: 'Discount on Payment #ctx_pay_1 (Ramesh Patel)',
    });
    expect(requiresDoubleEntry(paymentTx)).toBe(true);
  });

  it('uses fallback ID when transaction object lacks an ID', () => {
    const paymentTx: CustomerTransactionData = {
      type: 'PAYMENT',
      customerId: 'cust_101',
      date: '2026-09-26',
      amount: 1000,
      discount: 100,
      cashPaid: 1000,
      remainingDue: 0,
    };

    const linkedExpense = extractLinkedExpenseEntry(
      paymentTx,
      'ctx_generated_99',
    );

    expect(linkedExpense).toBeDefined();
    expect(linkedExpense?.id).toBe('otx_disc_ctx_generated_99');
    expect(linkedExpense?.amount).toBe(100);
    expect(linkedExpense?.note).toBe('Discount on Payment #ctx_generated_99');
  });

  it('returns undefined when Payment has no discount (single-entry)', () => {
    const paymentTx: CustomerTransactionData = {
      id: 'ctx_pay_2',
      type: 'PAYMENT',
      customerId: 'cust_101',
      date: '2026-09-26',
      amount: 5000,
      discount: 0,
      cashPaid: 5000,
      remainingDue: 0,
    };

    expect(extractLinkedExpenseEntry(paymentTx)).toBeUndefined();
    expect(requiresDoubleEntry(paymentTx)).toBe(false);
  });

  it('returns undefined for Sale transactions (single customer ledger entry)', () => {
    const saleTx: CustomerTransactionData = {
      id: 'ctx_sale_1',
      type: 'SALE',
      category: 'Tuvar',
      weight: 1200,
      customerId: 'cust_101',
      date: '2026-09-26',
      amount: 6000,
      cashPaid: 2000,
      remainingDue: 4000,
    };

    expect(extractLinkedExpenseEntry(saleTx)).toBeUndefined();
    expect(requiresDoubleEntry(saleTx)).toBe(false);
  });

  it('works with typed PaymentTransactionData records', () => {
    const data: PaymentTransactionData = {
      id: 'ctx_pay_3',
      type: 'PAYMENT',
      customerId: 'cust_202',
      customerName: 'Suresh Kumar',
      date: '2026-09-26',
      amount: 8000,
      discount: 250,
      cashPaid: 8000,
      remainingDue: 0,
    };

    const linkedExpense = extractLinkedExpenseEntry(data);
    expect(linkedExpense).toBeDefined();
    expect(linkedExpense?.amount).toBe(250);
    expect(linkedExpense?.id).toBe('otx_disc_ctx_pay_3');
  });

  it('computes derived rate dynamically on crop transactions via getter and getRate', () => {
    const rawSale = {
      id: 'tx_crop_1',
      type: 'SALE',
      category: 'Tuvar',
      weight: 2000,
      amount: 24000,
      date: '2026-09-26',
    };

    const parsed = parseCustomerTransactionFromRaw(rawSale);
    // Dynamic getter
    expect((parsed as any).rate).toBe(12);
    // getRate helper
    expect(getRate(parsed)).toBe(12);

    // Non-crop transaction should not have rate
    const rawService = {
      id: 'tx_srv_1',
      type: 'SERVICE',
      category: 'Pickup',
      amount: 5000,
      date: '2026-09-26',
    };
    const parsedService = parseCustomerTransactionFromRaw(rawService);
    expect((parsedService as any).rate).toBeUndefined();
    expect(getRate(parsedService)).toBeUndefined();

    // Serializer guarantees rate is not included in serialized DB record
    const serialized = serializeTransactionToRaw(parsed);
    expect(serialized.rate).toBeUndefined();
  });
});
