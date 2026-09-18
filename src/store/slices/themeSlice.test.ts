import { describe, expect, it } from 'vitest';
import themeReducer, {
  setColorScheme,
  setFontSize,
  setThemeMode,
  togglePreviewFrame,
} from './themeSlice';

describe('themeSlice', () => {
  it('handles setThemeMode', () => {
    const initialState = {
      mode: 'light' as const,
      scheme: 'green' as const,
      fontSize: 'medium' as const,
      previewFrame: true,
    };
    const state = themeReducer(initialState, setThemeMode('dark'));
    expect(state.mode).toBe('dark');
  });

  it('handles setColorScheme', () => {
    const initialState = {
      mode: 'light' as const,
      scheme: 'green' as const,
      fontSize: 'medium' as const,
      previewFrame: true,
    };
    const state = themeReducer(initialState, setColorScheme('rose'));
    expect(state.scheme).toBe('rose');
  });

  it('handles setFontSize', () => {
    const initialState = {
      mode: 'light' as const,
      scheme: 'green' as const,
      fontSize: 'medium' as const,
      previewFrame: true,
    };
    const state = themeReducer(initialState, setFontSize('large'));
    expect(state.fontSize).toBe('large');
  });

  it('handles togglePreviewFrame', () => {
    const initialState = {
      mode: 'light' as const,
      scheme: 'green' as const,
      fontSize: 'medium' as const,
      previewFrame: true,
    };
    const state = themeReducer(initialState, togglePreviewFrame());
    expect(state.previewFrame).toBe(false);
  });
});
