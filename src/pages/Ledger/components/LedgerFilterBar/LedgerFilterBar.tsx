import { Filter, Search, Users, X } from 'lucide-react';
import React from 'react';
import { Text } from '../../../../components/Text';
import { cn } from '../../../../utils/cn';
import './LedgerFilterBar.css';

export interface LedgerFilterBarProps {
  searchTerm: string;
  onSearchChange: (_value: string) => void;
  filterMode: 'dueOnly' | 'all';
  onFilterModeChange: (_mode: 'dueOnly' | 'all') => void;
  customersWithDuesCount: number;
  totalCustomersCount: number;
}

export const LedgerFilterBar: React.FC<LedgerFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  customersWithDuesCount,
  totalCustomersCount,
}) => {
  return (
    <div className="hs-ledger-filter-bar">
      {/* 1. Search Bar */}
      <div className="hs-ledger-filter-bar__search">
        <Search className="hs-ledger-filter-bar__search-icon" />
        <input
          type="text"
          placeholder="Search accounts by name or village..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="hs-ledger-filter-bar__search-input"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="hs-ledger-filter-bar__clear-btn"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Filter Tabs (Pending Dues vs All Accounts) */}
      <div className="hs-ledger-filter-bar__tabs">
        <button
          type="button"
          onClick={() => onFilterModeChange('dueOnly')}
          className={cn(
            'hs-ledger-filter-bar__tab-btn',
            filterMode === 'dueOnly' && 'hs-ledger-filter-bar__tab-btn--active',
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <Text
            variant="label-sm"
            weight={filterMode === 'dueOnly' ? 'bold' : 'medium'}
          >
            Pending Dues ({customersWithDuesCount})
          </Text>
        </button>

        <button
          type="button"
          onClick={() => onFilterModeChange('all')}
          className={cn(
            'hs-ledger-filter-bar__tab-btn',
            filterMode === 'all' && 'hs-ledger-filter-bar__tab-btn--active',
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <Text
            variant="label-sm"
            weight={filterMode === 'all' ? 'bold' : 'medium'}
          >
            All Accounts ({totalCustomersCount})
          </Text>
        </button>
      </div>
    </div>
  );
};

export default LedgerFilterBar;
