import React from 'react';
import { FlexLayout, ToggleButton, ToggleButtonGroup } from '@salt-ds/core';
import { Filter, Search, Users, X } from 'lucide-react';
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
        <Search size={16} className="hs-ledger-filter-bar__search-icon" />
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
            <X size={16} />
          </button>
        )}
      </div>

      {/* 2. Filter Tabs using ToggleButtonGroup */}
      <ToggleButtonGroup
        value={filterMode}
        onChange={(event) => {
          const val = (event.currentTarget as HTMLButtonElement).value;
          if (val === 'dueOnly' || val === 'all') {
            onFilterModeChange(val);
          }
        }}
        style={{ width: '100%' }}
      >
        <ToggleButton value="dueOnly" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={1}>
            <Filter size={14} />
            <span>Pending Dues ({customersWithDuesCount})</span>
          </FlexLayout>
        </ToggleButton>
        <ToggleButton value="all" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={1}>
            <Users size={14} />
            <span>All Accounts ({totalCustomersCount})</span>
          </FlexLayout>
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default LedgerFilterBar;
