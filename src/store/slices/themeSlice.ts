import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorScheme, FontSize, ThemeMode } from '../../types';

interface ThemeState {
  mode: ThemeMode;
  scheme: ColorScheme;
  fontSize: FontSize;
  previewFrame: boolean;
}

// Initial state with local storage fallback
const initialMode =
  (localStorage.getItem('m3-theme-mode') as ThemeMode) || 'light';
const initialScheme =
  (localStorage.getItem('m3-color-scheme') as ColorScheme) || 'green';
const initialFontSize =
  (localStorage.getItem('m3-font-size') as FontSize) || 'medium';
const initialPreviewFrame =
  localStorage.getItem('m3-preview-frame') !== 'false';

const initialState: ThemeState = {
  mode: initialMode,
  scheme: initialScheme,
  fontSize: initialFontSize,
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
    setFontSize: (state, action: PayloadAction<FontSize>) => {
      state.fontSize = action.payload;
      localStorage.setItem('m3-font-size', action.payload);
    },
    togglePreviewFrame: (state) => {
      state.previewFrame = !state.previewFrame;
      localStorage.setItem('m3-preview-frame', String(state.previewFrame));
    },
  },
});

export const { setThemeMode, setColorScheme, setFontSize, togglePreviewFrame } =
  themeSlice.actions;
export default themeSlice.reducer;
