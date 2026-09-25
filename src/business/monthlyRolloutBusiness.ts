import { CropType, MonthlyTradingSummary, Transaction } from '../types';
import {
  calculateMonthlyTradingSummary as calculateModularSummary,
  RolloutEngineOptions,
} from './accounting';

export const VALID_CROP_ITEMS: CropType[] = [
  'Tuvar',
  'Chana',
  'B. Kutty',
  'M. Kutty',
  'Isabgol',
  'Others',
];

/**
 * 2026 Opening Baseline Configuration (used when no prior rolled out month exists in DB)
 */
export const JAN_2026_BASELINE = {
  openingStock: {
    weightKg: 13528,
    rate: 10.43,
    amount: 141097.04,
  },
  openingLendingToCustomer: 2735870,
  openingCommission: 2211384,
  openingExpenses: 395350,
  openingPickup: 269360,
  openingProfit: 2085394,
  openingCashBalance: 373626.96,
  fixedAssets: {
    pickupVehicle: 960000,
    fence: 64800,
    talpatri: 60000,
    total: 1084800,
  },
  capital: {
    vinod: 1500000,
    vinodInterest: 750000,
    total: 2250000,
  },
};

// Re-export all accounting modules
export * from './accounting';

/**
 * Backward-compatible wrapper for calculateMonthlyTradingSummary.
 * When called without an explicit opening record and without prevSummary,
 * it bridges JAN_2026_BASELINE as the opening record.
 */
export function calculateMonthlyTradingSummary(
  period: string,
  transactions: Transaction[],
  prevSummary?: MonthlyTradingSummary | null,
  options?: RolloutEngineOptions,
): MonthlyTradingSummary {
  const mergedOptions: RolloutEngineOptions = {
    ...options,
    openingRecord: options?.openingRecord || {
      openingStock: JAN_2026_BASELINE.openingStock,
      openingCommission: JAN_2026_BASELINE.openingCommission,
      openingPickup: JAN_2026_BASELINE.openingPickup,
      openingExpenses: JAN_2026_BASELINE.openingExpenses,
      openingRetainedProfit:
        JAN_2026_BASELINE.openingProfit - (options?.discountC2 || 0),
      openingCashBalance: JAN_2026_BASELINE.openingCashBalance,
      lendingToCustomers:
        options?.lendingToCustomers ??
        JAN_2026_BASELINE.openingLendingToCustomer,
      partnerCapital:
        options?.principalCapital ?? JAN_2026_BASELINE.capital.total,
      fixedAssets: [
        {
          id: 'asset_tractor',
          name: 'Pickup / Tractor Machinery',
          category: 'Machinery',
          purchaseCost: JAN_2026_BASELINE.fixedAssets.pickupVehicle,
          accumulatedDepreciation: 0,
          currentBookValue: JAN_2026_BASELINE.fixedAssets.pickupVehicle,
        },
        {
          id: 'asset_fence',
          name: 'Boundary Fence',
          category: 'Infrastructure',
          purchaseCost: JAN_2026_BASELINE.fixedAssets.fence,
          accumulatedDepreciation: 0,
          currentBookValue: JAN_2026_BASELINE.fixedAssets.fence,
        },
        {
          id: 'asset_talpatri',
          name: 'Talpatri (Covers)',
          category: 'Equipment',
          purchaseCost: JAN_2026_BASELINE.fixedAssets.talpatri,
          accumulatedDepreciation: 0,
          currentBookValue: JAN_2026_BASELINE.fixedAssets.talpatri,
        },
      ],
    },
  };

  return calculateModularSummary(
    period,
    transactions,
    prevSummary,
    mergedOptions,
  );
}

/**
 * Check if previous month rollout is pending for the active calendar period
 */
export function hasPendingMonthlyRollout(
  currentDate = new Date(),
  lastRolledOutPeriod?: string | null, // e.g. '2026_07'
): { isPending: boolean; requiredPeriod?: string } {
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth(); // 0 to 11

  // If in Jan or no prior month in current year, nothing pending
  if (currentMonthIdx === 0) {
    return { isPending: false };
  }

  const targetPrevMonth = currentMonthIdx; // 1-indexed month number for previous month
  const targetPeriod = `${currentYear}_${String(targetPrevMonth).padStart(2, '0')}`;

  if (!lastRolledOutPeriod) {
    return { isPending: true, requiredPeriod: targetPeriod };
  }

  const [lastYearStr, lastMonthStr] = lastRolledOutPeriod.split('_');
  const lastYear = parseInt(lastYearStr, 10);
  const lastMonth = parseInt(lastMonthStr, 10);

  if (lastYear < currentYear || lastMonth < targetPrevMonth) {
    return { isPending: true, requiredPeriod: targetPeriod };
  }

  return { isPending: false };
}
