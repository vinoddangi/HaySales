import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasPendingPreviousYearRecords } from '../../api';
import { Card } from '../../components/common/Card';
import { CustomerSearchSelector } from '../../components/common/CustomerSearchSelector';
import { PageContainer } from '../../components/common/PageContainer';
import { useAppDispatch } from '../../store/hooks';
import {
  useAddTransactionMutation,
  useGetAllTransactionsQuery,
  useGetBackupStatusQuery,
  useGetCustomersQuery,
  useGetMonthlyRolloutStatusQuery,
} from '../../store/slices/customersApi';
import { showSnackbar } from '../../store/slices/uiSlice';
import { SaleForm } from './components/SaleForm';
import { ServiceForm } from './components/ServiceForm';

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentYear = new Date().getFullYear();
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: allTransactions = [] } = useGetAllTransactionsQuery();
  const { data: backupStatus } = useGetBackupStatusQuery();
  const { data: rolloutStatus } = useGetMonthlyRolloutStatusQuery();
  const [addTransaction, { isLoading: isSaving }] = useAddTransactionMutation();

  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [txType, setTxType] = useState<'SALE' | 'SERVICE'>('SALE');

  const hasPendingBackup = hasPendingPreviousYearRecords(
    allTransactions,
    currentYear,
    backupStatus,
  );

  const customer = customers.find((c) => c.id === selectedCustId);
  const outstandingDue = customer?.outstandingAmount || 0;
  const CREDIT_LIMIT = customer?.creditLimit || 35000;
  const isCreditAllowed = outstandingDue < CREDIT_LIMIT;

  const handleSaleSubmit = async (saleData: {
    item: string;
    weightKg: number;
    amount: number;
    cashPaid: number;
    date: string;
  }) => {
    if (!selectedCustId) return;
    try {
      await addTransaction({
        customerId: selectedCustId,
        type: 'SALE',
        item: saleData.item,
        weightKg: saleData.weightKg,
        amount: saleData.amount,
        discount: 0,
        cashPaid: saleData.cashPaid,
        date: saleData.date,
      }).unwrap();

      dispatch(
        showSnackbar({ message: 'Sale transaction successfully recorded!' }),
      );
      navigate('/');
    } catch (err) {
      console.error('Failed to save sale:', err);
      dispatch(showSnackbar({ message: 'Error saving sale transaction.' }));
    }
  };

  const handleServiceSubmit = async (serviceData: {
    item: string;
    amount: number;
    cashPaid: number;
    date: string;
    note?: string;
  }) => {
    if (!selectedCustId) return;
    try {
      await addTransaction({
        customerId: selectedCustId,
        type: 'SERVICE',
        item: serviceData.item,
        amount: serviceData.amount,
        discount: 0,
        cashPaid: serviceData.cashPaid,
        date: serviceData.date,
        note: serviceData.note,
      }).unwrap();

      dispatch(
        showSnackbar({ message: 'Service transaction successfully recorded!' }),
      );
      navigate('/');
    } catch (err) {
      console.error('Failed to save service:', err);
      dispatch(showSnackbar({ message: 'Error saving service transaction.' }));
    }
  };

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      <h2 className="text-lg font-bold text-m3-on-surface">Sales & Services</h2>

      {/* 1. Customer Search & Selection */}
      <Card variant="filled" className="bg-m3-surface-container p-4">
        <CustomerSearchSelector
          customers={customers}
          selectedCustomerId={selectedCustId}
          onSelectCustomer={setSelectedCustId}
          outstandingDue={outstandingDue}
          creditLimit={CREDIT_LIMIT}
        />
      </Card>

      {/* 2. Transaction Type Switcher and Form */}
      {customer && (
        <Card variant="outlined" className="space-y-4 p-4">
          <div className="flex rounded-lg bg-m3-surface-container-high p-1">
            <button
              type="button"
              onClick={() => setTxType('SALE')}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                txType === 'SALE'
                  ? 'shadow-xs bg-m3-primary text-m3-on-primary'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => setTxType('SERVICE')}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                txType === 'SERVICE'
                  ? 'shadow-xs bg-m3-primary text-m3-on-primary'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              Service
            </button>
          </div>

          {txType === 'SALE' ? (
            <SaleForm
              outstandingDue={outstandingDue}
              isCreditAllowed={isCreditAllowed}
              isSaving={isSaving}
              hasPendingBackup={hasPendingBackup}
              rolloutStatus={rolloutStatus}
              currentYear={currentYear}
              onSubmit={handleSaleSubmit}
            />
          ) : (
            <ServiceForm
              outstandingDue={outstandingDue}
              isCreditAllowed={isCreditAllowed}
              isSaving={isSaving}
              hasPendingBackup={hasPendingBackup}
              rolloutStatus={rolloutStatus}
              currentYear={currentYear}
              onSubmit={handleServiceSubmit}
            />
          )}
        </Card>
      )}
    </PageContainer>
  );
};
