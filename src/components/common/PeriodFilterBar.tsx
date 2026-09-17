import { Calendar, ChevronDown } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';
import { MONTH_NAMES } from '../../utils/formatters';

export type PeriodFilterMode = 'currentMonth' | 'ytd' | 'customMonth';

export interface PeriodFilterBarProps {
  filterMode: PeriodFilterMode;
  selectedMonth: number; // 0 - 11 (Jan - Dec)
  onFilterModeChange: (_mode: PeriodFilterMode) => void;
  onMonthChange: (_month: number) => void;
}

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  filterMode,
  selectedMonth,
  onFilterModeChange,
  onMonthChange,
}) => {
  const currentYear = new Date().getFullYear();

  const handleSelectMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val !== '') {
      onMonthChange(Number(val));
      onFilterModeChange('customMonth');
    }
  };

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {/* 1. Current Month Pill */}
      <button
        type="button"
        onClick={() => onFilterModeChange('currentMonth')}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
          filterMode === 'currentMonth'
            ? 'bg-m3-primary text-m3-on-primary shadow-sm'
            : 'border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        <span>Current Month</span>
      </button>

      {/* 2. YTD (Year to Date) Pill */}
      <button
        type="button"
        onClick={() => onFilterModeChange('ytd')}
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
          filterMode === 'ytd'
            ? 'bg-m3-primary text-m3-on-primary shadow-sm'
            : 'border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
        )}
      >
        <span>YTD ({currentYear})</span>
      </button>

      {/* 3. Direct Month Dropdown (Same Year) */}
      <div className="relative inline-flex items-center">
        <select
          value={filterMode === 'customMonth' ? selectedMonth : ''}
          onChange={handleSelectMonth}
          className={cn(
            'cursor-pointer appearance-none rounded-full py-1.5 pl-3.5 pr-7 text-xs font-semibold transition-all focus:outline-none',
            filterMode === 'customMonth'
              ? 'bg-m3-primary text-m3-on-primary shadow-sm'
              : 'border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
          )}
        >
          <option
            value=""
            disabled={filterMode === 'customMonth'}
            className="bg-m3-surface text-m3-on-surface"
          >
            {filterMode === 'customMonth'
              ? MONTH_NAMES[selectedMonth]
              : 'Select Month'}
          </option>
          {MONTH_NAMES.map((mName, idx) => (
            <option
              key={mName}
              value={idx}
              className="bg-m3-surface text-m3-on-surface"
            >
              {mName}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors',
            filterMode === 'customMonth'
              ? 'text-m3-on-primary'
              : 'text-m3-on-surface-variant',
          )}
        />
      </div>
    </div>
  );
};
