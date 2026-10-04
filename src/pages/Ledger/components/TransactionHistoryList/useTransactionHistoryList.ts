import { useMemo, useState } from 'react';
import {
  CustomerTransactionData,
  isPaymentTransaction,
  isSaleTransaction,
} from '../../../../models';

export type TxFilterType = 'ALL' | 'SALE' | 'PAYMENT' | 'OTHERS';

export interface UseTransactionHistoryListProps {
  transactions: CustomerTransactionData[];
}

export function useTransactionHistoryList({
  transactions,
}: UseTransactionHistoryListProps) {
  const [filterType, setFilterType] = useState<TxFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Deduplicate by unique id
  const seenIds = new Set<string>();
  const uniqueTxs = transactions.filter((tx) => {
    if (tx.id) {
      if (seenIds.has(tx.id)) return false;
      seenIds.add(tx.id);
    }
    return true;
  });

  // 2. Sort descending by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...uniqueTxs].sort((a, b) =>
      (b.date || '').localeCompare(a.date || ''),
    );
  }, [uniqueTxs]);

  // 3. Counts for Sales, Payments, Others
  const { salesCount, paymentsCount, othersCount } = useMemo(() => {
    let sales = 0;
    let payments = 0;
    let others = 0;

    for (const tx of sortedTransactions) {
      if (isSaleTransaction(tx)) sales++;
      else if (isPaymentTransaction(tx)) payments++;
      else others++;
    }

    return {
      salesCount: sales,
      paymentsCount: payments,
      othersCount: others,
    };
  }, [sortedTransactions]);

  // 4. Compute running balance chronologically to detect zero-due cleared milestones
  const clearedTxIds = useMemo(() => {
    const chronological = [...sortedTransactions].reverse();
    const cleared = new Set<string>();
    let runningDue = 0;

    chronological.forEach((tx) => {
      if (isPaymentTransaction(tx)) {
        runningDue -= (Number(tx.amount) || 0) + (Number(tx.discount) || 0);
      } else {
        const amt = Number(tx.amount) || 0;
        const cash = Number(tx.cashPaid) || 0;
        const rem =
          tx.remainingDue !== undefined ? Number(tx.remainingDue) : amt - cash;
        runningDue += rem;
      }

      if (runningDue <= 0 && tx.id) {
        cleared.add(tx.id);
        runningDue = 0;
      }
    });

    return cleared;
  }, [sortedTransactions]);

  // 5. Apply type filter (Sales, Payments, Others) and query filter
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return sortedTransactions.filter((tx) => {
      // Type matching
      if (filterType === 'SALE' && !isSaleTransaction(tx)) return false;
      if (filterType === 'PAYMENT' && !isPaymentTransaction(tx)) return false;
      if (
        filterType === 'OTHERS' &&
        (isSaleTransaction(tx) || isPaymentTransaction(tx))
      )
        return false;

      // Query matching
      if (q) {
        const cat =
          'category' in tx && typeof tx.category === 'string'
            ? tx.category.toLowerCase()
            : '';
        const note = (tx.note || '').toLowerCase();
        const date = (tx.date || '').toLowerCase();
        const amt = String(tx.amount || '');
        const match =
          cat.includes(q) ||
          note.includes(q) ||
          date.includes(q) ||
          amt.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [sortedTransactions, filterType, searchQuery]);

  return {
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    salesCount,
    paymentsCount,
    othersCount,
    sortedTransactions,
    filteredTransactions,
    clearedTxIds,
  };
}
