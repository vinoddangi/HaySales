import React, { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { m3ColorSchemes } from './m3Tokens';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode, scheme, fontSize } = useAppSelector((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      mode === 'dark' ||
      (mode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

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

    // Font size scaling across rem units
    const fontScaleMap: Record<string, string> = {
      small: '87.5%', // ~14px base
      medium: '100%', // 16px standard base
      large: '112.5%', // 18px base (+1 Level)
    };
    root.style.fontSize = fontScaleMap[fontSize] || '100%';
  }, [mode, scheme, fontSize]);

  return <>{children}</>;
};
