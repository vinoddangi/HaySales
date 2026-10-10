import React from 'react';
import {
  FlexLayout,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@salt-ds/core';
import { clsx } from 'clsx';
import {
  Layers,
  LayoutGrid,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import './ActivityFilterBar.css';

export type ActivityFilterType = 'all' | 'sales' | 'payments' | 'others';

export interface ActivityFilterBarProps {
  searchTerm: string;
  onSearchChange: (_term: string) => void;
  filterType: ActivityFilterType;
  onFilterTypeChange: (_type: ActivityFilterType) => void;
  allCount: number;
  salesCount: number;
  paymentsCount: number;
  othersCount: number;
  onResetFilters?: () => void;
  className?: string;
}

export const ActivityFilterBar: React.FC<ActivityFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  allCount,
  salesCount,
  paymentsCount,
  othersCount,
  onResetFilters,
  className,
}) => {
  const isFiltered = Boolean(searchTerm.trim() || filterType !== 'all');

  return (
    <div className={clsx('hs-activity-filter-bar', className)}>
      {/* Search Input Bar + Optional Reset Button */}
      <div className="hs-activity-filter-bar__top">
        <div className="hs-activity-search">
          <Search size={16} className="hs-activity-search__icon" />
          <input
            type="text"
            placeholder="Search by customer, vendor, note, ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="hs-activity-search__input"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="hs-activity-search__clear"
            >
              <X size={16} className="hs-activity-search__clear-icon" />
            </button>
          )}
        </div>

        {isFiltered && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="hs-activity-filter-bar__reset-btn"
            title="Reset all filters"
          >
            <RotateCcw size={14} />
            <Text styleAs="notation">Reset</Text>
          </button>
        )}
      </div>

      {/* 4-Filter Tabs: All vs Sales vs Payments vs Others */}
      <ToggleButtonGroup
        value={filterType}
        onChange={(event) => {
          const val = (event.currentTarget as HTMLButtonElement).value;
          if (
            val === 'all' ||
            val === 'sales' ||
            val === 'payments' ||
            val === 'others'
          ) {
            onFilterTypeChange(val);
          }
        }}
        style={{ width: '100%' }}
      >
        <ToggleButton value="all" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={0.5}>
            <LayoutGrid size={14} />
            <span>All ({allCount})</span>
          </FlexLayout>
        </ToggleButton>
        <ToggleButton value="sales" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={0.5}>
            <ShoppingBag size={14} />
            <span>Sales ({salesCount})</span>
          </FlexLayout>
        </ToggleButton>
        <ToggleButton value="payments" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={0.5}>
            <Receipt size={14} />
            <span>Payments ({paymentsCount})</span>
          </FlexLayout>
        </ToggleButton>
        <ToggleButton value="others" style={{ flex: 1 }}>
          <FlexLayout align="center" justify="center" gap={0.5}>
            <Layers size={14} />
            <span>Others ({othersCount})</span>
          </FlexLayout>
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default ActivityFilterBar;
