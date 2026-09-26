import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateCustomerOutstanding } from '../../business/ledgerBusiness';
import {
  CropCategory,
  CustomerModel,
  SaleTransactionData,
  ServiceCategory,
  ServiceTransactionData,
} from '../../models';
import { useAppDispatch } from '../../store/hooks';
import {
  useAddCustomerTransactionMutation,
  useGetCustomersQuery,
  useGetCustomerTransactionsQuery,
} from '../../store/slices/customersApi';
import { showSnackbar } from '../../store/slices/uiSlice';
import { SaleFormData } from './components/SaleFormCard';
import { ServiceFormData } from './components/ServiceFormCard';

export function useSalesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [activeType, setActiveType] = useState<'SALE' | 'SERVICE'>('SALE');

  const { data: rawCustomers = [] } = useGetCustomersQuery();
  const { data: customerTransactions = [] } =
    useGetCustomerTransactionsQuery(undefined);
  const [addCustomerTx, { isLoading: isSaving }] =
    useAddCustomerTransactionMutation();

  const customers: CustomerModel[] = useMemo(() => {
    return rawCustomers.map((c) => CustomerModel.from(c));
  }, [rawCustomers]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const outstandingDue = useMemo(() => {
    if (!selectedCustomer) return 0;
    return calculateCustomerOutstanding(
      selectedCustomer.id,
      customerTransactions,
      undefined,
      selectedCustomer.openingDue || 0,
    );
  }, [selectedCustomer, customerTransactions]);

  const creditLimit = selectedCustomer?.creditLimit ?? 35000;

  const handleSaleSubmit = async (data: SaleFormData) => {
    if (!selectedCustomerId || !selectedCustomer) return;
    try {
      const remainingDue = Math.max(
        0,
        data.amount - (data.discount || 0) - data.cashPaid,
      );

      const saleTx: SaleTransactionData = {
        type: 'SALE',
        category: data.category as CropCategory,
        weight: data.weight,
        amount: data.amount,
        cashPaid: data.cashPaid,
        remainingDue,
        customerId: selectedCustomerId,
        customerName: selectedCustomer.name,
        date: data.date,
        discount: data.discount,
        note: data.note,
      };

      await addCustomerTx(saleTx).unwrap();
      dispatch(showSnackbar({ message: 'Crop sale successfully recorded!' }));
      navigate('/');
    } catch (err) {
      console.error('Failed to save sale:', err);
      dispatch(showSnackbar({ message: 'Error recording sale invoice.' }));
    }
  };

  const handleServiceSubmit = async (data: ServiceFormData) => {
    if (!selectedCustomerId || !selectedCustomer) return;
    try {
      const remainingDue = Math.max(
        0,
        data.amount - (data.discount || 0) - data.cashPaid,
      );

      const serviceTx: ServiceTransactionData = {
        type: 'SERVICE',
        category: data.category as ServiceCategory,
        amount: data.amount,
        cashPaid: data.cashPaid,
        remainingDue,
        customerId: selectedCustomerId,
        customerName: selectedCustomer.name,
        date: data.date,
        discount: data.discount,
        note: data.note,
      };

      await addCustomerTx(serviceTx).unwrap();
      dispatch(
        showSnackbar({ message: 'Service transaction successfully recorded!' }),
      );
      navigate('/');
    } catch (err) {
      console.error('Failed to save service:', err);
      dispatch(showSnackbar({ message: 'Error recording service.' }));
    }
  };

  return {
    customers,
    selectedCustomerId,
    selectedCustomer,
    outstandingDue,
    creditLimit,
    activeType,
    isSaving,
    setSelectedCustomerId,
    setActiveType,
    handleSaleSubmit,
    handleServiceSubmit,
  };
}
