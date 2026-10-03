import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { BottomSheetState, SnackbarState, UiState } from '../slices/uiSlice';

// ── Base UI Input Selector ───────────────────────────────────────────────────

export const selectUiState = (state: RootState): UiState => state.ui;

// ── UI Memoized Selectors ────────────────────────────────────────────────────

export const selectSnackbar = createSelector(
  [selectUiState],
  (ui): SnackbarState => ui.snackbar,
);

export const selectBottomSheet = createSelector(
  [selectUiState],
  (ui): BottomSheetState => ui.bottomSheet,
);

export const selectSearchQuery = createSelector(
  [selectUiState],
  (ui): string => ui.searchQuery,
);

export const selectIsSearchOpen = createSelector(
  [selectUiState],
  (ui): boolean => ui.isSearchOpen,
);

export const selectIsSyncing = createSelector(
  [selectUiState],
  (ui): boolean => ui.isSyncing,
);
