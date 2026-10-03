import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { FilterPeriodMode, TimelineState } from '../slices/timelineSlice';

// ── Base Timeline Input Selector ─────────────────────────────────────────────

export const selectTimelineState = (state: RootState): TimelineState =>
  state.timeline;

// ── Timeline Memoized Selectors ──────────────────────────────────────────────

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
