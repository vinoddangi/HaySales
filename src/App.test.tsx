import { describe, expect, it } from 'vitest';
import { store } from './store';
import {
  setColorScheme,
  setThemeMode,
  toggleThemeMode,
} from './store/slices/themeSlice';
import { setFilterMode } from './store/slices/uiSlice';
import { m3ColorSchemes } from './theme/m3Tokens';

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
    expect(m3ColorSchemes.purple.light['--md-sys-color-primary']).toBe(
      '#6750a4',
    );

    store.dispatch(setColorScheme('blue'));
    expect(store.getState().theme.scheme).toBe('blue');
    expect(m3ColorSchemes.blue.light['--md-sys-color-primary']).toBe('#0061a4');
  });

  it('manages filter period correctly', () => {
    store.dispatch(setFilterMode('ytd'));
    expect(store.getState().ui.filterMode).toBe('ytd');

    store.dispatch(setFilterMode('month'));
    expect(store.getState().ui.filterMode).toBe('month');
  });
});
