import { describe, expect, it } from 'vitest';
import {
  calculateAmountFromRate,
  calculateSaleTotals,
  validateSaleInput,
} from './salesBusiness';

describe('salesBusiness', () => {
  it('calculates sale totals without discount', () => {
    const res = calculateSaleTotals(10000, 0, 4000);
    expect(res.finalPrice).toBe(10000);
    expect(res.remainingDue).toBe(6000);
    expect(res.balanceChange).toBe(6000);
  });

  it('calculates sale totals with discount', () => {
    const res = calculateSaleTotals(10000, 1000, 9000);
    expect(res.finalPrice).toBe(9000);
    expect(res.remainingDue).toBe(0);
    expect(res.balanceChange).toBe(0);
  });

  it('calculates amount from rate', () => {
    expect(calculateAmountFromRate(120, 35.5)).toBe(4260);
  });

  it('validates sale inputs', () => {
    expect(validateSaleInput({}).isValid).toBe(false);
    expect(validateSaleInput({ customerId: 'c1', amount: 0 }).isValid).toBe(
      false,
    );
    expect(validateSaleInput({ customerId: 'c1', amount: 500 }).isValid).toBe(
      true,
    );
  });
});
