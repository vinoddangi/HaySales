import { Transaction, TransactionModel } from '../../models';

export interface CommissionProfitResult {
  openingStock: { weightKg: number; rate: number; amount: number };
  purchases: { weightKg: number; rate: number; amount: number };
  totalStock: { weightKg: number; weightedRate: number; amount: number };
  sales: { weightKg: number; avgRate: number; amount: number };
  closingStock: { weightKg: number; rate: number; amount: number };
  grossCommissionCM: number;
}

/**
 * Calculates grass sales, purchases, stock valuation, and gross trading commission.
 * Gross Commission (CM) = Sales Amount - (Sales KG * Weighted Purchase Rate)
 */
export function calculateCommissionProfit(
  monthTransactions: Transaction[],
  openingStock: { weightKg: number; rate: number; amount: number },
): CommissionProfitResult {
  let purchaseKg = 0;
  let purchaseAmount = 0;
  let salesKg = 0;
  let salesAmount = 0;

  for (const tx of monthTransactions) {
    if (TransactionModel.isPurchase(tx)) {
      purchaseKg += Number(tx.weightKg) || 0;
      purchaseAmount += Number(tx.amount) || 0;
    } else if (TransactionModel.isSale(tx)) {
      salesKg += Number(tx.weightKg) || 0;
      salesAmount += Number(tx.amount) || 0;
    }
  }

  const purchaseRate = purchaseKg > 0 ? purchaseAmount / purchaseKg : 0;
  const purchases = {
    weightKg: purchaseKg,
    rate: Number(purchaseRate.toFixed(2)),
    amount: purchaseAmount,
  };

  const totalStockKg = openingStock.weightKg + purchases.weightKg;
  const totalStockAmount = openingStock.amount + purchases.amount;
  const weightedRate = totalStockKg > 0 ? totalStockAmount / totalStockKg : 0;

  const totalStock = {
    weightKg: totalStockKg,
    weightedRate: Number(weightedRate.toFixed(4)),
    amount: totalStockAmount,
  };

  const avgSalesRate = salesKg > 0 ? salesAmount / salesKg : 0;
  const sales = {
    weightKg: salesKg,
    avgRate: Number(avgSalesRate.toFixed(2)),
    amount: salesAmount,
  };

  const closingKg = Math.max(0, totalStock.weightKg - sales.weightKg);
  const closingAmount = closingKg * weightedRate;
  const closingStock = {
    weightKg: closingKg,
    rate: Number(weightedRate.toFixed(2)),
    amount: Number(closingAmount.toFixed(2)),
  };

  const grossCommissionCM = sales.amount - sales.weightKg * weightedRate;

  return {
    openingStock,
    purchases,
    totalStock,
    sales,
    closingStock,
    grossCommissionCM: Number(grossCommissionCM.toFixed(2)),
  };
}
