import React from 'react';
import { Flex } from '../../components/layouts/Flex';
import { Text } from '../../components/Text';
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
    selectedCustomerId,
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
      <Flex
        direction="column"
        gap="none"
        fullWidth
        className="hs-ledger-page__header"
      >
        <Text as="h2" variant="headline-sm" weight="bold">
          Customer Dues Ledger
        </Text>
        <Text variant="body-md" appearance="secondary">
          Track outstanding customer balances, account statements, and payment
          settlements
        </Text>
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

      {/* 4. Customer List */}
      <div className="hs-ledger-page__body">
        <CustomerLedgerList
          customers={filteredCustomerSummaries}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={handleSelectCustomer}
          isLoading={isLoading}
        />
      </div>

      {/* 5. Full-Page Customer Statement Drawer */}
      <CustomerLedgerDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        detail={selectedCustomerDetail}
        transactions={selectedCustomerTransactions}
        isLoadingTransactions={isLoading}
        isPaying={isPaying}
        onPay={handlePay}
      />
    </PageContainer>
  );
};

export default LedgerPage;
