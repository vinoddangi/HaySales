import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import {
  buildTransactionSubtitle,
  calculateTransactionRate,
  extractPartyDisplayName,
  formatTransactionRate,
  getTransactionAmountColor,
  getTransactionBadge,
  getTransactionTypeLabel,
  sanitizeCustomerData,
  sanitizeCustomersList,
  sanitizeTransactionDate,
  sanitizeTransactionDisplay,
  sanitizeTransactionsList,
} from './dataSanitizer';

describe('dataSanitizer utils', () => {
  describe('Individual Small Helper Functions', () => {
    describe('extractPartyDisplayName', () => {
      it('extracts customer name for sales, services, payments', () => {
        expect(
          extractPartyDisplayName({ type: 'SALE', customerName: 'Ramesh' }),
        ).toBe('Ramesh');
        expect(
          extractPartyDisplayName({ type: 'SERVICE', customerName: 'Suresh' }),
        ).toBe('Suresh');
        expect(
          extractPartyDisplayName({ type: 'PAYMENT', customerName: 'Kailash' }),
        ).toBe('Kailash');
        expect(extractPartyDisplayName({ type: 'SALE' })).toBe('Customer');
      });

      it('extracts vendor or expense payee for purchase and expense', () => {
        expect(
          extractPartyDisplayName({
            type: 'PURCHASE',
            vendorName: 'Mandi Trader',
          }),
        ).toBe('Mandi Trader');
        expect(extractPartyDisplayName({ type: 'PURCHASE' })).toBe(
          'Stock Procurement',
        );
        expect(
          extractPartyDisplayName({
            type: 'EXPENSE',
            expenseCategory: 'Labor',
          }),
        ).toBe('Labor');
        expect(extractPartyDisplayName({ type: 'EXPENSE' })).toBe(
          'Expense Payee',
        );
      });

      it('handles null/invalid input', () => {
        expect(extractPartyDisplayName(null)).toBe('Unknown');
      });
    });

    describe('sanitizeTransactionDate', () => {
      it('extracts safe date parts', () => {
        const info = sanitizeTransactionDate('2026-09-18T10:00:00.000Z');
        expect(info.year).toBe(2026);
        expect(info.formattedDate).toBeDefined();
        expect(info.isoDate).toContain('2026-09-18');
        expect(info.day).toBeDefined();
        expect(info.month).toBeDefined();
      });

      it('falls back gracefully on null date', () => {
        const info = sanitizeTransactionDate(null);
        expect(info.date).toBeInstanceOf(Date);
        expect(info.formattedDate).toBeDefined();
      });
    });

    describe('calculateTransactionRate and formatTransactionRate', () => {
      it('calculates unit rate per kg without division by zero', () => {
        expect(calculateTransactionRate(4000, 100)).toBe(40);
        expect(calculateTransactionRate(4000, 0, 42)).toBe(42);
        expect(calculateTransactionRate(4000, 0)).toBe(0);
      });

      it('formats unit rate string', () => {
        expect(formatTransactionRate(40)).toBe('₹40.00/kg');
        expect(formatTransactionRate(NaN)).toBe('₹0.00/kg');
      });
    });

    describe('buildTransactionSubtitle', () => {
      it('builds sale and purchase subtitles', () => {
        expect(
          buildTransactionSubtitle({
            type: 'SALE',
            item: 'Chana',
            weightKg: 100,
            amount: 4000,
          }),
        ).toBe('Chana • 100 kg @ ₹40.00/kg');
        expect(
          buildTransactionSubtitle({
            type: 'PURCHASE',
            item: 'Tuvar',
            weightKg: 200,
            amount: 8000,
          }),
        ).toBe('Tuvar • 200 kg @ ₹40.00/kg');
      });

      it('builds service, payment and expense subtitles', () => {
        expect(
          buildTransactionSubtitle({
            type: 'SERVICE',
            item: 'Pickup',
            note: 'Drop off',
          }),
        ).toBe('Service: Pickup • Drop off');
        expect(buildTransactionSubtitle({ type: 'PAYMENT' })).toBe(
          'Payment Received & Dues Settled',
        );
        expect(
          buildTransactionSubtitle({
            type: 'EXPENSE',
            expenseCategory: 'Fuel',
            note: 'Diesel',
          }),
        ).toBe('Fuel • Diesel');
      });
    });

    describe('getTransactionTypeLabel', () => {
      it('returns proper type labels', () => {
        expect(getTransactionTypeLabel('SALE')).toBe('Sale');
        expect(getTransactionTypeLabel('PAYMENT')).toBe('Payment');
        expect(getTransactionTypeLabel('SERVICE')).toBe('Service');
        expect(getTransactionTypeLabel('PURCHASE')).toBe('Purchase');
        expect(getTransactionTypeLabel('EXPENSE')).toBe('Expense');
        expect(getTransactionTypeLabel('OPENING_BALANCE')).toBe('Opening Due');
        expect(getTransactionTypeLabel('UNKNOWN')).toBe('Transaction');
      });
    });

    describe('getTransactionBadge and getTransactionAmountColor', () => {
      it('identifies cash, credit, and category badges', () => {
        expect(
          getTransactionBadge({ type: 'SALE', amount: 100, cashPaid: 100 }),
        ).toEqual({
          sentiment: 'cash',
          label: 'Cash',
        });
        expect(
          getTransactionBadge({
            type: 'SALE',
            amount: 100,
            cashPaid: 0,
            remainingDue: 100,
          }),
        ).toEqual({
          sentiment: 'credit',
          label: 'Credit',
        });
        expect(
          getTransactionBadge({
            type: 'SALE',
            amount: 100,
            cashPaid: 50,
            remainingDue: 50,
          }),
        ).toEqual({
          sentiment: 'credit',
          label: 'Part-Cash',
        });
        expect(getTransactionBadge({ type: 'PAYMENT' })).toEqual({
          sentiment: 'positive',
          label: 'Payment',
        });
      });

      it('returns amount colors based on type and payment nature', () => {
        expect(getTransactionAmountColor('PAYMENT')).toContain('emerald');
        expect(
          getTransactionAmountColor({
            type: 'SALE',
            amount: 100,
            cashPaid: 100,
          }),
        ).toContain('emerald');
        expect(
          getTransactionAmountColor({
            type: 'SALE',
            amount: 100,
            cashPaid: 0,
            remainingDue: 100,
          }),
        ).toContain('purple');
        expect(getTransactionAmountColor('PURCHASE')).toContain('amber');
        expect(getTransactionAmountColor('EXPENSE')).toContain('rose');
        expect(getTransactionAmountColor('SERVICE')).toContain('sky');
      });
    });
  });

  describe('Composite Sanitizers', () => {
    describe('sanitizeTransactionDisplay', () => {
      it('handles null/undefined gracefully', () => {
        const sanitized = sanitizeTransactionDisplay(null);
        expect(sanitized.displayName).toBe('Unknown');
        expect(sanitized.amount).toBe(0);
        expect(sanitized.effectiveAmount).toBe(0);
        expect(sanitized.formattedAmount).toBe('₹0.00');
        expect(sanitized.formattedWeight).toBe('0 kg');
      });

      it('sanitizes a cash sale transaction', () => {
        const tx: Transaction = {
          id: 'tx-1',
          type: 'SALE',
          customerName: '  Ramesh Patel  ',
          item: 'Chana',
          weightKg: 100,
          amount: 4000,
          cashPaid: 4000,
          date: '2026-09-18T10:00:00.000Z',
        };

        const result = sanitizeTransactionDisplay(tx);
        expect(result.id).toBe('tx-1');
        expect(result.displayName).toBe('Ramesh Patel');
        expect(result.isSale).toBe(true);
        expect(result.isFullCash).toBe(true);
        expect(result.badgeSentiment).toBe('cash');
        expect(result.badgeLabel).toBe('Cash');
        expect(result.effectiveAmount).toBe(4000);
        expect(result.avgRate).toBe(40);
        expect(result.formattedRate).toBe('₹40.00/kg');
        expect(result.displaySubtitle).toContain('Chana');
        expect(result.displaySubtitle).toContain('100 kg');
      });

      it('sanitizes a credit service transaction', () => {
        const tx: Transaction = {
          id: 'tx-2',
          type: 'SERVICE',
          customerName: 'Suresh Bhai',
          item: 'Pickup',
          amount: 1500,
          cashPaid: 0,
          remainingDue: 1500,
          note: 'Field transport',
          date: '2026-09-19T10:00:00.000Z',
        };

        const result = sanitizeTransactionDisplay(tx);
        expect(result.displayName).toBe('Suresh Bhai');
        expect(result.isService).toBe(true);
        expect(result.isFullCredit).toBe(true);
        expect(result.badgeSentiment).toBe('credit');
        expect(result.badgeLabel).toBe('Credit');
        expect(result.displaySubtitle).toBe(
          'Service: Pickup • Field transport',
        );
      });

      it('sanitizes a payment received transaction', () => {
        const tx: Transaction = {
          id: 'tx-3',
          type: 'PAYMENT',
          customerName: 'Kailash',
          amount: 5000,
          paymentAmount: 5000,
          date: '2026-09-20T10:00:00.000Z',
        };

        const result = sanitizeTransactionDisplay(tx);
        expect(result.isPayment).toBe(true);
        expect(result.effectiveAmount).toBe(5000);
        expect(result.badgeSentiment).toBe('positive');
        expect(result.badgeLabel).toBe('Payment');
        expect(result.displaySubtitle).toBe('Payment Received & Dues Settled');
        expect(result.amountColorClass).toContain('text-emerald-600');
      });
    });

    describe('sanitizeTransactionsList', () => {
      it('handles empty or non-array inputs', () => {
        expect(sanitizeTransactionsList(null as any)).toEqual([]);
        expect(sanitizeTransactionsList([])).toEqual([]);
      });

      it('maps multiple transactions', () => {
        const list = sanitizeTransactionsList([
          { id: '1', type: 'SALE', amount: 100 },
          { id: '2', type: 'PAYMENT', amount: 200 },
        ]);
        expect(list).toHaveLength(2);
        expect(list[0].id).toBe('1');
        expect(list[1].id).toBe('2');
      });
    });

    describe('sanitizeCustomerData and sanitizeCustomersList', () => {
      it('sanitizes customer with fallback defaults', () => {
        const customer = sanitizeCustomerData(null);
        expect(customer.name).toBe('Unknown Customer');
        expect(customer.creditLimit).toBe(35000);
        expect(customer.outstandingAmount).toBe(0);
        expect(customer.hasOutstanding).toBe(false);
      });

      it('sanitizes customer with outstanding and credit limit check', () => {
        const customer = sanitizeCustomerData({
          id: 'c1',
          name: ' Ramesh Patel ',
          outstandingAmount: 40000,
          creditLimit: 30000,
        });

        expect(customer.name).toBe('Ramesh Patel');
        expect(customer.hasOutstanding).toBe(true);
        expect(customer.isCreditExceeded).toBe(true);
        expect(customer.formattedOutstanding).toContain('40,000');
      });

      it('maps customer list', () => {
        const list = sanitizeCustomersList([{ id: 'c1', name: 'A' }]);
        expect(list).toHaveLength(1);
        expect(list[0].name).toBe('A');
      });
    });
  });
});
