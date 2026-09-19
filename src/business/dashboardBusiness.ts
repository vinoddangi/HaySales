import { Transaction } from '../types';
import { parseTransactionDate } from '../utils/formatters';

export interface DashboardMetricsResult {
  totalSalesAmount: number;
  totalSalesWeightKg: number;
  salesCount: number;
  totalPurchaseAmount: number;
  totalPurchaseWeightKg: number;
  purchasesCount: number;
  totalExpenseAmount: number;
  expensesCount: number;
  avgSalesRate: number;
  avgBuyRate: number;
  totalCashIn: number;
  netCashflow: number;
  salesOnCredit: number;
  salesOnCash: number;
  paymentsReceived: number;
}

export interface ItemBreakdownResult {
  item: string;
  amount: number;
  weightKg: number;
  count: number;
  stockKg?: number;
  avgBuyRate?: number;
}

/**
 * Filter transactions based on date criteria
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  mode: 'currentMonth' | 'ytd' | 'customMonth' | 'month',
  selectedMonth: number,
  referenceDate: Date = new Date(),
): Transaction[] {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  return transactions.filter((tx: Transaction) => {
    const txDate = parseTransactionDate(tx.date);
    if (!txDate) return false;

    if (mode === 'ytd') {
      return txDate.getFullYear() === currentYear && txDate <= referenceDate;
    }

    if (mode === 'currentMonth') {
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth
      );
    }

    // 'customMonth' or 'month'
    return (
      txDate.getFullYear() === currentYear &&
      txDate.getMonth() === selectedMonth
    );
  });
}

/**
 * Calculate aggregated summary metrics for the dashboard
 */
export function calculateDashboardMetrics(
  filteredTransactions: Transaction[],
): DashboardMetricsResult {
  let totalSalesAmount = 0;
  let totalSalesWeightKg = 0;
  let salesCount = 0;
  let salesOnCash = 0;
  let salesOnCredit = 0;

  let totalPurchaseAmount = 0;
  let totalPurchaseWeightKg = 0;
  let purchasesCount = 0;

  let totalExpenseAmount = 0;
  let expensesCount = 0;

  let paymentsReceived = 0;

  filteredTransactions.forEach((tx) => {
    if (tx.type === 'SALE' || tx.type === 'SERVICE') {
      const amt = Number(tx.amount) || 0;
      const wt = Number(tx.weightKg) || 0;
      const cash = Number(tx.cashPaid) || 0;
      const credit =
        tx.remainingDue !== undefined
          ? Number(tx.remainingDue) || 0
          : Math.max(0, amt - cash);

      totalSalesAmount += amt;
      totalSalesWeightKg += wt;
      salesCount += 1;
      salesOnCash += cash;
      salesOnCredit += credit;
    } else if (tx.type === 'PURCHASE') {
      const amt = Number(tx.amount) || 0;
      const wt = Number(tx.weightKg) || 0;
      totalPurchaseAmount += amt;
      totalPurchaseWeightKg += wt;
      purchasesCount += 1;
    } else if (tx.type === 'EXPENSE') {
      const amt = Number(tx.amount) || 0;
      totalExpenseAmount += amt;
      expensesCount += 1;
    } else if (tx.type === 'PAYMENT') {
      paymentsReceived += Number(tx.paymentAmount) || Number(tx.amount) || 0;
    }
  });

  const avgSalesRate =
    totalSalesWeightKg > 0 ? totalSalesAmount / totalSalesWeightKg : 0;
  const avgBuyRate =
    totalPurchaseWeightKg > 0 ? totalPurchaseAmount / totalPurchaseWeightKg : 0;
  const totalCashIn = salesOnCash + paymentsReceived;
  const netCashflow = totalCashIn - (totalPurchaseAmount + totalExpenseAmount);

  return {
    totalSalesAmount,
    totalSalesWeightKg,
    salesCount,
    totalPurchaseAmount,
    totalPurchaseWeightKg,
    purchasesCount,
    totalExpenseAmount,
    expensesCount,
    avgSalesRate,
    avgBuyRate,
    totalCashIn,
    netCashflow,
    salesOnCredit,
    salesOnCash,
    paymentsReceived,
  };
}

/**
 * Calculate per-item breakdown comparing sales with purchases
 */
export function calculateItemBreakdowns(
  allTransactions: Transaction[],
  filteredTransactions: Transaction[],
): ItemBreakdownResult[] {
  const itemMap = new Map<
    string,
    { amount: number; weightKg: number; count: number }
  >();

  filteredTransactions.forEach((tx) => {
    if (tx.type === 'SALE' || tx.type === 'SERVICE') {
      const amt = Number(tx.amount) || 0;
      const wt = Number(tx.weightKg) || 0;
      const itemName = (tx.item || 'General').trim();

      const existing = itemMap.get(itemName) || {
        amount: 0,
        weightKg: 0,
        count: 0,
      };
      itemMap.set(itemName, {
        amount: existing.amount + amt,
        weightKg: existing.weightKg + wt,
        count: existing.count + 1,
      });
    }
  });

  const purchaseStatsMap = new Map<
    string,
    { amount: number; weightKg: number }
  >();

  allTransactions.forEach((tx) => {
    if (tx.type === 'PURCHASE') {
      const pItem = (tx.item || 'General').trim();
      const existing = purchaseStatsMap.get(pItem) || {
        amount: 0,
        weightKg: 0,
      };
      purchaseStatsMap.set(pItem, {
        amount: existing.amount + (Number(tx.amount) || 0),
        weightKg: existing.weightKg + (Number(tx.weightKg) || 0),
      });
    }
  });

  return Array.from(itemMap.entries())
    .map(([item, stats]) => {
      const pStats = purchaseStatsMap.get(item);
      const pWeight = pStats?.weightKg || 0;
      const pAmt = pStats?.amount || 0;
      const stockKg = Math.max(0, pWeight - stats.weightKg);
      const avgBuyRate = pWeight > 0 ? pAmt / pWeight : 0;

      return {
        item,
        amount: stats.amount,
        weightKg: stats.weightKg,
        count: stats.count,
        stockKg: pWeight > 0 ? stockKg : undefined,
        avgBuyRate: avgBuyRate > 0 ? avgBuyRate : undefined,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}
