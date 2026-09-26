import {
  CropCategory,
  isPurchaseTransaction,
  isSaleTransaction,
  PurchaseTransactionData,
  Transaction,
  VALID_CROP_CATEGORIES,
} from '../models';
import type { CropRecord, StockState } from '../store/slices/stockSlice';
import { parseTransactionDate } from '../utils';
import { calculateCropCommissionProfit } from './profitBusiness';

/**
 * Baseline closing stock as of December 2025 ('2025-12').
 */
export const BASELINE_2025_CLOSING_STOCK: CropRecord = {
  Others: {
    id: 'closing-others-2025-12',
    date: '2025-12-31',
    type: 'PURCHASE',
    category: 'Others',
    weight: 13528,
    amount: 141097.04,
    cashPaid: 141097.04,
    remainingDue: 0,
    note: '2025 Dec Closing Stock',
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
 * e.g., for (2026, 1) -> '2025-12'
 *       for (2026, 2) -> '2026-01'
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
 * Always ensures baseline period (e.g. 2026-01) is included in chronological order.
 */
export function extractChronologicalMonths(
  transactions: Transaction[],
  baselineYear = 2026,
  baselineMonth = 1,
): string[] {
  const monthSet = new Set<string>();
  monthSet.add(formatYearMonth(baselineYear, baselineMonth));

  for (const tx of transactions) {
    const d = parseTransactionDate(tx.date);
    if (d) {
      monthSet.add(formatYearMonth(d.getFullYear(), d.getMonth() + 1));
    }
  }

  return Array.from(monthSet).sort();
}

/**
 * Calculates continuous monthly closing stocks from all historical and active transactions,
 * maintaining state keyed strictly by 'YYYY-MM'.
 *
 * For each month:
 * 1. Opening Stock is taken directly from the previous month's Closing Stock (or '2025-12' baseline).
 * 2. Purchases and Sales in the month are matched by crop category.
 * 3. Weighted average cost, sales, COGS, and closing stock are computed.
 * 4. Closing stock of the month is recorded directly under 'YYYY-MM' key.
 *
 * @param transactions All recorded transactions (Customer sales & Operations purchases)
 * @param initialBaseline Optional starting baseline closing stock (defaults to '2025-12' closing stock)
 * @returns Complete StockState mapping 'YYYY-MM' strings (e.g. '2025-12', '2026-01', '2026-02') to CropRecords.
 */
export function calculateMonthlyStockFromTransactions(
  transactions: Transaction[],
  initialBaseline: CropRecord = BASELINE_2025_CLOSING_STOCK,
): StockState {
  const stockState: StockState = {
    '2025-12': { ...initialBaseline },
  };

  const months = extractChronologicalMonths(transactions, 2026, 1);

  for (const yearMonth of months) {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed

    // Month's opening stock is previous month's closing stock
    const openingStock = getOpeningStockForMonth(stockState, year, month);

    // Filter transactions for this specific month
    const monthTransactions = transactions.filter((tx) => {
      const d = parseTransactionDate(tx.date);
      if (!d) return false;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
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
