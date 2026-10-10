import React from 'react';
import { FlexLayout, Pill, Spinner, Text } from '@salt-ds/core';
import { Search } from 'lucide-react';
import { CustomerTransactionData } from '../../../../models';
import { TransactionHistoryItem } from '../TransactionHistoryItem';
import './TransactionHistoryList.css';
import {
  TxFilterType,
  useTransactionHistoryList,
} from './useTransactionHistoryList';

export interface TransactionHistoryListProps {
  transactions: CustomerTransactionData[];
  isLoading?: boolean;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  isLoading,
}) => {
  const {
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    salesCount,
    paymentsCount,
    othersCount,
    sortedTransactions,
    filteredTransactions,
    clearedTxIds,
  } = useTransactionHistoryList({ transactions });

  const filterOptions: Array<{ key: TxFilterType; label: string }> = [
    { key: 'ALL', label: `All (${sortedTransactions.length})` },
    { key: 'SALE', label: `Sales (${salesCount})` },
    { key: 'PAYMENT', label: `Payments (${paymentsCount})` },
    { key: 'OTHERS', label: `Others (${othersCount})` },
  ];

  return (
    <div className="hs-tx-history-list">
      <FlexLayout
        justify="space-between"
        align="center"
        className="hs-tx-history-list__header"
      >
        <Text styleAs="label">
          <b>TRANSACTION STATEMENT ({sortedTransactions.length})</b>
        </Text>
        <Pill>Settled Highlighted</Pill>
      </FlexLayout>

      {/* 1. Filter Bar & Search */}
      <div className="hs-tx-history-list__filter-bar">
        <div className="hs-tx-history-list__search-row">
          <Search size={16} className="hs-tx-history-list__search-icon" />
          <input
            type="text"
            className="hs-tx-history-list__search-input"
            placeholder="Search crop, service, amount, notes, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="hs-tx-history-list__chips">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterType(opt.key)}
              className={`hs-tx-history-list__chip ${
                filterType === opt.key ? 'hs-tx-history-list__chip--active' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Transaction List */}
      {isLoading ? (
        <FlexLayout
          align="center"
          justify="center"
          style={{ padding: 'var(--salt-spacing-300)' }}
        >
          <Spinner size="medium" />
        </FlexLayout>
      ) : filteredTransactions.length === 0 ? (
        <div className="hs-tx-history-list__empty">
          <Text styleAs="notation" color="secondary">
            {sortedTransactions.length === 0
              ? 'No transactions recorded for this customer.'
              : 'No transactions match the selected filter.'}
          </Text>
        </div>
      ) : (
        <div className="hs-tx-history-list__items">
          {filteredTransactions.map((tx, index) => (
            <TransactionHistoryItem
              key={tx.id || `${tx.customerId || 'tx'}-${tx.date}-${index}`}
              transaction={tx}
              isCleared={Boolean(tx.id && clearedTxIds.has(tx.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryList;
