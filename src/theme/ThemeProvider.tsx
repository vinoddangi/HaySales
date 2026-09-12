import React, { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { m3ColorSchemes } from './m3Tokens';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode, scheme } = useAppSelector((state) => state.theme);

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
  }, [mode, scheme]);

  return <>{children}</>;
};
