import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorScheme, ThemeMode } from '../../types';

interface ThemeState {
  mode: ThemeMode;
  scheme: ColorScheme;
  previewFrame: boolean;
}

// Initial state with local storage fallback
const initialMode =
  (localStorage.getItem('m3-theme-mode') as ThemeMode) || 'light';
const initialScheme =
  (localStorage.getItem('m3-color-scheme') as ColorScheme) || 'green';
const initialPreviewFrame =
  localStorage.getItem('m3-preview-frame') !== 'false';

const initialState: ThemeState = {
  mode: initialMode,
  scheme: initialScheme,
  previewFrame: initialPreviewFrame,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem('m3-theme-mode', action.payload);
    },
    setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
      state.scheme = action.payload;
      localStorage.setItem('m3-color-scheme', action.payload);
    },
    togglePreviewFrame: (state) => {
      state.previewFrame = !state.previewFrame;
      localStorage.setItem('m3-preview-frame', String(state.previewFrame));
    },
  },
});

export const { setThemeMode, setColorScheme, togglePreviewFrame } =
  themeSlice.actions;
export default themeSlice.reducer;
