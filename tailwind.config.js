/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'm3-primary': 'rgb(var(--m3-primary) / <alpha-value>)',
        'm3-on-primary': 'rgb(var(--m3-on-primary) / <alpha-value>)',
        'm3-primary-container':
          'rgb(var(--m3-primary-container) / <alpha-value>)',
        'm3-on-primary-container':
          'rgb(var(--m3-on-primary-container) / <alpha-value>)',

        'm3-secondary': 'rgb(var(--m3-secondary) / <alpha-value>)',
        'm3-on-secondary': 'rgb(var(--m3-on-secondary) / <alpha-value>)',
        'm3-secondary-container':
          'rgb(var(--m3-secondary-container) / <alpha-value>)',
        'm3-on-secondary-container':
          'rgb(var(--m3-on-secondary-container) / <alpha-value>)',

        'm3-tertiary': 'rgb(var(--m3-tertiary) / <alpha-value>)',
        'm3-on-tertiary': 'rgb(var(--m3-on-tertiary) / <alpha-value>)',
        'm3-tertiary-container':
          'rgb(var(--m3-tertiary-container) / <alpha-value>)',
        'm3-on-tertiary-container':
          'rgb(var(--m3-on-tertiary-container) / <alpha-value>)',

        'm3-error': 'rgb(var(--m3-error) / <alpha-value>)',
        'm3-on-error': 'rgb(var(--m3-on-error) / <alpha-value>)',
        'm3-error-container': 'rgb(var(--m3-error-container) / <alpha-value>)',
        'm3-on-error-container':
          'rgb(var(--m3-on-error-container) / <alpha-value>)',

        'm3-background': 'rgb(var(--m3-background) / <alpha-value>)',
        'm3-on-background': 'rgb(var(--m3-on-background) / <alpha-value>)',

        'm3-surface': 'rgb(var(--m3-surface) / <alpha-value>)',
        'm3-on-surface': 'rgb(var(--m3-on-surface) / <alpha-value>)',
        'm3-surface-variant': 'rgb(var(--m3-surface-variant) / <alpha-value>)',
        'm3-on-surface-variant':
          'rgb(var(--m3-on-surface-variant) / <alpha-value>)',

        'm3-surface-container-lowest':
          'rgb(var(--m3-surface-container-lowest) / <alpha-value>)',
        'm3-surface-container-low':
          'rgb(var(--m3-surface-container-low) / <alpha-value>)',
        'm3-surface-container':
          'rgb(var(--m3-surface-container) / <alpha-value>)',
        'm3-surface-container-high':
          'rgb(var(--m3-surface-container-high) / <alpha-value>)',
        'm3-surface-container-highest':
          'rgb(var(--m3-surface-container-highest) / <alpha-value>)',

        'm3-outline': 'rgb(var(--m3-outline) / <alpha-value>)',
        'm3-outline-variant': 'rgb(var(--m3-outline-variant) / <alpha-value>)',
        'm3-inverse-surface': 'rgb(var(--m3-inverse-surface) / <alpha-value>)',
        'm3-inverse-on-surface':
          'rgb(var(--m3-inverse-on-surface) / <alpha-value>)',
        'm3-inverse-primary': 'rgb(var(--m3-inverse-primary) / <alpha-value>)',
      },
      borderRadius: {
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '28px',
        'm3-full': '9999px',
      },
      boxShadow: {
        'm3-1':
          '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'm3-2':
          '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'm3-3':
          '0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'm3-4':
          '0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'm3-5':
          '0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: [
          'Roboto',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'sans-serif',
        ],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.05, 0.7, 0.1, 1.0)',
      },
    },
  },
  plugins: [],
};
