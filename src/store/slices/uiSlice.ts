import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FilterPeriodMode = 'month' | 'ytd';

export interface SnackbarState {
  open: boolean;
  message: string;
  actionLabel?: string;
}

export interface BottomSheetState {
  open: boolean;
  title?: string;
  description?: string;
}

export interface UiState {
  selectedYear: number;
  selectedMonth: number;
  filterMode: FilterPeriodMode;
  snackbar: SnackbarState;
  bottomSheet: BottomSheetState;
  searchQuery: string;
  isSearchOpen: boolean;
  isSyncing: boolean;
}

const currentYear = new Date().getFullYear();
const defaultYear = currentYear >= 2026 ? currentYear : 2026;

const initialState: UiState = {
  selectedYear: defaultYear,
  selectedMonth: new Date().getMonth(),
  filterMode: 'month',
  snackbar: {
    open: false,
    message: '',
  },
  bottomSheet: {
    open: false,
    title: '',
    description: '',
  },
  searchQuery: '',
  isSearchOpen: false,
  isSyncing: false,
};

export const uiSlice = createSlice({
  name: 'ui',
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
    setIsSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    showSnackbar: (
      state,
      action: PayloadAction<string | { message: string; actionLabel?: string }>,
    ) => {
      if (typeof action.payload === 'string') {
        state.snackbar = {
          open: true,
          message: action.payload,
        };
      } else {
        state.snackbar = {
          open: true,
          message: action.payload.message,
          actionLabel: action.payload.actionLabel,
        };
      }
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    openBottomSheet: (
      state,
      action: PayloadAction<
        { title?: string; description?: string } | undefined
      >,
    ) => {
      state.bottomSheet = {
        open: true,
        title: action?.payload?.title || '',
        description: action?.payload?.description || '',
      };
    },
    closeBottomSheet: (state) => {
      state.bottomSheet.open = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
      if (!state.isSearchOpen) {
        state.searchQuery = '';
      }
    },
    closeSearch: (state) => {
      state.isSearchOpen = false;
      state.searchQuery = '';
    },
  },
});

export const {
  setSelectedYear,
  setSelectedMonth,
  setFilterMode,
  setIsSyncing,
  showSnackbar,
  hideSnackbar,
  openBottomSheet,
  closeBottomSheet,
  setSearchQuery,
  toggleSearch,
  closeSearch,
} = uiSlice.actions;

export default uiSlice.reducer;
