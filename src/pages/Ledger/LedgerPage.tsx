import { Filter, IndianRupee, Search, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { PageContainer } from '../../components/common/PageContainer';
import { useAppDispatch } from '../../store/hooks';
import {
  useAddTransactionMutation,
  useGetCustomersQuery,
  useGetTransactionsQuery,
} from '../../store/slices/customersApi';
import { showSnackbar } from '../../store/slices/uiSlice';
import { formatRupee } from '../../utils/formatters';
import { CustomerLedgerList } from './components/CustomerLedgerList';
import { LedgerDetailDrawer } from './components/LedgerDetailDrawer';

export const LedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: customers = [], isLoading: isLoadingLedger } =
    useGetCustomersQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'dueOnly'>('dueOnly');
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [addTransaction, { isLoading: isPaying }] = useAddTransactionMutation();

  const { data: transactions = [], isLoading: loadingTx } =
    useGetTransactionsQuery(
      selectedCustId
        ? { customerId: selectedCustId }
        : { customerId: '', limitCount: 0 },
      { skip: !selectedCustId },
    );

  const customer = customers.find((c) => c.id === selectedCustId);

  // Aggregated summary metrics using stored outstandingAmount
  const totalOutstanding = customers.reduce(
    (sum, c) => sum + (c.outstandingAmount || 0),
    0,
  );
  const customersWithDueCount = customers.filter(
    (c) => (c.outstandingAmount || 0) > 0,
  ).length;

  // Filter list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDueFilter =
      filterMode === 'all' || (c.outstandingAmount || 0) > 0;
    return matchesSearch && matchesDueFilter;
  });

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustId(customerId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handlePay = async (paymentAmount: number, paymentDate?: string) => {
    if (!selectedCustId || paymentAmount <= 0) return;
    try {
      await addTransaction({
        customerId: selectedCustId,
        type: 'PAYMENT',
        paymentAmount,
        date: paymentDate,
      }).unwrap();

      setIsDrawerOpen(false);
      dispatch(showSnackbar({ message: 'Payment successfully recorded!' }));
      navigate('/');
    } catch (err) {
      console.error(err);
      dispatch(showSnackbar({ message: 'Failed to record payment' }));
    }
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          variant="filled"
          className="space-y-1 bg-m3-surface-container p-3.5"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-m3-error">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Total Outstanding</span>
          </div>
          <p className="text-base font-extrabold text-m3-error">
            {formatRupee(totalOutstanding)}
          </p>
        </Card>

        <Card
          variant="filled"
          className="space-y-1 bg-m3-surface-container p-3.5"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-m3-primary">
            <Users className="h-3.5 w-3.5" />
            <span>Accounts Due</span>
          </div>
          <p className="text-base font-extrabold text-m3-on-surface">
            {customersWithDueCount}{' '}
            <span className="text-xs font-normal text-m3-on-surface-variant">
              / {customers.length}
            </span>
          </p>
        </Card>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-m3-on-surface-variant" />
          <input
            type="text"
            placeholder="Search accounts by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-m3-outline bg-m3-surface py-2.5 pl-9 pr-8 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-m3-on-surface-variant hover:bg-m3-surface-container-high"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Tabs: Accounts with Dues vs All Accounts */}
        <div className="flex rounded-lg bg-m3-surface-container p-1">
          <button
            type="button"
            onClick={() => setFilterMode('dueOnly')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              filterMode === 'dueOnly'
                ? 'shadow-xs bg-m3-primary text-m3-on-primary'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>Pending Dues ({customersWithDueCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'shadow-xs bg-m3-primary text-m3-on-primary'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface'
            }`}
          >
            <span>All Accounts ({customers.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Customer Accounts Ledger List */}
      {isLoadingLedger ? (
        <Card
          variant="filled"
          className="bg-m3-surface-container p-8 text-center"
        >
          <p className="animate-pulse text-xs text-m3-on-surface-variant">
            Calculating customer balances from transactions...
          </p>
        </Card>
      ) : (
        <CustomerLedgerList
          customers={filteredCustomers}
          onSelectCustomer={handleSelectCustomer}
        />
      )}

      {/* 4. Customer Detail Drawer */}
      <LedgerDetailDrawer
        isOpen={isDrawerOpen}
        customer={customer}
        transactions={transactions}
        isLoadingTransactions={loadingTx}
        isPaying={isPaying}
        onClose={handleCloseDrawer}
        onPay={handlePay}
      />
    </PageContainer>
  );
};
