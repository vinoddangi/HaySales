import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PeriodFilterMode } from '../../types';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface BottomSheetConfig {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemId?: string;
}

interface SnackbarConfig {
  isOpen: boolean;
  message: string;
  type?: SnackbarType;
  actionLabel?: string;
}

interface UIState {
  bottomSheet: BottomSheetConfig;
  snackbar: SnackbarConfig;
  isLoading: boolean;
  loadingMessage?: string;
  searchQuery: string;
  isSearchOpen: boolean;
  filterMode: PeriodFilterMode;
  selectedMonth: number;
}

const savedFilterMode =
  typeof localStorage !== 'undefined'
    ? (localStorage.getItem('hay_period_filter_mode') as PeriodFilterMode)
    : null;
const initialFilterMode: PeriodFilterMode =
  savedFilterMode === 'month' || savedFilterMode === 'ytd'
    ? savedFilterMode
    : 'month';

const savedSelectedMonth =
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('hay_period_selected_month')
    : null;
const parsedMonth =
  savedSelectedMonth !== null ? parseInt(savedSelectedMonth, 10) : NaN;
const initialSelectedMonth: number =
  !isNaN(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11
    ? parsedMonth
    : new Date().getMonth();

const initialState: UIState = {
  bottomSheet: {
    isOpen: false,
    title: '',
    description: '',
  },
  snackbar: {
    isOpen: false,
    message: '',
  },
  isLoading: false,
  loadingMessage: '',
  searchQuery: '',
  isSearchOpen: false,
  filterMode: initialFilterMode,
  selectedMonth: initialSelectedMonth,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openBottomSheet: (
      state,
      action: PayloadAction<{
        title?: string;
        description?: string;
        itemId?: string;
      }>,
    ) => {
      state.bottomSheet = {
        isOpen: true,
        title: action.payload.title,
        description: action.payload.description,
        itemId: action.payload.itemId,
      };
    },
    closeBottomSheet: (state) => {
      state.bottomSheet.isOpen = false;
    },
    showSnackbar: (
      state,
      action: PayloadAction<{
        message: string;
        type?: SnackbarType;
        actionLabel?: string;
      }>,
    ) => {
      state.snackbar = {
        isOpen: true,
        message: action.payload.message,
        type: action.payload.type,
        actionLabel: action.payload.actionLabel,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.isOpen = false;
    },
    showLoading: (state, action: PayloadAction<string | undefined>) => {
      state.isLoading = true;
      state.loadingMessage = action.payload || '';
    },
    hideLoading: (state) => {
      state.isLoading = false;
      state.loadingMessage = '';
    },
    setLoading: (
      state,
      action: PayloadAction<boolean | { isLoading: boolean; message?: string }>,
    ) => {
      if (typeof action.payload === 'boolean') {
        state.isLoading = action.payload;
        state.loadingMessage = '';
      } else {
        state.isLoading = action.payload.isLoading;
        state.loadingMessage = action.payload.message || '';
      }
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
    setFilterMode: (state, action: PayloadAction<PeriodFilterMode>) => {
      state.filterMode = action.payload;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hay_period_filter_mode', action.payload);
      }
    },
    setSelectedMonth: (state, action: PayloadAction<number>) => {
      state.selectedMonth = action.payload;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          'hay_period_selected_month',
          String(action.payload),
        );
      }
    },
  },
});

export const {
  openBottomSheet,
  closeBottomSheet,
  showSnackbar,
  hideSnackbar,
  showLoading,
  hideLoading,
  setLoading,
  setSearchQuery,
  toggleSearch,
  closeSearch,
  setFilterMode,
  setSelectedMonth,
} = uiSlice.actions;

export default uiSlice.reducer;
