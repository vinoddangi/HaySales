import { UserCheck } from 'lucide-react';
import React from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionHeader } from '../../components/SectionHeader';
import { PageContainer } from '../../views/PageContainer';
import {
  CustomerSelectorCard,
  SaleFormCard,
  SalesTypeSelector,
  ServiceFormCard,
} from './components';
import './SalesPage.css';
import { useSalesPage } from './useSalesPage';

export const SalesPage: React.FC = () => {
  const {
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
  } = useSalesPage();

  return (
    <PageContainer spacing="md" bottomPadding="lg" className="hs-sales-page">
      {/* 1. Page Header */}
      <SectionHeader
        title="Sales & Services"
        subtitle="Register crop sales invoices and custom agricultural service charges"
      />

      {/* 2. Customer Selector Card */}
      <CustomerSelectorCard
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={setSelectedCustomerId}
        outstandingDue={outstandingDue}
        creditLimit={creditLimit}
      />

      {/* 3. Transaction Form (when customer is selected) */}
      {selectedCustomer ? (
        <>
          <SalesTypeSelector
            activeType={activeType}
            onChange={(type) => setActiveType(type)}
          />

          {activeType === 'SALE' ? (
            <SaleFormCard
              outstandingDue={outstandingDue}
              creditLimit={creditLimit}
              isSaving={isSaving}
              onSubmit={handleSaleSubmit}
            />
          ) : (
            <ServiceFormCard
              outstandingDue={outstandingDue}
              creditLimit={creditLimit}
              isSaving={isSaving}
              onSubmit={handleServiceSubmit}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<UserCheck className="h-8 w-8" />}
          headline="Select Customer Account"
          body="Please select a customer account above to record a new sale or service invoice."
        />
      )}
    </PageContainer>
  );
};

export default SalesPage;
