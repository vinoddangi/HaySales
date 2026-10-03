import { useMemo, useState } from 'react';
import { calculateCustomerLedgerDetail } from '../../business/ledgerBusiness';
import { CustomerModel, PaymentTransactionData } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getTodayDateString } from '../../utils';
import {
  useAddCustomerTransactionMutation,
  useGetCustomersQuery,
  useGetCustomerTransactionsQuery,
} from '../../store/api';
import {
  selectAllCustomers,
  selectCustomerLedgerSummaries,
  selectCustomersWithDuesCount,
  selectTotalCustomerOutstanding,
} from '../../store/selectors';
import { showSnackbar } from '../../store/slices/uiSlice';

export function useLedgerPage() {
  const dispatch = useAppDispatch();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'dueOnly' | 'all'>('dueOnly');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useGetCustomerTransactionsQuery(undefined);
  const [addCustomerTx, { isLoading: isPaying }] =
    useAddCustomerTransactionMutation();

  const rawCustomers = useAppSelector(selectAllCustomers);
  const customerSummaries = useAppSelector(selectCustomerLedgerSummaries);
  const totalOutstanding = useAppSelector(selectTotalCustomerOutstanding);
  const customersWithDuesCount = useAppSelector(selectCustomersWithDuesCount);

  const customers: CustomerModel[] = useMemo(() => {
    return rawCustomers.map((c) => CustomerModel.from(c));
  }, [rawCustomers]);

  // Filtered customer ledger summaries
  const filteredCustomerSummaries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return customerSummaries.filter((c) => {
      const matchesSearch =
        !term || c.customerName.toLowerCase().includes(term);
      const matchesDueFilter =
        filterMode === 'all' || c.currentOutstanding > 0 || term.length > 0;
      return matchesSearch && matchesDueFilter;
    });
  }, [customerSummaries, searchTerm, filterMode]);

  // Selected customer details for drawer
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedCustomerDetail = useMemo(() => {
    if (!selectedCustomer) return null;
    return calculateCustomerLedgerDetail(selectedCustomer, transactions);
  }, [selectedCustomer, transactions]);

  const selectedCustomerTransactions = useMemo(() => {
    if (!selectedCustomerId) return [];
    return transactions.filter((t) => t.customerId === selectedCustomerId);
  }, [transactions, selectedCustomerId]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handlePay = async (
    paymentAmount: number,
    paymentDate?: string,
    discount?: number,
  ) => {
    if (!selectedCustomerId || !selectedCustomer) return;
    if (paymentAmount <= 0 && (!discount || discount <= 0)) return;

    try {
      const paymentTx: PaymentTransactionData = {
        type: 'PAYMENT',
        customerId: selectedCustomerId,
        customerName: selectedCustomer.name,
        amount: paymentAmount,
        cashPaid: paymentAmount,
        remainingDue: 0,
        discount: discount || 0,
        date: paymentDate || getTodayDateString(),
      };

      await addCustomerTx(paymentTx).unwrap();
      setIsDrawerOpen(false);
      dispatch(
        showSnackbar({ message: 'Account payment successfully recorded!' }),
      );
    } catch (err) {
      console.error('Failed to record payment:', err);
      dispatch(showSnackbar({ message: 'Failed to record account payment' }));
    }
  };

  return {
    searchTerm,
    filterMode,
    isDrawerOpen,
    selectedCustomerDetail,
    selectedCustomerTransactions,
    filteredCustomerSummaries,
    totalOutstanding,
    customersWithDuesCount,
    totalCustomersCount: customers.length,
    isLoading: isLoadingCustomers || isLoadingTransactions,
    isPaying,
    setSearchTerm,
    setFilterMode,
    handleSelectCustomer,
    handleCloseDrawer,
    handlePay,
  };
}
