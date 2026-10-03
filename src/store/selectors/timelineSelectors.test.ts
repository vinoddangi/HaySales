import { describe, expect, it } from 'vitest';
import type { RootState } from '../index';
import {
  selectFilterMode,
  selectFromDate,
  selectIsYtd,
  selectPeriodLabel,
  selectPreviousFromDate,
  selectPreviousPeriodLabel,
  selectPreviousTillDateFromDate,
  selectPreviousTillDateRange,
  selectPreviousTillDateToDate,
  selectPreviousTimelineDateRange,
  selectPreviousToDate,
  selectSelectedMonth,
  selectSelectedYear,
  selectTillDateFromDate,
  selectTillDateRange,
  selectTillDateToDate,
  selectTimelineDateRange,
  selectToDate,
} from './timelineSelectors';

const createMockState = (
  selectedYear: number,
  selectedMonth: number,
  filterMode: 'month' | 'ytd' | 'all' = 'month',
): RootState =>
  ({
    timeline: {
      selectedYear,
      selectedMonth,
      filterMode,
    },
  }) as unknown as RootState;

describe('timelineSelectors', () => {
  describe('primitive selectors', () => {
    it('selects selectedYear, selectedMonth, filterMode, and isYtd', () => {
      const state = createMockState(2026, 2, 'month');
      expect(selectSelectedYear(state)).toBe(2026);
      expect(selectSelectedMonth(state)).toBe(2);
      expect(selectFilterMode(state)).toBe('month');
      expect(selectIsYtd(state)).toBe(false);

      const ytdState = createMockState(2026, 2, 'ytd');
      expect(selectIsYtd(ytdState)).toBe(true);
    });
  });

  describe('month mode date ranges', () => {
    it('calculates fromDate and toDate for a standard 31-day month (March 2026)', () => {
      const state = createMockState(2026, 2, 'month'); // March
      expect(selectFromDate(state)).toBe('2026-03-01');
      expect(selectToDate(state)).toBe('2026-03-31');
      expect(selectTimelineDateRange(state)).toEqual({
        fromDate: '2026-03-01',
        toDate: '2026-03-31',
      });
      expect(selectPeriodLabel(state)).toBe('March 2026');
    });

    it('calculates previous month fromDate and toDate (February 2026)', () => {
      const state = createMockState(2026, 2, 'month'); // March -> prev is Feb 2026 (non-leap: 28 days)
      expect(selectPreviousFromDate(state)).toBe('2026-02-01');
      expect(selectPreviousToDate(state)).toBe('2026-02-28');
      expect(selectPreviousTimelineDateRange(state)).toEqual({
        fromDate: '2026-02-01',
        toDate: '2026-02-28',
      });
      expect(selectPreviousPeriodLabel(state)).toBe('February 2026');
    });

    it('handles year rollover for January (January 2026 -> previous is December 2025)', () => {
      const state = createMockState(2026, 0, 'month'); // January
      expect(selectFromDate(state)).toBe('2026-01-01');
      expect(selectToDate(state)).toBe('2026-01-31');
      expect(selectPreviousFromDate(state)).toBe('2025-12-01');
      expect(selectPreviousToDate(state)).toBe('2025-12-31');
      expect(selectPeriodLabel(state)).toBe('January 2026');
      expect(selectPreviousPeriodLabel(state)).toBe('December 2025');
    });

    it('handles leap year in February (February 2024)', () => {
      const state = createMockState(2024, 1, 'month'); // Feb 2024
      expect(selectFromDate(state)).toBe('2024-02-01');
      expect(selectToDate(state)).toBe('2024-02-29');
    });
  });

  describe('ytd mode date ranges', () => {
    it('calculates YTD date ranges from Jan 1 up to Dec 31 of selected year', () => {
      const state = createMockState(2026, 2, 'ytd');
      expect(selectFromDate(state)).toBe('2026-01-01');
      expect(selectToDate(state)).toBe('2026-12-31');
      expect(selectTimelineDateRange(state)).toEqual({
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
      });
      expect(selectPeriodLabel(state)).toBe('2026 YTD');

      // Previous period YTD (Jan 1 2025 to Dec 31 2025)
      expect(selectPreviousFromDate(state)).toBe('2025-01-01');
      expect(selectPreviousToDate(state)).toBe('2025-12-31');
      expect(selectPreviousTimelineDateRange(state)).toEqual({
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      });
      expect(selectPreviousPeriodLabel(state)).toBe('2025 YTD');
    });
  });

  describe('all mode date ranges', () => {
    it('calculates all-time date ranges', () => {
      const state = createMockState(2026, 5, 'all');
      expect(selectFromDate(state)).toBe('1970-01-01');
      expect(selectToDate(state)).toBe('9999-12-31');
      expect(selectPeriodLabel(state)).toBe('All Time');
      expect(selectPreviousFromDate(state)).toBe('1970-01-01');
      expect(selectPreviousToDate(state)).toBe('2025-12-31');
      expect(selectPreviousPeriodLabel(state)).toBe('2025 Full Year');
    });
  });

  describe('till-date date range selectors', () => {
    it('calculates from-beginning till-date ranges for Month mode', () => {
      const state = createMockState(2026, 2, 'month'); // March 2026
      expect(selectTillDateFromDate()).toBe('1970-01-01');
      expect(selectTillDateToDate(state)).toBe('2026-03-31');
      expect(selectTillDateRange(state)).toEqual({
        fromDate: '1970-01-01',
        toDate: '2026-03-31',
      });

      expect(selectPreviousTillDateFromDate()).toBe('1970-01-01');
      expect(selectPreviousTillDateToDate(state)).toBe('2026-02-28');
      expect(selectPreviousTillDateRange(state)).toEqual({
        fromDate: '1970-01-01',
        toDate: '2026-02-28',
      });
    });

    it('calculates from-beginning till-date ranges for YTD mode', () => {
      const state = createMockState(2026, 2, 'ytd');
      expect(selectTillDateRange(state)).toEqual({
        fromDate: '1970-01-01',
        toDate: '2026-12-31',
      });
      expect(selectPreviousTillDateRange(state)).toEqual({
        fromDate: '1970-01-01',
        toDate: '2025-12-31',
      });
    });
  });
});
