import React from 'react';
import { Flex } from '../../components/layouts/Flex';
import { PageContainer } from '../../views/PageContainer';
import {
  CustomerLedgerDrawer,
  CustomerLedgerList,
  LedgerFilterBar,
  LedgerOverviewCards,
} from './components';
import './LedgerPage.css';
import { useLedgerPage } from './useLedgerPage';

export const LedgerPage: React.FC = () => {
  const {
    searchTerm,
    filterMode,
    isDrawerOpen,
    selectedCustomerDetail,
    selectedCustomerTransactions,
    filteredCustomerSummaries,
    totalOutstanding,
    customersWithDuesCount,
    totalCustomersCount,
    isLoading,
    isPaying,
    setSearchTerm,
    setFilterMode,
    handleSelectCustomer,
    handleCloseDrawer,
    handlePay,
  } = useLedgerPage();

  return (
    <PageContainer spacing="md" bottomPadding="lg" className="hs-ledger-page">
      {/* 1. Page Header */}
      <Flex direction="column" gap="none" fullWidth className="hs-ledger-page__header">
        <h2 className="hs-ledger-page__title">Customer Dues Ledger</h2>
        <p className="hs-ledger-page__subtitle">
          Track outstanding customer balances, account statements, and payment settlements
        </p>
      </Flex>

      {/* 2. Overview Summary Cards */}
      <LedgerOverviewCards
        totalOutstanding={totalOutstanding}
        customersWithDuesCount={customersWithDuesCount}
        totalCustomersCount={totalCustomersCount}
      />

      {/* 3. Search and Filter Bar */}
      <LedgerFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        customersWithDuesCount={customersWithDuesCount}
        totalCustomersCount={totalCustomersCount}
      />

      {/* 4. Customer Accounts List */}
      <CustomerLedgerList
        customers={filteredCustomerSummaries}
        onSelectCustomer={handleSelectCustomer}
        isLoading={isLoading}
      />

      {/* 5. Customer Ledger Account Drawer */}
      <CustomerLedgerDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        detail={selectedCustomerDetail}
        transactions={selectedCustomerTransactions}
        isPaying={isPaying}
        onPay={handlePay}
      />
    </PageContainer>
  );
};

export default LedgerPage;
