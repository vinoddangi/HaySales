import clsx from 'clsx';
import {
  LayoutGrid,
  Layers,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import React from 'react';
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
          <Search className="hs-activity-search__icon" />
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
              <X className="hs-activity-search__clear-icon" />
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
            <RotateCcw className="h-3.5 w-3.5" />
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
          <LayoutGrid
            className={clsx(
              'h-4 w-4 shrink-0',
              filterType === 'all'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant',
            )}
          />
          <Text
            variant="label-md"
            weight={filterType === 'all' ? 'bold' : 'medium'}
            className={
              filterType === 'all'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant'
            }
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
          <ShoppingBag
            className={clsx(
              'h-4 w-4 shrink-0',
              filterType === 'sales'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant',
            )}
          />
          <Text
            variant="label-md"
            weight={filterType === 'sales' ? 'bold' : 'medium'}
            className={
              filterType === 'sales'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant'
            }
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
          <Receipt
            className={clsx(
              'h-4 w-4 shrink-0',
              filterType === 'payments'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant',
            )}
          />
          <Text
            variant="label-md"
            weight={filterType === 'payments' ? 'bold' : 'medium'}
            className={
              filterType === 'payments'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant'
            }
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
          <Layers
            className={clsx(
              'h-4 w-4 shrink-0',
              filterType === 'others'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant',
            )}
          />
          <Text
            variant="label-md"
            weight={filterType === 'others' ? 'bold' : 'medium'}
            className={
              filterType === 'others'
                ? 'text-m3-on-primary'
                : 'text-m3-on-surface-variant'
            }
          >
            Others ({othersCount})
          </Text>
        </button>
      </div>
    </div>
  );
};

export default ActivityFilterBar;
