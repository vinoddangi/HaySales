import { History, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { PageContainer } from '../../components/common/PageContainer';
import {
  PeriodFilterBar,
  PeriodFilterMode,
} from '../../components/common/PeriodFilterBar';
import { useAppDispatch } from '../../store/hooks';
import {
  useDeletePurchaseTransactionMutation,
  useDeleteTransactionMutation,
  useGetAllTransactionsQuery,
  useUpdatePurchaseTransactionMutation,
  useUpdateTransactionMutation,
} from '../../store/slices/customersApi';
import { showSnackbar } from '../../store/slices/uiSlice';
import { Transaction } from '../../types';
import { parseTransactionDate } from '../../utils/formatters';
import {
  ActivityCategory,
  ActivityCategoryTabs,
} from './components/ActivityCategoryTabs';
import { ActivityListItem } from './components/ActivityListItem';
import { EditActivityModal } from './components/EditActivityModal';

export const ActivityPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Period Filter States: Current Month, YTD, Select Month (same year)
  const [filterMode, setFilterMode] =
    useState<PeriodFilterMode>('currentMonth');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const [activeCategory, setActiveCategory] =
    useState<ActivityCategory>('SALES');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Fetch all transactions (Sales, Payments, Purchases, Expenses)
  const { data: allTransactions = [], isLoading } =
    useGetAllTransactionsQuery();

  // Mutations for editing / deleting
  const [updateTransaction, { isLoading: isUpdatingCustomerTx }] =
    useUpdateTransactionMutation();
  const [deleteTransaction, { isLoading: isDeletingCustomerTx }] =
    useDeleteTransactionMutation();
  const [updatePurchase, { isLoading: isUpdatingPurchaseTx }] =
    useUpdatePurchaseTransactionMutation();
  const [deletePurchase, { isLoading: isDeletingPurchaseTx }] =
    useDeletePurchaseTransactionMutation();

  const isSaving =
    isUpdatingCustomerTx ||
    isDeletingCustomerTx ||
    isUpdatingPurchaseTx ||
    isDeletingPurchaseTx;

  // Filter all transactions based on active period
  const periodFilteredTransactions = useMemo(() => {
    return allTransactions.filter((tx: Transaction) => {
      const txDate = parseTransactionDate(tx.date);
      if (!txDate) return false;

      if (filterMode === 'currentMonth') {
        return (
          txDate.getFullYear() === currentYear &&
          txDate.getMonth() === currentMonth
        );
      }

      if (filterMode === 'ytd') {
        return txDate.getFullYear() === currentYear && txDate <= currentDate;
      }

      if (filterMode === 'customMonth') {
        return (
          txDate.getFullYear() === currentYear &&
          txDate.getMonth() === selectedMonth
        );
      }

      return true;
    });
  }, [
    allTransactions,
    filterMode,
    selectedMonth,
    currentYear,
    currentMonth,
    currentDate,
  ]);

  // Split and count by category
  const { sales, payments, purchasesExpenses } = useMemo(() => {
    const s: Transaction[] = [];
    const p: Transaction[] = [];
    const pe: Transaction[] = [];

    periodFilteredTransactions.forEach((tx) => {
      if (tx.type === 'SALE' || tx.type === 'SERVICE') {
        s.push(tx);
      } else if (tx.type === 'PAYMENT') {
        p.push(tx);
      } else if (tx.type === 'PURCHASE' || tx.type === 'EXPENSE') {
        pe.push(tx);
      }
    });

    return { sales: s, payments: p, purchasesExpenses: pe };
  }, [periodFilteredTransactions]);

  // Filter current active list by search query
  const currentList = useMemo(() => {
    let list: Transaction[] = [];
    if (activeCategory === 'SALES') list = sales;
    else if (activeCategory === 'PAYMENTS') list = payments;
    else if (activeCategory === 'PURCHASES_EXPENSES') list = purchasesExpenses;

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((tx) => {
      const name = (tx.customerName || tx.vendorName || '').toLowerCase();
      const item = (tx.item || '').toLowerCase();
      const expenseCat = (tx.expenseCategory || '').toLowerCase();
      const note = (tx.note || '').toLowerCase();
      return (
        name.includes(term) ||
        item.includes(term) ||
        expenseCat.includes(term) ||
        note.includes(term)
      );
    });
  }, [activeCategory, sales, payments, purchasesExpenses, searchTerm]);

  // Handle Save Edit
  const handleSaveEdit = async (updatedData: Partial<Transaction>) => {
    if (!editingTransaction) return;

    try {
      if (
        editingTransaction.type === 'SALE' ||
        editingTransaction.type === 'SERVICE' ||
        editingTransaction.type === 'PAYMENT'
      ) {
        if (!editingTransaction.customerId || !editingTransaction.id) {
          throw new Error('Missing transaction details');
        }
        await updateTransaction({
          customerId: editingTransaction.customerId,
          transactionId: editingTransaction.id,
          data: updatedData,
        }).unwrap();
      } else {
        if (!editingTransaction.id) {
          throw new Error('Missing purchase transaction id');
        }
        await updatePurchase({
          id: editingTransaction.id,
          data: updatedData,
        }).unwrap();
      }

      setEditingTransaction(null);
      dispatch(showSnackbar({ message: 'Transaction successfully updated!' }));
    } catch (err) {
      console.error(err);
      dispatch(showSnackbar({ message: 'Failed to update transaction' }));
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!editingTransaction) return;

    try {
      if (
        editingTransaction.type === 'SALE' ||
        editingTransaction.type === 'SERVICE' ||
        editingTransaction.type === 'PAYMENT'
      ) {
        if (!editingTransaction.customerId || !editingTransaction.id) {
          throw new Error('Missing transaction details');
        }
        await deleteTransaction({
          customerId: editingTransaction.customerId,
          transactionId: editingTransaction.id,
        }).unwrap();
      } else {
        if (!editingTransaction.id) {
          throw new Error('Missing purchase transaction id');
        }
        await deletePurchase({
          id: editingTransaction.id,
        }).unwrap();
      }

      setEditingTransaction(null);
      dispatch(showSnackbar({ message: 'Transaction deleted successfully' }));
    } catch (err) {
      console.error(err);
      dispatch(showSnackbar({ message: 'Failed to delete transaction' }));
    }
  };

  const getPeriodLabel = () => {
    if (filterMode === 'currentMonth') {
      return currentDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
    }
    if (filterMode === 'ytd') {
      return `YTD ${currentYear}`;
    }
    const d = new Date(currentYear, selectedMonth, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Header Title & Active Period */}
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-m3-on-surface">
            Activity Register
          </h2>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <p className="text-xs font-medium text-m3-on-surface-variant">
          Showing ledger for{' '}
          <strong className="text-m3-primary">{getPeriodLabel()}</strong>
        </p>
      </div>

      {/* 2. Top Filter Bar: Current Month, YTD, Month Dropdown */}
      <PeriodFilterBar
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        onFilterModeChange={setFilterMode}
        onMonthChange={setSelectedMonth}
      />

      {/* 3. Category Selector Tabs */}
      <ActivityCategoryTabs
        activeCategory={activeCategory}
        salesCount={sales.length}
        paymentsCount={payments.length}
        purchasesExpensesCount={purchasesExpenses.length}
        onSelectCategory={setActiveCategory}
      />

      {/* 4. Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-m3-on-surface-variant" />
        <input
          type="text"
          placeholder="Search by name, crop, payee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-m3-outline-variant bg-m3-surface-container-low py-2 pl-9 pr-3 text-xs text-m3-on-surface placeholder:text-m3-on-surface-variant/70 focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* 5. Transactions Stream */}
      {isLoading ? (
        <div className="space-y-2.5 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container-low"
            />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <Card
          variant="outlined"
          className="border-dashed border-m3-outline-variant p-8 text-center"
        >
          <EmptyState
            icon={<History className="h-8 w-8 text-m3-on-surface-variant" />}
            title="No activity found"
            description={
              searchTerm
                ? 'No transactions matching your search.'
                : 'No entries recorded in this category for the selected period.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {currentList.map((tx) => (
            <ActivityListItem
              key={tx.id || Math.random().toString()}
              transaction={tx}
              onEdit={(t) => setEditingTransaction(t)}
            />
          ))}
        </div>
      )}

      {/* 6. Edit Transaction Modal */}
      <EditActivityModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        isSaving={isSaving}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
    </PageContainer>
  );
};
export default ActivityPage;
