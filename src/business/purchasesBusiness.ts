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
  'Profit Distribution',
  'Others',
];

export const DEFAULT_FIXED_ASSETS = [
  {
    id: 'asset_tractor',
    name: 'Pickup / Tractor Machinery',
    category: 'Machinery' as const,
    purchaseCost: 960000,
    currentBookValue: 960000,
  },
  {
    id: 'asset_fence',
    name: 'Boundary Fence',
    category: 'Infrastructure' as const,
    purchaseCost: 64800,
    currentBookValue: 64800,
  },
  {
    id: 'asset_talpatri',
    name: 'Talpatri (Covers)',
    category: 'Equipment' as const,
    purchaseCost: 60000,
    currentBookValue: 60000,
  },
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
  category?: string;
}): { isValid: boolean; error?: string } {
  if (!data.amount || data.amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  const cat = (data.category || '').trim();

  if (data.type === 'PURCHASE') {
    if (!cat) {
      return { isValid: false, error: 'Crop / Category name is required' };
    }
  }

  if (data.type === 'EXPENSE') {
    if (!cat) {
      return { isValid: false, error: 'Expense category is required' };
    }
  }

  return { isValid: true };
}
