import { describe, expect, it } from 'vitest';
import uiReducer, {
  closeBottomSheet,
  closeSearch,
  hideLoading,
  hideSnackbar,
  openBottomSheet,
  setFilterMode,
  setLoading,
  setSelectedMonth,
  setSearchQuery,
  showLoading,
  showSnackbar,
  toggleSearch,
} from './uiSlice';

describe('uiSlice', () => {
  it('handles showSnackbar and hideSnackbar', () => {
    const initialState = uiReducer(undefined, { type: 'unknown' });

    const shown = uiReducer(
      initialState,
      showSnackbar({ message: 'Saved successfully!' }),
    );
    expect(shown.snackbar.isOpen).toBe(true);
    expect(shown.snackbar.message).toBe('Saved successfully!');

    const hidden = uiReducer(shown, hideSnackbar());
    expect(hidden.snackbar.isOpen).toBe(false);
  });

  it('handles bottomSheet open and close', () => {
    const initialState = uiReducer(undefined, { type: 'unknown' });

    const opened = uiReducer(
      initialState,
      openBottomSheet({ title: 'Item Sheet', itemId: '123' }),
    );
    expect(opened.bottomSheet.isOpen).toBe(true);
    expect(opened.bottomSheet.title).toBe('Item Sheet');

    const closed = uiReducer(opened, closeBottomSheet());
    expect(closed.bottomSheet.isOpen).toBe(false);
  });

  it('handles search actions', () => {
    const initialState = uiReducer(undefined, { type: 'unknown' });

    const queryState = uiReducer(initialState, setSearchQuery('Alfalfa'));
    expect(queryState.searchQuery).toBe('Alfalfa');

    const toggled = uiReducer(queryState, toggleSearch());
    expect(toggled.isSearchOpen).toBe(true);

    const closed = uiReducer(toggled, closeSearch());
    expect(closed.isSearchOpen).toBe(false);
    expect(closed.searchQuery).toBe('');
  });

  it('handles loading state actions', () => {
    const initialState = uiReducer(undefined, { type: 'unknown' });
    expect(initialState.isLoading).toBe(false);

    const loadingState = uiReducer(
      initialState,
      showLoading('Saving transaction...'),
    );
    expect(loadingState.isLoading).toBe(true);
    expect(loadingState.loadingMessage).toBe('Saving transaction...');

    const hiddenState = uiReducer(loadingState, hideLoading());
    expect(hiddenState.isLoading).toBe(false);
    expect(hiddenState.loadingMessage).toBe('');

    const toggledBool = uiReducer(hiddenState, setLoading(true));
    expect(toggledBool.isLoading).toBe(true);
  });

  it('handles setFilterMode and setSelectedMonth with persistence', () => {
    const initialState = uiReducer(undefined, { type: 'unknown' });
    expect(initialState.filterMode).toBe('month');

    const ytdState = uiReducer(initialState, setFilterMode('ytd'));
    expect(ytdState.filterMode).toBe('ytd');
    expect(localStorage.getItem('hay_period_filter_mode')).toBe('ytd');

    const monthState = uiReducer(ytdState, setSelectedMonth(5));
    expect(monthState.selectedMonth).toBe(5);
    expect(localStorage.getItem('hay_period_selected_month')).toBe('5');
  });
});
