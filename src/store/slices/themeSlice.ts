import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';
export type ColorScheme = 'green' | 'purple' | 'blue' | 'orange' | 'rose';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeState {
  mode: ThemeMode;
  scheme: ColorScheme;
  fontSize: FontSize;
  previewFrame: boolean;
}

const getStored = (key: string, fallback: string): string => {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function'
    ) {
      return window.localStorage.getItem(key) || fallback;
    }
  } catch {
    // ignore
  }
  return fallback;
};

const setStored = (key: string, value: string): void => {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.setItem === 'function'
    ) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
};

const initialState: ThemeState = {
  mode: getStored('theme_mode', 'light') as ThemeMode,
  scheme: getStored('theme_scheme', 'green') as ColorScheme,
  fontSize: getStored('theme_font_size', 'medium') as FontSize,
  previewFrame: getStored('theme_preview_frame', 'false') === 'true',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      setStored('theme_mode', action.payload);
      if (typeof document !== 'undefined') {
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    toggleThemeMode: (state) => {
      const next = state.mode === 'dark' ? 'light' : 'dark';
      state.mode = next;
      setStored('theme_mode', next);
      if (typeof document !== 'undefined') {
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
      state.scheme = action.payload;
      setStored('theme_scheme', action.payload);
    },
    setFontSize: (state, action: PayloadAction<FontSize>) => {
      state.fontSize = action.payload;
      setStored('theme_font_size', action.payload);
    },
    togglePreviewFrame: (state) => {
      state.previewFrame = !state.previewFrame;
      setStored('theme_preview_frame', String(state.previewFrame));
    },
  },
});

export const {
  setThemeMode,
  toggleThemeMode,
  setColorScheme,
  setFontSize,
  togglePreviewFrame,
} = themeSlice.actions;
export default themeSlice.reducer;
