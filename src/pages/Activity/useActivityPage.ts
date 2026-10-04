import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filterTransactionsByTimeline } from '../../business';
import {
  CropTransactionData,
  CustomerTransactionData,
  ExpenseTransactionData,
  isPaymentTransaction,
  isSaleTransaction,
  OperationsTransactionData,
  Transaction,
} from '../../models';
import {
  useGetCustomerTransactionsQuery,
  useGetOperationTransactionsQuery,
} from '../../store/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  FilterPeriodMode,
  setFilterMode,
  setSelectedMonth,
} from '../../store/slices/timelineSlice';
import { MONTH_NAMES } from '../../utils/formatters';
import { ActivityFilterType } from './components/ActivityFilterBar';

export function useActivityPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. URL Query Sync for Filter ('all' | 'sales' | 'payments' | 'others')
  const rawCategoryParam = (
    searchParams.get('category') ||
    searchParams.get('filter') ||
    'all'
  ).toLowerCase();

  const filterType: ActivityFilterType = (() => {
    if (rawCategoryParam === 'sales' || rawCategoryParam === 'sale') {
      return 'sales';
    }
    if (
      rawCategoryParam === 'payments' ||
      rawCategoryParam === 'payment' ||
      rawCategoryParam === 'pay'
    ) {
      return 'payments';
    }
    if (
      rawCategoryParam === 'others' ||
      rawCategoryParam === 'other' ||
      rawCategoryParam === 'purchases' ||
      rawCategoryParam === 'purchase' ||
      rawCategoryParam === 'expenses' ||
      rawCategoryParam === 'services'
    ) {
      return 'others';
    }
    return 'all';
  })();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // 2. Redux Timeline state
  const filterMode = useAppSelector((state) => state.timeline.filterMode);
  const selectedMonth = useAppSelector((state) => state.timeline.selectedMonth);
  const selectedYear = useAppSelector((state) => state.timeline.selectedYear);

  // 3. RTK Query Data
  const { data: customerTxs = [], isLoading: isLoadingCustomerTxs } =
    useGetCustomerTransactionsQuery(undefined);
  const { data: operationTxs = [], isLoading: isLoadingOperationTxs } =
    useGetOperationTransactionsQuery();

  const isLoading = isLoadingCustomerTxs || isLoadingOperationTxs;

  // 4. Combine all raw transactions
  const allRawTransactions: Transaction[] = useMemo(() => {
    return [
      ...(customerTxs as CustomerTransactionData[]),
      ...(operationTxs as OperationsTransactionData[]),
    ];
  }, [customerTxs, operationTxs]);

  // 5. Timeline filtered transactions
  const timeline = useMemo(
    () => ({
      selectedYear,
      selectedMonth,
      filterMode,
    }),
    [selectedYear, selectedMonth, filterMode],
  );

  const periodTransactions = useMemo(() => {
    return filterTransactionsByTimeline(allRawTransactions, timeline);
  }, [allRawTransactions, timeline]);

  // 6. Counts within current period: Sales, Payments, Others
  const { salesCount, paymentsCount, othersCount } = useMemo(() => {
    let sales = 0;
    let payments = 0;
    let others = 0;

    for (const tx of periodTransactions) {
      if (isSaleTransaction(tx)) {
        sales++;
      } else if (isPaymentTransaction(tx)) {
        payments++;
      } else {
        others++;
      }
    }

    return { salesCount: sales, paymentsCount: payments, othersCount: others };
  }, [periodTransactions]);

  // 7. Filter by Active Filter Type (All vs Sales vs Payments vs Others) and Search Term
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      // Filter match
      if (filterType === 'sales' && !isSaleTransaction(tx)) return false;
      if (filterType === 'payments' && !isPaymentTransaction(tx)) return false;
      if (
        filterType === 'others' &&
        (isSaleTransaction(tx) || isPaymentTransaction(tx))
      )
        return false;

      // Search term match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const custTx = tx as Partial<CustomerTransactionData>;
        const expTx = tx as Partial<ExpenseTransactionData>;
        const party = (
          custTx.customerName ||
          expTx.vendorName ||
          expTx.partnerName ||
          custTx.customerId ||
          ''
        ).toLowerCase();
        const category = ((tx as any).category || '').toLowerCase();
        const note = (tx.note || (tx as any).notes || '').toLowerCase();
        const id = (tx.id || '').toLowerCase();
        const amountStr = String(tx.amount || '');

        const match =
          party.includes(query) ||
          category.includes(query) ||
          note.includes(query) ||
          id.includes(query) ||
          amountStr.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [periodTransactions, filterType, searchTerm]);

  // 8. Sort descending by date (and ID)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const cmp = (b.date || '').localeCompare(a.date || '');
      if (cmp !== 0) return cmp;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [filteredTransactions]);

  // 9. Metrics for current filtered view
  const metrics = useMemo(() => {
    let totalAmount = 0;
    let totalWeight = 0;
    let cashAmount = 0;
    let creditAmount = 0;

    for (const tx of sortedTransactions) {
      const amt = Number(tx.amount || 0);
      const c = Number(tx.cashPaid || 0);
      const rem = Number(tx.remainingDue ?? Math.max(0, amt - c));

      totalAmount += amt;
      cashAmount += c;
      creditAmount += rem;

      const cropTx = tx as Partial<CropTransactionData>;
      if (typeof cropTx.weight === 'number') {
        totalWeight += cropTx.weight;
      }
    }

    return {
      totalCount: sortedTransactions.length,
      totalAmount,
      totalWeight,
      cashAmount,
      creditAmount,
    };
  }, [sortedTransactions]);

  // 10. Labels
  const periodLabel = useMemo(() => {
    if (filterMode === 'all') return 'All Time';
    if (filterMode === 'ytd') return `YTD ${selectedYear}`;
    return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }, [filterMode, selectedMonth, selectedYear]);

  const categoryLabel = useMemo(() => {
    switch (filterType) {
      case 'sales':
        return 'Sales';
      case 'payments':
        return 'Payments';
      case 'others':
        return 'Others';
      case 'all':
      default:
        return 'All Activity';
    }
  }, [filterType]);

  // 11. Handlers
  const handleFilterTypeChange = (type: ActivityFilterType) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (type === 'all') {
        next.delete('category');
        next.delete('filter');
      } else {
        next.set('category', type);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    handleFilterTypeChange('all');
  };

  const handleFilterModeChange = (mode: FilterPeriodMode) => {
    dispatch(setFilterMode(mode));
  };

  const handleMonthChange = (month: number) => {
    dispatch(setSelectedMonth(month));
  };

  const handleOpenDetail = (tx: Transaction) => {
    setSelectedTx(tx);
  };

  const handleCloseDetail = () => {
    setSelectedTx(null);
  };

  return {
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    filterMode,
    selectedMonth,
    selectedYear,
    periodLabel,
    categoryLabel,
    allCount: periodTransactions.length,
    salesCount,
    paymentsCount,
    othersCount,
    transactions: sortedTransactions,
    metrics,
    selectedTx,
    handleFilterTypeChange,
    handleResetFilters,
    handleFilterModeChange,
    handleMonthChange,
    handleOpenDetail,
    handleCloseDetail,
  };
}

export default useActivityPage;
