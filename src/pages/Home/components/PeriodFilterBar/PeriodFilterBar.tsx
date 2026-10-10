import clsx from 'clsx';
import React from 'react';
import { FlexLayout, ToggleButton, ToggleButtonGroup } from '@salt-ds/core';
import { Calendar } from 'lucide-react';
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
      <FlexLayout
        direction="row"
        align="center"
        justify="space-between"
        gap={1}
      >
        {/* Mode Toggle Buttons: Monthly / YTD / All using Salt ToggleButtonGroup */}
        <ToggleButtonGroup
          value={filterMode}
          onChange={(e) =>
            onFilterModeChange(
              (e.currentTarget as HTMLButtonElement).value as FilterPeriodMode,
            )
          }
        >
          <ToggleButton value="month">Monthly</ToggleButton>
          <ToggleButton value="ytd">YTD {selectedYear}</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>

        {/* Month Dropdown Selector (Active in Monthly Mode) */}
        {filterMode === 'month' && (
          <div className="hs-period-filter-bar__select-wrapper">
            <Calendar size={16} className="hs-period-filter-bar__select-icon" />
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
      </FlexLayout>
    </div>
  );
};

export default PeriodFilterBar;
