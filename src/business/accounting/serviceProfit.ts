import { Transaction, TransactionModel } from '../../models';

export interface ServiceProfitResult {
  pickupIncomeCM: number;
  pickupExpensesCM: number;
  netPickupProfitCM: number;
  serviceIncomeCM: number;
  serviceExpensesCM: number;
  netServiceProfitCM: number;
}

/**
 * Calculates Pickup transport and machinery service profitability.
 * Net Pickup Profit = Service Revenue (type: SERVICE) - Direct Fuel Expenses (type: EXPENSE, category: Fuel)
 */
export function calculateServiceProfit(
  monthTransactions: Transaction[],
): ServiceProfitResult {
  let pickupIncome = 0;
  let pickupExpenses = 0;

  for (const tx of monthTransactions) {
    if (TransactionModel.isService(tx)) {
      pickupIncome += Number(tx.amount) || 0;
    } else if (TransactionModel.isFuel(tx)) {
      pickupExpenses += Number(tx.amount) || 0;
    }
  }

  const netPickupProfit = pickupIncome - pickupExpenses;

  return {
    pickupIncomeCM: Number(pickupIncome.toFixed(2)),
    pickupExpensesCM: Number(pickupExpenses.toFixed(2)),
    netPickupProfitCM: Number(netPickupProfit.toFixed(2)),
    serviceIncomeCM: Number(pickupIncome.toFixed(2)),
    serviceExpensesCM: Number(pickupExpenses.toFixed(2)),
    netServiceProfitCM: Number(netPickupProfit.toFixed(2)),
  };
}
