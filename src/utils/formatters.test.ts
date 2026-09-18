import { describe, expect, it } from 'vitest';
import {
  calculateCustomerBalance,
  formatDate,
  formatRupee,
  formatWeight,
  MONTH_NAMES,
  parseTransactionDate,
  SERVICE_ITEMS,
} from './formatters';

describe('formatters utility', () => {
  describe('MONTH_NAMES and SERVICE_ITEMS', () => {
    it('contains all 12 months', () => {
      expect(MONTH_NAMES).toHaveLength(12);
      expect(MONTH_NAMES[0]).toBe('January');
      expect(MONTH_NAMES[11]).toBe('December');
    });

    it('contains expected service item categories', () => {
      expect(SERVICE_ITEMS).toContain('Pickup');
      expect(SERVICE_ITEMS).toContain('Tractor');
      expect(SERVICE_ITEMS).toContain('Commission');
      expect(SERVICE_ITEMS).toContain('Labour');
      expect(SERVICE_ITEMS).toContain('Transport');
      expect(SERVICE_ITEMS).toContain('Others');
    });
  });

  describe('formatRupee', () => {
    it('formats numeric amounts to INR currency format correctly', () => {
      const formatted = formatRupee(1500);
      expect(formatted).toContain('1,500');
      expect(formatRupee(0)).toContain('0');
    });
  });

  describe('formatWeight', () => {
    it('formats weight strictly in kg', () => {
      expect(formatWeight(500)).toBe('500 kg');
      expect(formatWeight(1250.5)).toBe('1,250.5 kg');
      expect(formatWeight(0)).toBe('0 kg');
      expect(formatWeight(-10)).toBe('0 kg');
    });
  });

  describe('parseTransactionDate & formatDate', () => {
    it('parses Firestore timestamps correctly', () => {
      const firestoreTimestamp = { seconds: 1773782400 }; // timestamp
      const date = parseTransactionDate(firestoreTimestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(1773782400 * 1000);
    });

    it('parses standard ISO date strings', () => {
      const isoStr = '2026-09-18T10:00:00.000Z';
      const date = parseTransactionDate(isoStr);
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe(isoStr);
    });

    it('returns null for empty/invalid dates', () => {
      expect(parseTransactionDate(undefined)).toBeNull();
      expect(parseTransactionDate('invalid-date-string')).toBeNull();
    });

    it('formats date to locale string correctly', () => {
      expect(formatDate(undefined)).toBe('');
      const firestoreTimestamp = { seconds: 1773782400 };
      expect(formatDate(firestoreTimestamp)).toBeTruthy();
    });
  });

  describe('calculateCustomerBalance', () => {
    it('calculates running dues properly from sales, services, and payments', () => {
      const transactions = [
        { type: 'SALE', amount: 5000, cashPaid: 1000, remainingDue: 4000 },
        { type: 'SERVICE', amount: 1500, cashPaid: 500, remainingDue: 1000 },
        { type: 'PAYMENT', paymentAmount: 2000 },
      ];

      const balance = calculateCustomerBalance(transactions);
      // 4000 + 1000 - 2000 = 3000
      expect(balance).toBe(3000);
    });

    it('prevents negative balance skews', () => {
      const transactions = [{ type: 'PAYMENT', paymentAmount: 10000 }];
      const balance = calculateCustomerBalance(transactions);
      expect(balance).toBe(0);
    });
  });
});
