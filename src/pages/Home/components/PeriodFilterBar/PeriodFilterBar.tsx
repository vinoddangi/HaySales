import clsx from 'clsx';
import React from 'react';
import { IconCalendar } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { SegmentedButton } from '../../../../components/SegmentedButton';
import { FilterPeriodMode } from '../../../../store/slices/timelineSlice';
import { MONTH_NAMES } from '../../../../utils/formatters';
import './PeriodFilterBar.css';

export interface PeriodFilterBarProps {
  filterMode: FilterPeriodMode;
  selectedMonth: number;
  selectedYear: number;
  onFilterModeChange: (_mode: FilterPeriodMode) => void;
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
        {/* Mode Toggle Buttons: Monthly / YTD / All using SegmentedButton */}
        <SegmentedButton
          value={filterMode}
          onChange={(val) => onFilterModeChange(val as FilterPeriodMode)}
          segments={[
            { value: 'month', label: 'Monthly' },
            { value: 'ytd', label: `YTD ${selectedYear}` },
            { value: 'all', label: 'All' },
          ]}
        />

        {/* Month Dropdown Selector (Active in Monthly Mode) */}
        {filterMode === 'month' && (
          <div className="hs-period-filter-bar__select-wrapper">
            <IconCalendar
              size="sm"
              className="hs-period-filter-bar__select-icon"
            />
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
