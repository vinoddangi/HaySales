import React, { useMemo, useState } from 'react';
import {
  CropTransactionData,
  CustomerTransactionData,
  ExpenseTransactionData,
  isExpenseTransaction,
  isOpeningDueTransaction,
  isPaymentTransaction,
  isPurchaseTransaction,
  isSaleTransaction,
  isServiceTransaction,
  Transaction,
  VALID_CROP_CATEGORIES,
  VALID_EXPENSE_CATEGORIES,
  VALID_SERVICE_CATEGORIES,
} from '../../../../models';
import { useGetCustomersQuery } from '../../../../store/api';
import { parseNumber } from '../../../../utils/rawHelpers';

export interface UseActivityEditDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    _tx: Transaction,
    _updatedData: {
      date: string;
      amount: number;
      cashPaid: number;
      remainingDue: number;
      category?: string;
      weight?: number;
      discount?: number;
      note?: string;
      customerId?: string;
      customerName?: string;
      vendorName?: string;
    },
  ) => Promise<void>;
}

export function useActivityEditDrawer({
  transaction,
  isOpen,
  onClose,
  onSave,
}: UseActivityEditDrawerProps) {
  const { data: customers = [] } = useGetCustomersQuery();

  const custTx = transaction as Partial<CustomerTransactionData> | null;
  const expTx = transaction as Partial<ExpenseTransactionData> | null;
  const cropTx = transaction as Partial<CropTransactionData> | null;

  // Form Fields State (initialized directly from transaction for instant render / SSR)
  const [date, setDate] = useState(() => transaction?.date || '');
  const [customerId, setCustomerId] = useState(() => custTx?.customerId || '');
  const [vendorName, setVendorName] = useState(
    () => expTx?.vendorName || expTx?.partnerName || '',
  );
  const [category, setCategory] = useState(
    () => (transaction as any)?.category || '',
  );
  const [weight, setWeight] = useState(() => cropTx?.weight || 0);
  const [amount, setAmount] = useState(() => transaction?.amount || 0);
  const [cashPaid, setCashPaid] = useState(() => transaction?.cashPaid || 0);
  const [discount, setDiscount] = useState(
    () => (transaction as any)?.discount || 0,
  );
  const [note, setNote] = useState(() => transaction?.note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prevTxId, setPrevTxId] = useState(transaction?.id);

  // Adjust state during render when transaction changes (React recommended pattern)
  if (transaction && transaction.id !== prevTxId) {
    setPrevTxId(transaction.id);
    setDate(transaction.date || '');
    setAmount(transaction.amount || 0);
    setCashPaid(transaction.cashPaid || 0);
    setNote(transaction.note || '');
    setErrorMessage(null);
    setCustomerId(custTx?.customerId || '');
    setVendorName(expTx?.vendorName || expTx?.partnerName || '');
    setCategory((transaction as any)?.category || '');
    setWeight(cropTx?.weight || 0);
    setDiscount((transaction as any)?.discount || 0);
  }

  // Discriminated transaction type flags
  const isSale = Boolean(transaction && isSaleTransaction(transaction));
  const isPurchase = Boolean(transaction && isPurchaseTransaction(transaction));
  const isCrop = isSale || isPurchase;
  const isService = Boolean(transaction && isServiceTransaction(transaction));
  const isExpense = Boolean(transaction && isExpenseTransaction(transaction));
  const isPayment = Boolean(transaction && isPaymentTransaction(transaction));
  const isOpeningDue = Boolean(
    transaction && isOpeningDueTransaction(transaction),
  );

  // Derived Calculations
  const effectiveDiscount = discount > 0 ? discount : 0;
  const remainingDue = useMemo(() => {
    if (isPayment || isOpeningDue) return 0;
    return Math.max(0, amount - effectiveDiscount - cashPaid);
  }, [amount, effectiveDiscount, cashPaid, isPayment, isOpeningDue]);

  const derivedRate = useMemo(() => {
    if (isCrop && weight > 0 && amount > 0) {
      return Number((amount / weight).toFixed(2));
    }
    return undefined;
  }, [isCrop, weight, amount]);

  // Validation
  const isValid = useMemo(() => {
    if (amount <= 0 || !date.trim()) return false;
    if (isCrop && (weight <= 0 || !category.trim())) return false;
    if ((isService || isExpense) && !category.trim()) return false;
    if (isSaving) return false;
    return true;
  }, [amount, date, isCrop, weight, category, isService, isExpense, isSaving]);

  // Category select options
  const categoryOptions = useMemo(() => {
    if (isCrop) {
      return VALID_CROP_CATEGORIES.map((c) => ({ value: c, label: c }));
    }
    if (isService) {
      return VALID_SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }));
    }
    if (isExpense) {
      return VALID_EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }));
    }
    return [];
  }, [isCrop, isService, isExpense]);

  // Customer options
  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      value: c.id,
      label: c.name,
    }));
  }, [customers]);

  // Handlers
  const handleDateChange = (val: string) => {
    setDate(val);
  };

  const handleCustomerChange = (val: string) => {
    setCustomerId(val);
  };

  const handleVendorNameChange = (val: string) => {
    setVendorName(val);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
  };

  const handleWeightChange = (val: string) => {
    setWeight(parseNumber(val) || 0);
  };

  const handleAmountChange = (val: string) => {
    setAmount(parseNumber(val) || 0);
  };

  const handleCashPaidChange = (val: string) => {
    setCashPaid(parseNumber(val) || 0);
  };

  const handleDiscountChange = (val: string) => {
    setDiscount(parseNumber(val) || 0);
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !isValid) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const selectedCustomer = customers.find((c) => c.id === customerId);

      await onSave(transaction, {
        date,
        amount,
        cashPaid: isPayment ? amount : cashPaid,
        remainingDue,
        category: category || undefined,
        weight: isCrop ? weight : undefined,
        discount: effectiveDiscount > 0 ? effectiveDiscount : undefined,
        note: note.trim() || undefined,
        customerId: customerId || undefined,
        customerName: selectedCustomer?.name,
        vendorName: vendorName.trim() || undefined,
      });

      onClose();
    } catch (err) {
      setErrorMessage(
        (err as Error).message || 'Failed to save changes. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Badge properties
  let badgeLabel = 'Transaction';
  let badgeSentiment:
    'positive' | 'negative' | 'warning' | 'info' | 'neutral' | 'accent' =
    'neutral';

  if (isSale) {
    badgeLabel = 'Sale';
    badgeSentiment = 'accent';
  } else if (isPurchase) {
    badgeLabel = 'Purchase';
    badgeSentiment = 'info';
  } else if (isPayment) {
    badgeLabel = 'Payment';
    badgeSentiment = 'positive';
  } else if (isService) {
    badgeLabel = 'Service';
    badgeSentiment = 'neutral';
  } else if (isExpense) {
    badgeLabel = 'Expense';
    badgeSentiment = 'negative';
  } else if (isOpeningDue) {
    badgeLabel = 'Opening Due';
    badgeSentiment = 'warning';
  }

  return {
    isOpen,
    transaction,
    isSale,
    isPurchase,
    isCrop,
    isService,
    isExpense,
    isPayment,
    isOpeningDue,
    badgeLabel,
    badgeSentiment,
    date,
    customerId,
    vendorName,
    category,
    weight,
    amount,
    cashPaid,
    discount,
    remainingDue,
    derivedRate,
    note,
    isSaving,
    errorMessage,
    isValid,
    categoryOptions,
    customerOptions,
    handleDateChange,
    handleCustomerChange,
    handleVendorNameChange,
    handleCategoryChange,
    handleWeightChange,
    handleAmountChange,
    handleCashPaidChange,
    handleDiscountChange,
    handleNoteChange,
    handleSubmit,
    handleClose: onClose,
  };
}

export default useActivityEditDrawer;
