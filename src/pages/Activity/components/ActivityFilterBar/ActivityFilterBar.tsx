import clsx from 'clsx';
import React from 'react';
import {
  IconLayers,
  IconLayoutGrid,
  IconReceipt,
  IconRotateCcw,
  IconSearch,
  IconShoppingBag,
  IconX,
} from '../../../../components/Icon';
import { Text } from '../../../../components/Text';
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
          <IconSearch size={18} className="hs-activity-search__icon" />
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
              <IconX size="sm" className="hs-activity-search__clear-icon" />
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
            <IconRotateCcw size={14} />
            <Text variant="label-sm" weight="medium">
              Reset
            </Text>
          </button>
        )}
      </div>

      {/* 4-Filter Tabs: All vs Sales vs Payments vs Others */}
      <div className="hs-activity-filter-tabs">
        <button
          type="button"
          onClick={() => onFilterTypeChange('all')}
          className={clsx(
            'hs-activity-filter-tab-btn',
            filterType === 'all'
              ? 'hs-activity-filter-tab-btn--active'
              : 'hs-activity-filter-tab-btn--inactive',
          )}
        >
          <IconLayoutGrid
            size="sm"
            className="hs-activity-filter-tab-btn__icon"
          />
          <Text
            variant="label-md"
            weight={filterType === 'all' ? 'bold' : 'medium'}
            className="hs-activity-filter-tab-btn__label"
          >
            All ({allCount})
          </Text>
        </button>

        <button
          type="button"
          onClick={() => onFilterTypeChange('sales')}
          className={clsx(
            'hs-activity-filter-tab-btn',
            filterType === 'sales'
              ? 'hs-activity-filter-tab-btn--active'
              : 'hs-activity-filter-tab-btn--inactive',
          )}
        >
          <IconShoppingBag
            size="sm"
            className="hs-activity-filter-tab-btn__icon"
          />
          <Text
            variant="label-md"
            weight={filterType === 'sales' ? 'bold' : 'medium'}
            className="hs-activity-filter-tab-btn__label"
          >
            Sales ({salesCount})
          </Text>
        </button>

        <button
          type="button"
          onClick={() => onFilterTypeChange('payments')}
          className={clsx(
            'hs-activity-filter-tab-btn',
            filterType === 'payments'
              ? 'hs-activity-filter-tab-btn--active'
              : 'hs-activity-filter-tab-btn--inactive',
          )}
        >
          <IconReceipt size="sm" className="hs-activity-filter-tab-btn__icon" />
          <Text
            variant="label-md"
            weight={filterType === 'payments' ? 'bold' : 'medium'}
            className="hs-activity-filter-tab-btn__label"
          >
            Payments ({paymentsCount})
          </Text>
        </button>

        <button
          type="button"
          onClick={() => onFilterTypeChange('others')}
          className={clsx(
            'hs-activity-filter-tab-btn',
            filterType === 'others'
              ? 'hs-activity-filter-tab-btn--active'
              : 'hs-activity-filter-tab-btn--inactive',
          )}
        >
          <IconLayers size="sm" className="hs-activity-filter-tab-btn__icon" />
          <Text
            variant="label-md"
            weight={filterType === 'others' ? 'bold' : 'medium'}
            className="hs-activity-filter-tab-btn__label"
          >
            Others ({othersCount})
          </Text>
        </button>
      </div>
    </div>
  );
};

export default ActivityFilterBar;
