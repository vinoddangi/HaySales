import {
  BalanceSheet,
  BalanceSheetData,
  CalculateBalanceSheetParams,
} from '../../models';

export type BalanceSheetParams = CalculateBalanceSheetParams;
export type { BalanceSheetData };

/**
 * Calculates the complete Balance Sheet snapshot based on double-entry principles.
 * Delegates directly to the BalanceSheet domain class.
 */
export function calculateBalanceSheet(
  params: BalanceSheetParams,
): BalanceSheet {
  return BalanceSheet.calculate(params);
}
