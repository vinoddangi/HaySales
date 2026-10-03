import { Search } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Progress } from '../../../../components/Progress';
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
    sortedTransactions,
    filteredTransactions,
    clearedTxIds,
  } = useTransactionHistoryList({ transactions });

  const filterOptions: Array<{ key: TxFilterType; label: string }> = [
    { key: 'ALL', label: `All (${sortedTransactions.length})` },
    { key: 'SALE', label: 'Sales' },
    { key: 'SERVICE', label: 'Services' },
    { key: 'PAYMENT', label: 'Payments' },
    { key: 'OPENING_DUE', label: 'Opening Due' },
  ];

  return (
    <div className="hs-tx-history-list">
      <div className="hs-tx-history-list__header">
        <span className="hs-tx-history-list__title">
          Transaction Statement ({sortedTransactions.length})
        </span>
        <Badge sentiment="positive" appearance="subtle">
          Settled Highlighted
        </Badge>
      </div>

      {/* 1. Filter Bar & Search */}
      <div className="hs-tx-history-list__filter-bar">
        <div className="hs-tx-history-list__search-row">
          <Search className="h-4 w-4 text-m3-on-surface-variant shrink-0" />
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
        <div className="hs-tx-history-list__empty">
          <Progress type="circular" indeterminate fourColor />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="hs-tx-history-list__empty">
          {sortedTransactions.length === 0
            ? 'No transactions recorded for this customer.'
            : 'No transactions match the selected filter.'}
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
