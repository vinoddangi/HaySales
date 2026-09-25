import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import {
  calculateMonthlyTradingSummary,
  hasPendingMonthlyRollout,
  VALID_CROP_ITEMS,
} from './monthlyRolloutBusiness';

describe('monthlyRolloutBusiness', () => {
  it('contains all valid crop items', () => {
    expect(VALID_CROP_ITEMS).toContain('Tuvar');
    expect(VALID_CROP_ITEMS).toContain('Chana');
    expect(VALID_CROP_ITEMS).toContain('B. Kutty');
    expect(VALID_CROP_ITEMS).toContain('M. Kutty');
    expect(VALID_CROP_ITEMS).toContain('Isabgol');
    expect(VALID_CROP_ITEMS).toContain('Others');
  });

  it('calculates Jan 2026 trading summary matching baseline formulas', () => {
    const mockTx: Transaction[] = [
      // Purchases
      {
        type: 'PURCHASE',
        category: 'Tuvar',
        weightKg: 95890,
        amount: 913410,
        date: new Date(2026, 0, 15),
      },
      // Sales
      {
        type: 'SALE',
        category: 'Tuvar',
        weightKg: 105108,
        amount: 1121090,
        date: new Date(2026, 0, 20),
      },
      // Operating Expense (Interest)
      {
        type: 'EXPENSE',
        category: 'Interest',
        amount: 7000,
        date: new Date(2026, 0, 31),
      },
    ];

    const result = calculateMonthlyTradingSummary('2026_01', mockTx, null, {
      discountC2: 2286,
      lendingToCustomers: 3134624,
    });

    // Opening Stock
    expect(result.openingStock.weightKg).toBe(13528);
    expect(result.openingStock.amount).toBe(141097.04);

    // Total Stock: 13,528 + 95,890 = 109,418 kg | Total Cost: 141,097.04 + 913,410 = 1,054,507.04
    expect(result.totalStock.weightKg).toBe(109418);
    expect(result.totalStock.amount).toBe(1054507.04);
    expect(result.totalStock.weightedRate).toBeCloseTo(9.6374, 2);

    // Closing Stock: 109,418 - 105,108 = 4,310 kg @ 9.6374 = 41,537.27
    expect(result.closingStock.weightKg).toBe(4310);
    expect(result.closingStock.amount).toBeCloseTo(41537.27, 1);

    // Commission CM: 1,121,090 - (105,108 * 9.637424) = 108,120.23
    expect(result.commission.cm).toBeCloseTo(108120.23, 1);
    expect(result.commission.prev).toBe(2211384 - 2286); // 2,209,098

    // Total Profit: Total Commission (2,317,218.23) + Total Daalu (269,360) - Total Expenses (402,350) = 2,184,228.23
    expect(result.netProfit.total).toBeCloseTo(2184228.23, 1);

    // Cash Balance: Total Capital (4,434,228.23) - (Fixed Assets 10,84,800 + Lending 31,34,624 + Closing Stock 41,537.27) = 1,73,266.96
    expect(result.cashBalance).toBeCloseTo(173266.96, 1);
  });

  it('checks pending monthly rollout correctly', () => {
    // Current date is in August (month index 7)
    const augDate = new Date(2026, 7, 15);

    // If last rollout was July 2026 ('2026_07'), August is ready and not pending
    expect(hasPendingMonthlyRollout(augDate, '2026_07').isPending).toBe(false);

    // If last rollout was June 2026 ('2026_06'), July is required
    const pendingCheck = hasPendingMonthlyRollout(augDate, '2026_06');
    expect(pendingCheck.isPending).toBe(true);
    expect(pendingCheck.requiredPeriod).toBe('2026_07');

    // In January (month index 0), no prior month is pending
    const janDate = new Date(2026, 0, 15);
    expect(hasPendingMonthlyRollout(janDate, null).isPending).toBe(false);
  });
});
