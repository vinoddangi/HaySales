import { Calendar, ChevronDown } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';
import { MONTH_NAMES } from '../../utils/formatters';
import { Flex } from '../layout/Flex';

export type PeriodFilterMode = 'month' | 'ytd' | 'currentMonth' | 'customMonth';

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
  const isMonthMode = filterMode !== 'ytd';

  const handleSelectMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      onMonthChange(val);
      onFilterModeChange('month');
    }
  };

  return (
    <Flex fullWidth align="center" gap="sm">
      {/* 1. Month Dropdown Pill (50% equal width) */}
      <div className="relative min-w-0 flex-1">
        <Flex
          fullWidth
          align="center"
          justify="between"
          gap="xs"
          paddingHorizontal="md"
          paddingVertical="xs"
          className={cn(
            'h-9 rounded-full text-xs font-semibold transition-all',
            isMonthMode
              ? 'bg-m3-primary text-m3-on-primary shadow-sm'
              : 'border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
          )}
        >
          <Flex align="center" gap="xs" className="min-w-0 truncate">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{MONTH_NAMES[selectedMonth]}</span>
          </Flex>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
        </Flex>

        {/* Native Select overlaid for reliable, accessible mobile picking */}
        <select
          aria-label="Select month"
          value={selectedMonth}
          onChange={handleSelectMonth}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
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
      </div>

      {/* 2. YTD (Year to Date) Pill (50% equal width) */}
      <button
        type="button"
        onClick={() => onFilterModeChange('ytd')}
        className={cn(
          'flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all',
          filterMode === 'ytd'
            ? 'bg-m3-primary text-m3-on-primary shadow-sm'
            : 'border border-m3-outline-variant bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface',
        )}
      >
        <span className="truncate">YTD ({currentYear})</span>
      </button>
    </Flex>
  );
};
