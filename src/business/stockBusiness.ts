import {
  CropCategory,
  isPurchaseTransaction,
  isSaleTransaction,
  PurchaseTransactionData,
  Transaction,
  VALID_CROP_CATEGORIES,
} from '../models';
import type { CropRecord, StockState } from '../store/slices/stockSlice';
import { calculateCropCommissionProfit } from './profitBusiness';

/**
 * Baseline closing stock as of January 2025 ('2025-01').
 */
export const BASELINE_CLOSING_STOCK: CropRecord = {
  Others: {
    id: 'closing-others-2025-01',
    date: '2025-01-01',
    type: 'PURCHASE',
    category: 'Others',
    weight: 0,
    amount: 0,
    cashPaid: 0,
    remainingDue: 0,
    note: '2025 Jan Opening Stock',
    vendorName: 'Opening Inventory',
  },
};

/**
 * Returns the last day number of a given year and month (1-indexed month 1..12).
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Formats year and 1-indexed month into 'YYYY-MM' string.
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calculates the previous calendar month key in 'YYYY-MM' format.
 * e.g., for (2025, 1) -> '2024-12'
 *       for (2025, 2) -> '2025-01'
 */
export function getPreviousYearMonth(year: number, month: number): string {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return formatYearMonth(prevYear, prevMonth);
}

/**
 * Retrieves the opening stock for a target month by taking the closing stock of the previous 'YYYY-MM' month.
 */
export function getOpeningStockForMonth(
  stockState: StockState,
  year: number,
  month: number, // 1-indexed month 1..12
): CropRecord {
  const prevKey = getPreviousYearMonth(year, month);
  return stockState[prevKey] || {};
}

/**
 * Extracts and sorts all unique year-months ('YYYY-MM') present across transactions.
 * Always ensures baseline period (e.g. 2025-01) is included in chronological order.
 */
export function extractChronologicalMonths(
  transactions: Transaction[],
  baselineYear = 2025,
  baselineMonth = 1,
): string[] {
  const monthSet = new Set<string>();
  monthSet.add(formatYearMonth(baselineYear, baselineMonth));

  for (const tx of transactions) {
    if (tx.date && tx.date.length >= 7) {
      monthSet.add(tx.date.slice(0, 7));
    }
  }

  return Array.from(monthSet).sort();
}

/**
 * Calculates continuous monthly closing stocks from all historical and active transactions,
 * maintaining state keyed strictly by 'YYYY-MM'.
 *
 * For each month:
 * 1. Opening Stock is taken directly from the previous month's Closing Stock (or '2025-01' baseline).
 * 2. Purchases and Sales in the month are matched by crop category.
 * 3. Weighted average cost, sales, COGS, and closing stock are computed.
 * 4. Closing stock of the month is recorded directly under 'YYYY-MM' key.
 *
 * @param transactions All recorded transactions (Customer sales & Operations purchases)
 * @param initialBaseline Optional starting baseline closing stock (defaults to '2025-01' closing stock)
 * @returns Complete StockState mapping 'YYYY-MM' strings (e.g. '2025-01', '2025-02') to CropRecords.
 */
export function calculateMonthlyStockFromTransactions(
  transactions: Transaction[],
  initialBaseline: CropRecord = BASELINE_CLOSING_STOCK,
  baselineYear = 2025,
  baselineMonth = 1,
): StockState {
  const baselineKey = getPreviousYearMonth(baselineYear, baselineMonth);
  const stockState: StockState = {
    [baselineKey]: { ...initialBaseline },
  };

  const months = extractChronologicalMonths(
    transactions,
    baselineYear,
    baselineMonth,
  );

  for (const yearMonth of months) {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed

    // Month's opening stock is previous month's closing stock
    const openingStock = getOpeningStockForMonth(stockState, year, month);

    // Filter transactions for this specific month
    const monthTransactions = transactions.filter((tx) => {
      return tx.date ? tx.date.startsWith(yearMonth) : false;
    });

    const monthPurchases = monthTransactions.filter(isPurchaseTransaction);
    const monthSales = monthTransactions.filter(isSaleTransaction);

    const monthClosingStock: CropRecord = {};
    const lastDay = getLastDayOfMonth(year, month);
    const monthEndDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    for (const crop of VALID_CROP_CATEGORIES) {
      const cropOpening = openingStock[crop];
      const cropPurchases = monthPurchases.filter(
        (tx) => tx.category.toLowerCase() === crop.toLowerCase(),
      );
      const cropSales = monthSales.filter(
        (tx) => tx.category.toLowerCase() === crop.toLowerCase(),
      );

      // If there was opening stock, purchases, or sales for this crop
      if (cropOpening || cropPurchases.length > 0 || cropSales.length > 0) {
        const cropResult = calculateCropCommissionProfit(
          crop as CropCategory,
          cropOpening,
          cropPurchases,
          cropSales,
        );

        if (cropResult.closingStock.weight > 0) {
          const closingCropData: PurchaseTransactionData = {
            id: `stock-${crop.toLowerCase().replace(/\s+/g, '-')}-${yearMonth}`,
            date: monthEndDate,
            type: 'PURCHASE',
            category: crop,
            weight: Number(cropResult.closingStock.weight.toFixed(2)),
            amount: Number(cropResult.closingStock.amount.toFixed(2)),
            cashPaid: Number(cropResult.closingStock.amount.toFixed(2)),
            remainingDue: 0,
            note: `Closing stock for ${yearMonth}`,
            vendorName: 'Inventory Rollout',
          };
          monthClosingStock[crop] = closingCropData;
        }
      }
    }

    stockState[yearMonth] = monthClosingStock;
  }

  return stockState;
}
