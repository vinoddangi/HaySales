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
        category: 'Chana',
      }).isValid,
    ).toBe(true);

    expect(
      validatePurchaseInput({
        type: 'PURCHASE',
        amount: 5000,
        category: '',
      }).isValid,
    ).toBe(false);

    expect(
      validatePurchaseInput({
        type: 'EXPENSE',
        amount: 1000,
        category: 'Fuel',
      }).isValid,
    ).toBe(true);

    expect(
      validatePurchaseInput({
        type: 'EXPENSE',
        amount: 1000,
        category: '',
      }).isValid,
    ).toBe(false);
  });
});
