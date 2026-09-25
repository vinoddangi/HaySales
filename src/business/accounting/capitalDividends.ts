import {
  DividendDistribution,
  Transaction,
  TransactionModel,
} from '../../models';

export interface CapitalAndDividendsResult {
  capitalInterestCM: number;
  dividendsPaidCM: number;
  newDividends: DividendDistribution[];
  principalCapital: number;
}

/**
 * Calculates Capital Interest and Dividend / Profit Sharing Distributions for the month.
 * All partner capital and interest figures are read directly from table records.
 *
 * Rules:
 * 1. Capital Interest is ALWAYS settled in cash -> treated as an expense in P&L
 *    and reduces cash in hand.
 * 2. Dividend / Profit Sharing is an equity withdrawal -> directly subtracts from
 *    accumulated retained profit and reduces cash in hand.
 */
export function calculateCapitalAndDividends(
  monthTransactions: Transaction[],
  options?: {
    principalCapital?: number;
    manualDividends?: DividendDistribution[];
  },
): CapitalAndDividendsResult {
  let capitalInterestCM = 0;
  let dividendsPaidCM = 0;
  const newDividends: DividendDistribution[] = options?.manualDividends
    ? [...options.manualDividends]
    : [];

  for (const tx of monthTransactions) {
    // 1. Check for Capital Interest (settled in cash)
    if (TransactionModel.isCapitalInterest(tx)) {
      capitalInterestCM += Number(tx.amount) || 0;
    }

    // 2. Check for Profit Distribution / Dividends
    if (TransactionModel.isDividend(tx)) {
      const amount = Number(tx.amount) || 0;
      dividendsPaidCM += amount;
      newDividends.push({
        id:
          tx.id ||
          `div_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        partnerName: tx.partnerName || 'Partner',
        amount,
        date: typeof tx.date === 'string' ? tx.date : new Date().toISOString(),
        note: tx.note || 'Profit Distribution',
      });
    }
  }

  // Add any explicitly passed manual dividends loaded from table
  if (options?.manualDividends) {
    for (const d of options.manualDividends) {
      if (!newDividends.some((existing) => existing.id === d.id)) {
        dividendsPaidCM += d.amount;
        newDividends.push(d);
      }
    }
  }

  return {
    capitalInterestCM: Number(capitalInterestCM.toFixed(2)),
    dividendsPaidCM: Number(dividendsPaidCM.toFixed(2)),
    newDividends,
    principalCapital: options?.principalCapital ?? 0,
  };
}
