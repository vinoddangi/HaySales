import { useMemo, useState } from 'react';
import { CustomerLedgerDetail } from '../../business/ledgerBusiness';
import {
  CustomerModel,
  CustomerTransactionData,
  OpeningDueTransactionData,
  PaymentTransactionData,
} from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getTodayDateString } from '../../utils';
import {
  useAddCustomerTransactionMutation,
  useGetCustomersQuery,
  useGetCustomerTransactionsQuery,
} from '../../store/api';
import {
  selectAllCustomers,
  selectAllCustomerTransactions,
  selectCustomerLedgerDetailsMap,
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
  const { isLoading: isLoadingTransactions } =
    useGetCustomerTransactionsQuery(undefined);
  const [addCustomerTx, { isLoading: isPaying }] =
    useAddCustomerTransactionMutation();

  const rawCustomers = useAppSelector(selectAllCustomers);
  const allCustomerTransactions = useAppSelector(selectAllCustomerTransactions);
  const customerSummaries = useAppSelector(selectCustomerLedgerSummaries);
  const customerDetailsMap = useAppSelector(selectCustomerLedgerDetailsMap);
  const totalOutstanding = useAppSelector(selectTotalCustomerOutstanding);
  const customersWithDuesCount = useAppSelector(selectCustomersWithDuesCount);

  const customers: CustomerModel[] = useMemo(() => {
    return rawCustomers.map((c) => CustomerModel.from(c));
  }, [rawCustomers]);

  // Filtered customer ledger summaries for the list
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

  // Selected customer model
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Complete customer ledger detail & full transaction history (including synthesized opening due)
  const { selectedCustomerDetail, selectedCustomerTransactions } = useMemo(() => {
    if (!selectedCustomer || !selectedCustomerId) {
      return { selectedCustomerDetail: null, selectedCustomerTransactions: [] };
    }

    const summary = customerDetailsMap[selectedCustomerId];
    const customerTxs = allCustomerTransactions.filter(
      (t) => t.customerId === selectedCustomerId,
    );

    // If customer has opening due, synthesize an OpeningDue transaction so it appears in the statement
    const completeTxs: CustomerTransactionData[] = [...customerTxs];
    const openingDue = Number(selectedCustomer.openingDue || 0);
    const hasOpeningDueTx = customerTxs.some((t) => t.type === 'OPENING_DUE');

    if (openingDue > 0 && !hasOpeningDueTx) {
      const openingTx: OpeningDueTransactionData = {
        id: `opening-${selectedCustomer.id}`,
        type: 'OPENING_DUE',
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        amount: openingDue,
        cashPaid: 0,
        remainingDue: openingDue,
        date: '2025-01-01',
        note: 'Initial opening balance',
      };
      completeTxs.unshift(openingTx);
    }

    // Sort chronologically descending for statement
    completeTxs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const detail: CustomerLedgerDetail = summary
      ? {
          ...summary,
          customer: selectedCustomer,
          transactions: completeTxs,
        }
      : {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customer: selectedCustomer,
          openingDue,
          totalSales: 0,
          totalServices: 0,
          totalBilled: openingDue,
          totalPaid: 0,
          totalDiscounts: 0,
          currentOutstanding: openingDue,
          transactionCount: completeTxs.length,
          transactions: completeTxs,
        };

    return {
      selectedCustomerDetail: detail,
      selectedCustomerTransactions: completeTxs,
    };
  }, [
    selectedCustomer,
    selectedCustomerId,
    customerDetailsMap,
    allCustomerTransactions,
  ]);

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
    selectedCustomerId,
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
