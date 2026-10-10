import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FilterPeriodMode = 'month' | 'ytd' | 'all';

export interface TimelineState {
  selectedYear: number;
  selectedMonth: number; // 0-indexed: 0 = January, 11 = December
  filterMode: FilterPeriodMode;
}

const currentYear = new Date().getFullYear();
const defaultYear = currentYear >= 2026 ? currentYear : 2026;

const initialState: TimelineState = {
  selectedYear: defaultYear,
  selectedMonth: new Date().getMonth(),
  filterMode: 'month',
};

export const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setSelectedYear: (state, action: PayloadAction<number>) => {
      state.selectedYear = action.payload;
    },
    setSelectedMonth: (state, action: PayloadAction<number>) => {
      state.selectedMonth = action.payload;
    },
    setFilterMode: (state, action: PayloadAction<FilterPeriodMode>) => {
      state.filterMode = action.payload;
    },
    resetTimeline: (state) => {
      state.selectedYear = defaultYear;
      state.selectedMonth = new Date().getMonth();
      state.filterMode = 'month';
    },
  },
});

export const {
  setSelectedYear,
  setSelectedMonth,
  setFilterMode,
  resetTimeline,
} = timelineSlice.actions;

export default timelineSlice.reducer;
