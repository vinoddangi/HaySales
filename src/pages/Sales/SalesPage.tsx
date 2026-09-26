import { UserCheck } from 'lucide-react';
import React from 'react';
import { Flex } from '../../components/layouts/Flex';
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
      <Flex
        direction="column"
        gap="none"
        fullWidth
        className="hs-sales-page__header"
      >
        <h2 className="hs-sales-page__title">Sales & Services</h2>
        <p className="hs-sales-page__subtitle">
          Register crop sales invoices and custom agricultural service charges
        </p>
      </Flex>

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
        <div className="hs-sales-page__empty-state">
          <UserCheck className="text-m3-on-surface-variant h-8 w-8 opacity-50" />
          <p className="hs-sales-page__empty-text">
            Please select a customer account above to record a new sale or
            service invoice.
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default SalesPage;
