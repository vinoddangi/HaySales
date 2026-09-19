import { describe, expect, it } from 'vitest';
import {
  calculatePurchaseRate,
  validatePurchaseInput,
} from './purchasesBusiness';

describe('purchasesBusiness', () => {
  it('calculates purchase rate per kg', () => {
    expect(calculatePurchaseRate(5000, 200)).toBe(25);
    expect(calculatePurchaseRate(0, 200)).toBe(0);
    expect(calculatePurchaseRate(5000, 0)).toBe(0);
  });

  it('validates purchase input', () => {
    expect(
      validatePurchaseInput({
        type: 'PURCHASE',
        amount: 5000,
        item: 'Chana',
      }).isValid,
    ).toBe(true);

    expect(
      validatePurchaseInput({
        type: 'PURCHASE',
        amount: 5000,
        item: '',
      }).isValid,
    ).toBe(false);

    expect(
      validatePurchaseInput({
        type: 'EXPENSE',
        amount: 1000,
        expenseCategory: 'Fuel',
      }).isValid,
    ).toBe(true);

    expect(
      validatePurchaseInput({
        type: 'EXPENSE',
        amount: 1000,
        expenseCategory: '',
      }).isValid,
    ).toBe(false);
  });
});
