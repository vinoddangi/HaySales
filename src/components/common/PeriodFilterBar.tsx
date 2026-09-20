import { Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';

export type PeriodFilterMode = 'month' | 'ytd';

export interface PeriodFilterBarProps {
  filterMode: PeriodFilterMode;
  selectedMonth: number; // 0 - 11 (Jan - Dec)
  onFilterModeChange: (_mode: PeriodFilterMode) => void;
  onMonthChange: (_month: number) => void;
}

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  filterMode,
  selectedMonth,
  onFilterModeChange,
  onMonthChange,
}) => {
  const isYtd = filterMode === 'ytd';
  const currentYear = new Date().getFullYear();

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthNum = Number(e.target.value);
    if (!isNaN(monthNum)) {
      onMonthChange(monthNum);
      onFilterModeChange('month');
    }
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center rounded-xl border border-m3-outline-variant bg-m3-surface-container-low p-1 shadow-sm">
        {/* Month Dropdown / Button (MMM format) */}
        <div className="relative flex-1">
          <button
            type="button"
            aria-label="Select month"
            onClick={() => {
              if (isYtd) {
                onFilterModeChange('month');
              }
            }}
            className={cn(
              'flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all',
              !isYtd
                ? 'shadow-xs bg-m3-primary text-m3-on-primary'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{SHORT_MONTH_NAMES[selectedMonth]}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </button>

          {/* Native select overlay - active only when Month mode is already active */}
          {!isYtd && (
            <select
              aria-label="Select month dropdown"
              value={selectedMonth}
              onChange={handleMonthSelect}
              className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
            >
              {SHORT_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name} {currentYear}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* YTD Button */}
        <button
          type="button"
          aria-label="YTD"
          onClick={() => onFilterModeChange('ytd')}
          className={cn(
            'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all',
            isYtd
              ? 'shadow-xs bg-m3-primary text-m3-on-primary'
              : 'text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>YTD</span>
        </button>
      </div>
    </div>
  );
};
