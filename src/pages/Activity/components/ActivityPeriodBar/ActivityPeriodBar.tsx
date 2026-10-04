import clsx from 'clsx';
import React from 'react';
import { FilterPeriodMode } from '../../../../store/slices/timelineSlice';
import { PeriodFilterBar } from '../../../Home/components/PeriodFilterBar';
import './ActivityPeriodBar.css';

export interface ActivityPeriodBarProps {
  filterMode: FilterPeriodMode;
  selectedMonth: number;
  selectedYear: number;
  onFilterModeChange: (_mode: FilterPeriodMode) => void;
  onMonthChange: (_month: number) => void;
  className?: string;
}

export const ActivityPeriodBar: React.FC<ActivityPeriodBarProps> = ({
  filterMode,
  selectedMonth,
  selectedYear,
  onFilterModeChange,
  onMonthChange,
  className,
}) => {
  return (
    <div className={clsx('hs-activity-period-bar', className)}>
      <PeriodFilterBar
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onFilterModeChange={onFilterModeChange}
        onMonthChange={onMonthChange}
      />
    </div>
  );
};

export default ActivityPeriodBar;
