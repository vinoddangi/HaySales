import React from 'react';
import {
  IconFilter,
  IconSearch,
  IconUsers,
  IconX,
} from '../../../../components/Icon';
import { SegmentedButton } from '../../../../components/SegmentedButton';
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
        <IconSearch size="md" className="hs-ledger-filter-bar__search-icon" />
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
            <IconX size="md" />
          </button>
        )}
      </div>

      {/* 2. Filter Tabs using SegmentedButton */}
      <SegmentedButton
        value={filterMode}
        onChange={(val) => onFilterModeChange(val as 'dueOnly' | 'all')}
        segments={[
          {
            value: 'dueOnly',
            label: `Pending Dues (${customersWithDuesCount})`,
            icon: <IconFilter size="sm" />,
          },
          {
            value: 'all',
            label: `All Accounts (${totalCustomersCount})`,
            icon: <IconUsers size="sm" />,
          },
        ]}
      />
    </div>
  );
};

export default LedgerFilterBar;
