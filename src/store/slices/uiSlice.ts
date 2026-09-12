import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BottomSheetConfig {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemId?: string;
}

interface SnackbarConfig {
  isOpen: boolean;
  message: string;
  actionLabel?: string;
}

interface UIState {
  bottomSheet: BottomSheetConfig;
  snackbar: SnackbarConfig;
  searchQuery: string;
  isSearchOpen: boolean;
}

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
  searchQuery: '',
  isSearchOpen: false,
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
      action: PayloadAction<{ message: string; actionLabel?: string }>,
    ) => {
      state.snackbar = {
        isOpen: true,
        message: action.payload.message,
        actionLabel: action.payload.actionLabel,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.isOpen = false;
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
  openBottomSheet,
  closeBottomSheet,
  showSnackbar,
  hideSnackbar,
  setSearchQuery,
  toggleSearch,
  closeSearch,
} = uiSlice.actions;

export default uiSlice.reducer;
