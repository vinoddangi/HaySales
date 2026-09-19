export interface SaleCalculationResult {
  finalPrice: number;
  remainingDue: number;
  balanceChange: number;
}

/**
 * Calculate totals, final price after discount, and remaining credit due
 */
export function calculateSaleTotals(
  amount: number = 0,
  discount: number = 0,
  cashPaid: number = 0,
): SaleCalculationResult {
  const finalPrice = Math.max(0, (amount || 0) - (discount || 0));
  const remainingDue = Math.max(0, finalPrice - (cashPaid || 0));
  return {
    finalPrice,
    remainingDue,
    balanceChange: remainingDue,
  };
}

/**
 * Calculate line amount from weight and rate
 */
export function calculateAmountFromRate(
  weightKg: number = 0,
  ratePerKg: number = 0,
): number {
  return Math.round((weightKg || 0) * (ratePerKg || 0));
}

/**
 * Validate sale inputs before submission
 */
export function validateSaleInput(data: {
  customerId?: string;
  amount?: number;
  weightKg?: number;
}): { isValid: boolean; error?: string } {
  if (!data.customerId || data.customerId.trim() === '') {
    return { isValid: false, error: 'Customer is required' };
  }
  if (!data.amount || data.amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  return { isValid: true };
}
