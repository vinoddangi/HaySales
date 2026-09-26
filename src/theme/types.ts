export type ColorScheme = 'green' | 'purple' | 'blue' | 'orange' | 'rose';
export type ThemeMode = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

export interface PaletteTokens {
  '--md-sys-color-primary': string;
  '--md-sys-color-on-primary': string;
  '--md-sys-color-primary-container': string;
  '--md-sys-color-on-primary-container': string;

  '--md-sys-color-secondary': string;
  '--md-sys-color-on-secondary': string;
  '--md-sys-color-secondary-container': string;
  '--md-sys-color-on-secondary-container': string;

  '--md-sys-color-tertiary': string;
  '--md-sys-color-on-tertiary': string;
  '--md-sys-color-tertiary-container': string;
  '--md-sys-color-on-tertiary-container': string;

  '--md-sys-color-error': string;
  '--md-sys-color-on-error': string;
  '--md-sys-color-error-container': string;
  '--md-sys-color-on-error-container': string;

  '--md-sys-color-background': string;
  '--md-sys-color-on-background': string;

  '--md-sys-color-surface': string;
  '--md-sys-color-on-surface': string;
  '--md-sys-color-surface-variant': string;
  '--md-sys-color-on-surface-variant': string;

  '--md-sys-color-surface-container-lowest': string;
  '--md-sys-color-surface-container-low': string;
  '--md-sys-color-surface-container': string;
  '--md-sys-color-surface-container-high': string;
  '--md-sys-color-surface-container-highest': string;

  '--md-sys-color-outline': string;
  '--md-sys-color-outline-variant': string;
}

export interface SchemeDefinition {
  light: PaletteTokens;
  dark: PaletteTokens;
}
