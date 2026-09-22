import { ExpenseCategoryType } from '../types';

export const VALID_EXPENSE_CATEGORIES: ExpenseCategoryType[] = [
  'Interest',
  'Fuel',
  'Maintenance',
  'Depreciation',
  'Labor',
  'Food / Drink',
  'Tools',
  'Discount',
  'Others',
];

/**
 * Calculate purchase rate per kg
 */
export function calculatePurchaseRate(
  amount: number = 0,
  weightKg: number = 0,
): number {
  if (!weightKg || weightKg <= 0 || !amount || amount <= 0) {
    return 0;
  }
  return Number((amount / weightKg).toFixed(2));
}

/**
 * Validate purchase or expense input
 */
export function validatePurchaseInput(data: {
  type: 'PURCHASE' | 'EXPENSE';
  amount?: number;
  weightKg?: number;
  item?: string;
  expenseCategory?: string;
}): { isValid: boolean; error?: string } {
  if (!data.amount || data.amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (data.type === 'PURCHASE') {
    if (!data.item || data.item.trim() === '') {
      return { isValid: false, error: 'Crop / Item name is required' };
    }
  }

  if (data.type === 'EXPENSE') {
    if (!data.expenseCategory || data.expenseCategory.trim() === '') {
      return { isValid: false, error: 'Expense category is required' };
    }
  }

  return { isValid: true };
}
