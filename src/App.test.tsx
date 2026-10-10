import { describe, expect, it } from 'vitest';
import { store } from './store';
import {
  setColorScheme,
  setThemeMode,
  toggleThemeMode,
} from './store/slices/themeSlice';

describe('Redux Toolkit Store & Slices', () => {
  it('manages theme mode correctly', () => {
    store.dispatch(setThemeMode('light'));
    expect(store.getState().theme.mode).toBe('light');

    store.dispatch(toggleThemeMode());
    expect(store.getState().theme.mode).toBe('dark');
  });

  it('manages color scheme palettes correctly', () => {
    store.dispatch(setColorScheme('purple'));
    expect(store.getState().theme.scheme).toBe('purple');

    store.dispatch(setColorScheme('blue'));
    expect(store.getState().theme.scheme).toBe('blue');
  });
});
