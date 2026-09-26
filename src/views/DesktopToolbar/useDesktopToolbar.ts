import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  ColorScheme,
  setColorScheme,
  setThemeMode,
  togglePreviewFrame,
} from '../../store/slices/themeSlice';

export const schemes: { id: ColorScheme; color: string }[] = [
  { id: 'green', color: '#006c4c' },
  { id: 'purple', color: '#6750a4' },
  { id: 'blue', color: '#0061a4' },
  { id: 'orange', color: '#8b5000' },
  { id: 'rose', color: '#9c4146' },
];

export const useDesktopToolbar = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme, previewFrame } = useAppSelector((state) => state.theme);

  const handleSelectScheme = (schemeId: ColorScheme) => {
    dispatch(setColorScheme(schemeId));
  };

  const handleToggleTheme = () => {
    dispatch(setThemeMode(mode === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleFrame = () => {
    dispatch(togglePreviewFrame());
  };

  return {
    mode,
    scheme,
    previewFrame,
    schemes,
    handleSelectScheme,
    handleToggleTheme,
    handleToggleFrame,
  };
};
