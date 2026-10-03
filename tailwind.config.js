/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--md-sys-color-primary)',
          foreground: 'var(--md-sys-color-on-primary)',
          container: 'var(--md-sys-color-primary-container)',
          'on-container': 'var(--md-sys-color-on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--md-sys-color-secondary)',
          foreground: 'var(--md-sys-color-on-secondary)',
          container: 'var(--md-sys-color-secondary-container)',
          'on-container': 'var(--md-sys-color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--md-sys-color-tertiary)',
          foreground: 'var(--md-sys-color-on-tertiary)',
          container: 'var(--md-sys-color-tertiary-container)',
          'on-container': 'var(--md-sys-color-on-tertiary-container)',
        },
        error: {
          DEFAULT: 'var(--md-sys-color-error)',
          foreground: 'var(--md-sys-color-on-error)',
          container: 'var(--md-sys-color-error-container)',
          'on-container': 'var(--md-sys-color-on-error-container)',
        },
        background: 'var(--md-sys-color-background)',
        'on-background': 'var(--md-sys-color-on-background)',
        surface: {
          DEFAULT: 'var(--md-sys-color-surface)',
          foreground: 'var(--md-sys-color-on-surface)',
          variant: 'var(--md-sys-color-surface-variant)',
          'on-variant': 'var(--md-sys-color-on-surface-variant)',
          'container-lowest': 'var(--md-sys-color-surface-container-lowest)',
          'container-low': 'var(--md-sys-color-surface-container-low)',
          container: 'var(--md-sys-color-surface-container)',
          'container-high': 'var(--md-sys-color-surface-container-high)',
          'container-highest': 'var(--md-sys-color-surface-container-highest)',
        },
        outline: {
          DEFAULT: 'var(--md-sys-color-outline)',
          variant: 'var(--md-sys-color-outline-variant)',
        },
      },
      borderRadius: {
        none: 'var(--md-sys-shape-corner-none)',
        xs: 'var(--md-sys-shape-corner-extra-small)',
        sm: 'var(--md-sys-shape-corner-small)',
        md: 'var(--md-sys-shape-corner-medium)',
        lg: 'var(--md-sys-shape-corner-large)',
        xl: 'var(--md-sys-shape-corner-extra-large)',
        full: 'var(--md-sys-shape-corner-full)',
      },
      spacing: {
        'm3-xs': 'var(--md-sys-spacing-extra-small)',
        'm3-sm': 'var(--md-sys-spacing-small)',
        'm3-md': 'var(--md-sys-spacing-medium)',
        'm3-lg': 'var(--md-sys-spacing-large)',
        'm3-xl': 'var(--md-sys-spacing-extra-large)',
        'm3-huge': 'var(--md-sys-spacing-huge)',
      },
    },
  },
  plugins: [],
};
