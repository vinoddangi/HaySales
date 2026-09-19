import { Transaction } from '../types';

export interface CustomerLedgerSummary {
  totalBilled: number;
  totalPaid: number;
  currentBalance: number;
  transactionCount: number;
}

/**
 * Calculate ledger statistics for a customer based on transactions
 */
export function calculateCustomerLedgerSummary(
  transactions: Transaction[],
): CustomerLedgerSummary {
  let totalBilled = 0;
  let totalPaid = 0;
  let currentBalance = 0;

  transactions.forEach((t) => {
    if (t.type === 'PAYMENT') {
      const pAmt = Number(t.paymentAmount) || 0;
      totalPaid += pAmt;
      currentBalance -= pAmt;
    } else if (t.type === 'OPENING_BALANCE') {
      const amt = Number(t.amount) || 0;
      totalBilled += amt;
      currentBalance += amt;
    } else {
      // SALE or SERVICE
      const amt = Number(t.amount) || 0;
      const cash = Number(t.cashPaid) || 0;
      const credit =
        t.remainingDue !== undefined
          ? Number(t.remainingDue) || 0
          : Math.max(0, amt - cash);

      totalBilled += amt;
      totalPaid += cash;
      currentBalance += credit;
    }
  });

  return {
    totalBilled,
    totalPaid,
    currentBalance: Math.max(0, currentBalance),
    transactionCount: transactions.length,
  };
}
