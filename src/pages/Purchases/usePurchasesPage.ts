import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterTransactionsByTimeline } from '../../business';
import {
  CropCategory,
  ExpenseCategory,
  isExpenseTransaction,
  isPurchaseTransaction,
  isSaleTransaction,
  PurchaseTransactionData,
  Transaction,
} from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  useAddOperationTransactionMutation,
  useGetCustomerTransactionsQuery,
  useGetOperationTransactionsQuery,
} from '../../store/slices/customersApi';
import {
  FilterPeriodMode,
  setFilterMode,
  setSelectedMonth,
  showSnackbar,
} from '../../store/slices/uiSlice';
import { MONTH_NAMES } from '../../utils';
import { ExpenseFormData } from './components/ExpenseFormCard';
import { PurchaseFormData } from './components/PurchaseFormCard';

export function usePurchasesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [activeType, setActiveType] = useState<'PURCHASE' | 'EXPENSE'>(
    'PURCHASE',
  );

  const filterMode = useAppSelector((state) => state.ui.filterMode);
  const selectedMonth = useAppSelector((state) => state.ui.selectedMonth);
  const selectedYear = useAppSelector((state) => state.ui.selectedYear);

  const { data: opTransactions = [] } = useGetOperationTransactionsQuery();
  const { data: custTransactions = [] } =
    useGetCustomerTransactionsQuery(undefined);
  const [addOperationTx, { isLoading: isSaving }] =
    useAddOperationTransactionMutation();

  const allTransactions: Transaction[] = useMemo(() => {
    return [...opTransactions, ...custTransactions];
  }, [opTransactions, custTransactions]);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTimeline(allTransactions, {
      selectedYear,
      selectedMonth,
      filterMode,
    });
  }, [allTransactions, filterMode, selectedMonth, selectedYear]);

  // Compute Purchases overview metrics
  const {
    totalPurchaseAmount,
    totalPurchaseWeight,
    totalExpenseAmount,
    totalSoldWeight,
    currentStock,
    avgBuyRate,
  } = useMemo(() => {
    let pAmt = 0;
    let pWt = 0;
    let eAmt = 0;
    let sWt = 0;

    filteredTransactions.forEach((tx) => {
      if (isPurchaseTransaction(tx)) {
        pAmt += Number(tx.amount) || 0;
        pWt += Number(tx.weight) || 0;
      } else if (isExpenseTransaction(tx)) {
        eAmt += Number(tx.amount) || 0;
      } else if (isSaleTransaction(tx)) {
        sWt += Number(tx.weight) || 0;
      }
    });

    const stock = Math.max(0, pWt - sWt);
    const avgRate = pWt > 0 ? Number((pAmt / pWt).toFixed(2)) : 0;

    return {
      totalPurchaseAmount: Math.round(pAmt),
      totalPurchaseWeight: Math.round(pWt),
      totalExpenseAmount: Math.round(eAmt),
      totalSoldWeight: Math.round(sWt),
      currentStock: Math.round(stock),
      avgBuyRate: avgRate,
    };
  }, [filteredTransactions]);

  const periodLabel = useMemo(() => {
    if (filterMode === 'all') {
      return 'All Time';
    }
    if (filterMode === 'ytd') {
      return `YTD ${selectedYear}`;
    }
    return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }, [filterMode, selectedMonth, selectedYear]);

  const handleFilterModeChange = (mode: FilterPeriodMode) => {
    dispatch(setFilterMode(mode));
  };

  const handleMonthChange = (month: number) => {
    dispatch(setSelectedMonth(month));
  };

  const handlePurchaseSubmit = async (data: PurchaseFormData) => {
    try {
      const remainingDue = Math.max(0, data.amount - data.cashPaid);
      const purchaseTx: PurchaseTransactionData = {
        type: 'PURCHASE',
        category: data.category as CropCategory,
        weight: data.weight,
        amount: data.amount,
        cashPaid: data.cashPaid,
        remainingDue,
        vendorName: data.vendorName,
        note: data.note,
        date: data.date,
      };

      await addOperationTx(purchaseTx).unwrap();
      dispatch(
        showSnackbar({ message: 'Crop purchase successfully recorded!' }),
      );
      navigate('/');
    } catch (err) {
      console.error('Failed to record purchase:', err);
      dispatch(showSnackbar({ message: 'Failed to record stock purchase' }));
    }
  };

  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    try {
      const remainingDue = Math.max(0, data.amount - data.cashPaid);
      await addOperationTx({
        type: 'EXPENSE',
        category: data.category as ExpenseCategory,
        amount: data.amount,
        cashPaid: data.cashPaid,
        remainingDue,
        vendorName: data.vendorName,
        note: data.note,
        date: data.date,
        targetAssetId: data.targetAssetId,
      }).unwrap();

      const successMsg =
        data.category === 'Depreciation'
          ? 'Asset depreciation successfully recorded!'
          : data.category === 'Profit Distribution'
            ? 'Partner profit distribution recorded!'
            : 'Operational expense successfully recorded!';

      dispatch(showSnackbar({ message: successMsg }));
      navigate('/');
    } catch (err) {
      console.error('Failed to record expense:', err);
      dispatch(showSnackbar({ message: 'Failed to record expense' }));
    }
  };

  return {
    activeType,
    setActiveType,
    filterMode,
    selectedMonth,
    selectedYear,
    periodLabel,
    totalPurchaseAmount,
    totalPurchaseWeight,
    totalExpenseAmount,
    totalSoldWeight,
    currentStock,
    avgBuyRate,
    isSaving,
    handleFilterModeChange,
    handleMonthChange,
    handlePurchaseSubmit,
    handleExpenseSubmit,
  };
}
