import { describe, expect, it } from 'vitest';
import timelineReducer, {
  resetTimeline,
  setFilterMode,
  setSelectedMonth,
  setSelectedYear,
  TimelineState,
} from './timelineSlice';

describe('timelineSlice', () => {
  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear >= 2025 ? currentYear : 2025;
  const currentMonth = new Date().getMonth();

  const initialState: TimelineState = {
    selectedYear: defaultYear,
    selectedMonth: currentMonth,
    filterMode: 'month',
  };

  it('should return initial state when passed undefined action', () => {
    expect(timelineReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should update selectedYear when setSelectedYear is dispatched', () => {
    const nextState = timelineReducer(initialState, setSelectedYear(2025));
    expect(nextState.selectedYear).toBe(2025);
  });

  it('should update selectedMonth when setSelectedMonth is dispatched', () => {
    const nextState = timelineReducer(initialState, setSelectedMonth(6));
    expect(nextState.selectedMonth).toBe(6);
  });

  it('should update filterMode when setFilterMode is dispatched', () => {
    const ytdState = timelineReducer(initialState, setFilterMode('ytd'));
    expect(ytdState.filterMode).toBe('ytd');

    const allState = timelineReducer(ytdState, setFilterMode('all'));
    expect(allState.filterMode).toBe('all');
  });

  it('should reset timeline state when resetTimeline is dispatched', () => {
    const modifiedState: TimelineState = {
      selectedYear: 2020,
      selectedMonth: 2,
      filterMode: 'all',
    };
    const reset = timelineReducer(modifiedState, resetTimeline());
    expect(reset.selectedYear).toBe(defaultYear);
    expect(reset.selectedMonth).toBe(currentMonth);
    expect(reset.filterMode).toBe('month');
  });
});
