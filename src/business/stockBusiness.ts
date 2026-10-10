import {
  CropCategory,
  isPurchaseTransaction,
  isSaleTransaction,
  PurchaseTransactionData,
  Transaction,
  VALID_CROP_CATEGORIES,
} from '../models';
import type { CropRecord, StockState } from '../store/slices/stockSlice';
import {
  calculateCropCommissionProfit,
  isCropCategoryMatch,
} from './profitBusiness';

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
 * Always ensures baseline period (e.g. 2026-08) is included in chronological order.
 */
export function extractChronologicalMonths(
  transactions: Transaction[],
  baselineYear = 2026,
  baselineMonth = 8,
): string[] {
  let minYear = baselineYear;
  let minMonth = baselineMonth;
  let maxYear = baselineYear;
  let maxMonth = baselineMonth;

  for (const tx of transactions) {
    if (tx.date && tx.date.length >= 7) {
      const year = parseInt(tx.date.slice(0, 4), 10);
      const month = parseInt(tx.date.slice(5, 7), 10);
      if (!isNaN(year) && !isNaN(month)) {
        if (year < minYear || (year === minYear && month < minMonth)) {
          minYear = year;
          minMonth = month;
        }
        if (year > maxYear || (year === maxYear && month > maxMonth)) {
          maxYear = year;
          maxMonth = month;
        }
      }
    }
  }

  const result: string[] = [];
  let curYear = minYear;
  let curMonth = minMonth;

  while (curYear < maxYear || (curYear === maxYear && curMonth <= maxMonth)) {
    result.push(formatYearMonth(curYear, curMonth));
    if (curMonth === 12) {
      curYear += 1;
      curMonth = 1;
    } else {
      curMonth += 1;
    }
  }

  return result;
}

/**
 * Calculates continuous monthly closing stocks from all historical and active transactions,
 * maintaining state keyed strictly by 'YYYY-MM'.
 *
 * For each month:
 * 1. Opening Stock is taken directly from the previous month's Closing Stock.
 * 2. Purchases and Sales in the month are matched by crop category.
 * 3. Weighted average cost, sales, COGS, and closing stock are computed.
 * 4. Closing stock of the month is recorded directly under 'YYYY-MM' key.
 *
 * @param transactions All recorded transactions (Customer sales & Operations purchases)
 * @param initialBaseline Optional starting baseline closing stock (defaults to empty {})
 * @returns Complete StockState mapping 'YYYY-MM' strings (e.g. '2026-08', '2026-09') to CropRecords.
 */
export function calculateMonthlyStockFromTransactions(
  transactions: Transaction[],
  initialBaseline: CropRecord = {},
  baselineYear = 2026,
  baselineMonth = 8,
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

    const categoriesToProcess = VALID_CROP_CATEGORIES.filter(
      (c) => c !== 'Grass',
    );

    for (const crop of categoriesToProcess) {
      const cropOpening =
        openingStock[crop] ||
        (crop === 'Others' ? openingStock['Grass'] : undefined);
      const cropPurchases = monthPurchases.filter((tx) =>
        isCropCategoryMatch(tx.category, crop),
      );
      const cropSales = monthSales.filter((tx) =>
        isCropCategoryMatch(tx.category, crop),
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
