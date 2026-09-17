import {
  ArrowDownLeft,
  Coins,
  DollarSign,
  Layers,
  PackagePlus,
  Receipt,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Card } from '../../components/common/Card';
import { PageContainer } from '../../components/common/PageContainer';
import { useAppDispatch } from '../../store/hooks';
import {
  useAddPurchaseTransactionMutation,
  useGetAllTransactionsQuery,
} from '../../store/slices/customersApi';
import { showSnackbar } from '../../store/slices/uiSlice';
import { ExpenseCategoryType } from '../../types';
import { cn } from '../../utils/cn';
import { formatRupee, formatWeight } from '../../utils/formatters';
import { ExpenseForm } from './components/ExpenseForm';
import { PurchaseForm } from './components/PurchaseForm';

export const PurchasesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeCategory, setActiveCategory] = useState<'PURCHASE' | 'EXPENSE'>(
    'PURCHASE',
  );

  const { data: allTransactions = [] } = useGetAllTransactionsQuery();
  const [addPurchaseTransaction, { isLoading: isSaving }] =
    useAddPurchaseTransactionMutation();

  // Summary Metrics: Stock, Avg Buying, Expenses
  const {
    totalPurchaseAmount,
    totalPurchaseWeight,
    totalExpenseAmount,
    totalSoldWeight,
    currentStockKg,
    avgBuyRate,
  } = useMemo(() => {
    let pAmt = 0;
    let pWt = 0;
    let eAmt = 0;
    let sWt = 0;

    allTransactions.forEach((tx) => {
      if (tx.type === 'PURCHASE') {
        pAmt += Number(tx.amount) || 0;
        pWt += Number(tx.weightKg) || 0;
      } else if (tx.type === 'EXPENSE') {
        eAmt += Number(tx.amount) || 0;
      } else if (tx.type === 'SALE') {
        sWt += Number(tx.weightKg) || 0;
      }
    });

    const stock = Math.max(0, pWt - sWt);
    const avgRate = pWt > 0 ? pAmt / pWt : 0;

    return {
      totalPurchaseAmount: pAmt,
      totalPurchaseWeight: pWt,
      totalExpenseAmount: eAmt,
      totalSoldWeight: sWt,
      currentStockKg: stock,
      avgBuyRate: avgRate,
    };
  }, [allTransactions]);

  const handlePurchaseSubmit = async (data: {
    item: string;
    weightKg: number;
    amount: number;
    cashPaid: number;
    vendorName?: string;
    note?: string;
    date: string;
  }) => {
    try {
      await addPurchaseTransaction({
        type: 'PURCHASE',
        category: 'Purchase',
        item: data.item,
        weightKg: data.weightKg,
        amount: data.amount,
        cashPaid: data.cashPaid,
        vendorName: data.vendorName,
        note: data.note,
        date: data.date,
      }).unwrap();

      dispatch(
        showSnackbar({ message: 'Stock purchase successfully recorded!' }),
      );
    } catch (err) {
      console.error(err);
      dispatch(showSnackbar({ message: 'Failed to record stock purchase' }));
    }
  };

  const handleExpenseSubmit = async (data: {
    expenseCategory: ExpenseCategoryType;
    amount: number;
    vendorName?: string;
    note?: string;
    date: string;
  }) => {
    try {
      await addPurchaseTransaction({
        type: 'EXPENSE',
        category: 'Expense',
        expenseCategory: data.expenseCategory,
        amount: data.amount,
        vendorName: data.vendorName,
        note: data.note,
        date: data.date,
      }).unwrap();

      dispatch(showSnackbar({ message: 'Expense successfully recorded!' }));
    } catch (err) {
      console.error(err);
      dispatch(showSnackbar({ message: 'Failed to record expense' }));
    }
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-m3-on-surface">
            Purchases & Expenses
          </h2>
          <p className="text-xs font-medium text-m3-on-surface-variant">
            Record raw crop procurement and operational farm costs
          </p>
        </div>
      </div>

      {/* 1. Header Overview Metrics: Purchases, Expenses, Current Stock, Avg Buying */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stock Purchases */}
        <Card
          variant="filled"
          className="space-y-1 border border-amber-500/20 bg-amber-500/[0.06] p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Purchases
            </span>
            <PackagePlus className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-m3-on-surface">
            {formatRupee(totalPurchaseAmount)}
          </div>
          <div className="text-[10px] font-medium text-m3-on-surface-variant">
            {formatWeight(totalPurchaseWeight)}
          </div>
        </Card>

        {/* Total Expenses */}
        <Card
          variant="filled"
          className="space-y-1 border border-rose-500/20 bg-rose-500/[0.06] p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Expenses
            </span>
            <Receipt className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-lg font-black text-m3-on-surface">
            {formatRupee(totalExpenseAmount)}
          </div>
          <div className="text-[10px] font-medium text-m3-on-surface-variant">
            Operational Outflow
          </div>
        </Card>

        {/* Current Stock */}
        <Card
          variant="filled"
          className="space-y-1 border border-blue-500/20 bg-blue-500/[0.06] p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Stock In Hand
            </span>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-m3-on-surface">
            {formatWeight(currentStockKg)}
          </div>
          <div className="text-[10px] font-medium text-m3-on-surface-variant">
            Sold: {formatWeight(totalSoldWeight)}
          </div>
        </Card>

        {/* Avg Buying Rate */}
        <Card
          variant="filled"
          className="space-y-1 border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Avg Buying Rate
            </span>
            <Coins className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-m3-on-surface">
            {avgBuyRate > 0 ? `₹${avgBuyRate.toFixed(2)}` : '₹0.00'}
            <span className="text-xs font-normal text-m3-on-surface-variant">
              /kg
            </span>
          </div>
          <div className="text-[10px] font-medium text-m3-on-surface-variant">
            Procurement cost
          </div>
        </Card>
      </div>

      {/* 2. Category Switcher Tabs & Entry Form */}
      <Card variant="outlined" className="space-y-4 p-4">
        <div className="flex rounded-xl bg-m3-surface-container-high p-1">
          <button
            type="button"
            onClick={() => setActiveCategory('PURCHASE')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
              activeCategory === 'PURCHASE'
                ? 'shadow-xs bg-m3-primary text-m3-on-primary'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface',
            )}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>Stock Purchase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('EXPENSE')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all',
              activeCategory === 'EXPENSE'
                ? 'shadow-xs bg-rose-600 text-white'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface',
            )}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Farm Expense</span>
          </button>
        </div>

        {/* 3. Active Form */}
        {activeCategory === 'PURCHASE' ? (
          <PurchaseForm isSaving={isSaving} onSubmit={handlePurchaseSubmit} />
        ) : (
          <ExpenseForm isSaving={isSaving} onSubmit={handleExpenseSubmit} />
        )}
      </Card>
    </PageContainer>
  );
};
export default PurchasesPage;
