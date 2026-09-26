import clsx from 'clsx';
import { Calendar } from 'lucide-react';
import React from 'react';
import { Flex } from '../../../../components/layouts/Flex';
import { MONTH_NAMES } from '../../../../utils/formatters';
import './PeriodFilterBar.css';

export interface PeriodFilterBarProps {
  filterMode: 'month' | 'ytd';
  selectedMonth: number;
  selectedYear: number;
  onFilterModeChange: (_mode: 'month' | 'ytd') => void;
  onMonthChange: (_month: number) => void;
  className?: string;
}

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  filterMode,
  selectedMonth,
  selectedYear,
  onFilterModeChange,
  onMonthChange,
  className,
}) => {
  const currentMonthIdx = new Date().getMonth();

  return (
    <div className={clsx('hs-period-filter-bar', className)}>
      <Flex align="center" justify="between" fullWidth gap="xs">
        {/* Mode Toggle Buttons: Current Month / YTD */}
        <div className="hs-period-filter-bar__segment">
          <button
            type="button"
            className={clsx(
              'hs-period-filter-bar__segment-btn',
              filterMode === 'month' &&
                'hs-period-filter-bar__segment-btn--active',
            )}
            onClick={() => onFilterModeChange('month')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={clsx(
              'hs-period-filter-bar__segment-btn',
              filterMode === 'ytd' &&
                'hs-period-filter-bar__segment-btn--active',
            )}
            onClick={() => onFilterModeChange('ytd')}
          >
            YTD {selectedYear}
          </button>
        </div>

        {/* Month Dropdown Selector (Active in Monthly Mode) */}
        {filterMode === 'month' && (
          <div className="hs-period-filter-bar__select-wrapper">
            <Calendar className="hs-period-filter-bar__select-icon" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              aria-label="Select Period Month"
              className="hs-period-filter-bar__select"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name} {idx === currentMonthIdx ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </Flex>
    </div>
  );
};

export default PeriodFilterBar;
