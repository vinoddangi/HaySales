import React, { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { m3ColorSchemes } from './m3Tokens';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode, scheme, fontSize } = useAppSelector((state) => state.theme);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const isDark = mode === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const currentPalette = m3ColorSchemes[scheme] || m3ColorSchemes.green;
    const tokens = isDark ? currentPalette.dark : currentPalette.light;

    Object.entries(tokens).forEach(([cssVar, value]) => {
      root.style.setProperty(cssVar, value);
    });

    const fontScaleMap = {
      small: '87.5%',
      medium: '100%',
      large: '112.5%',
    };
    root.style.fontSize = fontScaleMap[fontSize] || '100%';
  }, [mode, scheme, fontSize]);

  return <>{children}</>;
};
