import { createSelector } from '@reduxjs/toolkit';
import { MONTH_NAMES } from '../../utils/formatters';
import type { RootState } from '../index';
import type { FilterPeriodMode, TimelineState } from '../slices/timelineSlice';

// ── Base Timeline Input Selector ─────────────────────────────────────────────

export const selectTimelineState = (state: RootState): TimelineState =>
  state.timeline;

// ── Timeline Primitive Selectors ─────────────────────────────────────────────

export const selectSelectedYear = createSelector(
  [selectTimelineState],
  (timeline): number => timeline.selectedYear,
);

export const selectSelectedMonth = createSelector(
  [selectTimelineState],
  (timeline): number => timeline.selectedMonth,
);

export const selectFilterMode = createSelector(
  [selectTimelineState],
  (timeline): FilterPeriodMode => timeline.filterMode,
);

export const selectIsYtd = createSelector(
  [selectFilterMode],
  (filterMode): boolean => filterMode === 'ytd',
);

// ── Date Helpers ─────────────────────────────────────────────────────────────

const pad = (n: number): string => String(n).padStart(2, '0');

const formatYmd = (year: number, monthIndex: number, day: number): string =>
  `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

const getDaysInMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate();

// ── Date Range Selectors ─────────────────────────────────────────────────────

/**
 * Returns the active start date formatted as 'YYYY-MM-DD'.
 */
export const selectFromDate = createSelector(
  [selectSelectedYear, selectSelectedMonth, selectFilterMode],
  (year, month, mode): string => {
    if (mode === 'all') {
      return '1970-01-01';
    }
    if (mode === 'ytd') {
      return formatYmd(year, 0, 1);
    }
    return formatYmd(year, month, 1);
  },
);

/**
 * Returns the active end date formatted as 'YYYY-MM-DD'.
 */
export const selectToDate = createSelector(
  [selectSelectedYear, selectSelectedMonth, selectFilterMode],
  (year, month, mode): string => {
    if (mode === 'all') {
      return '9999-12-31';
    }
    if (mode === 'ytd') {
      return formatYmd(year, 11, 31);
    }
    const lastDay = getDaysInMonth(year, month);
    return formatYmd(year, month, lastDay);
  },
);

/**
 * Returns the previous period start date formatted as 'YYYY-MM-DD'.
 */
export const selectPreviousFromDate = createSelector(
  [selectSelectedYear, selectSelectedMonth, selectFilterMode],
  (year, month, mode): string => {
    if (mode === 'all') {
      return '1970-01-01';
    }
    if (mode === 'ytd') {
      return formatYmd(year - 1, 0, 1);
    }
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    return formatYmd(prevYear, prevMonth, 1);
  },
);

/**
 * Returns the previous period end date formatted as 'YYYY-MM-DD'.
 */
export const selectPreviousToDate = createSelector(
  [selectSelectedYear, selectSelectedMonth, selectFilterMode],
  (year, month, mode): string => {
    if (mode === 'all') {
      return formatYmd(year - 1, 11, 31);
    }
    if (mode === 'ytd') {
      return formatYmd(year - 1, 11, 31);
    }
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const lastDay = getDaysInMonth(prevYear, prevMonth);
    return formatYmd(prevYear, prevMonth, lastDay);
  },
);

/**
 * Returns the active timeline date range.
 */
export const selectTimelineDateRange = createSelector(
  [selectFromDate, selectToDate],
  (fromDate, toDate): { fromDate: string; toDate: string } => ({
    fromDate,
    toDate,
  }),
);

/**
 * Returns the previous timeline date range.
 */
export const selectPreviousTimelineDateRange = createSelector(
  [selectPreviousFromDate, selectPreviousToDate],
  (previousFromDate, previousToDate): { fromDate: string; toDate: string } => ({
    fromDate: previousFromDate,
    toDate: previousToDate,
  }),
);

/**
 * Returns a human-readable label for the current selected timeline period.
 */
export const selectPeriodLabel = createSelector(
  [selectSelectedYear, selectSelectedMonth, selectFilterMode],
  (year, month, mode): string => {
    if (mode === 'all') return 'All Time';
    if (mode === 'ytd') return `${year} YTD`;
    return `${MONTH_NAMES[month]} ${year}`;
  },
);

/**
 * Returns a human-readable label for the previous comparison period.
 */
export const selectPreviousPeriodLabel = createSelector(
  [selectSelectedYear, selectSelectedMonth, selectFilterMode],
  (year, month, mode): string => {
    if (mode === 'all') return `${year - 1} Full Year`;
    if (mode === 'ytd') return `${year - 1} YTD`;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    return `${MONTH_NAMES[prevMonth]} ${prevYear}`;
  },
);

// ── Cumulative Till-Date Range Selectors (From Beginning up to Active/Prev Cutoff) ──

/**
 * Start date for cumulative till-date queries (from the beginning of history).
 */
export const selectTillDateFromDate = (): string => '1970-01-01';

/**
 * End date for cumulative till-date queries (up to active toDate).
 */
export const selectTillDateToDate = selectToDate;

/**
 * Date range representing the entire cumulative history up to active toDate.
 */
export const selectTillDateRange = createSelector(
  [selectToDate],
  (toDate): { fromDate: string; toDate: string } => ({
    fromDate: '1970-01-01',
    toDate,
  }),
);

/**
 * Start date for previous cumulative till-date queries.
 */
export const selectPreviousTillDateFromDate = (): string => '1970-01-01';

/**
 * End date for previous cumulative till-date queries (up to previous toDate).
 */
export const selectPreviousTillDateToDate = selectPreviousToDate;

/**
 * Date range representing the entire cumulative history up to previous comparison toDate.
 */
export const selectPreviousTillDateRange = createSelector(
  [selectPreviousToDate],
  (previousToDate): { fromDate: string; toDate: string } => ({
    fromDate: '1970-01-01',
    toDate: previousToDate,
  }),
);

