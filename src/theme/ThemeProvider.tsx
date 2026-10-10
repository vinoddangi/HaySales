import { SaltProviderNext, type Accent } from '@salt-ds/core';
import React from 'react';
import { useAppSelector } from '../store/hooks';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode, scheme } = useAppSelector((state) => state.theme);

  // Strictly support what accent is supported by Salt ("teal" | "blue")
  const accent: Accent = scheme === 'blue' ? 'blue' : 'teal';

  return (
    <SaltProviderNext
      accent={accent}
      corner="rounded"
      headingFont="Amplitude"
      actionFont="Amplitude"
      density="touch"
      mode={mode}
    >
      {children}
    </SaltProviderNext>
  );
};
