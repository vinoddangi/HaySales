import { describe, expect, it } from 'vitest';
import uiReducer, {
  closeBottomSheet,
  closeSearch,
  hideSnackbar,
  openBottomSheet,
  setSearchQuery,
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
});
