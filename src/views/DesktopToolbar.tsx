import clsx from 'clsx';
import { Monitor, Moon, Palette, Smartphone, Sun } from 'lucide-react';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  ColorScheme,
  setColorScheme,
  setThemeMode,
  togglePreviewFrame,
} from '../store/slices/themeSlice';
import './DesktopToolbar.css';

const schemes: { id: ColorScheme; color: string }[] = [
  { id: 'green', color: '#006c4c' },
  { id: 'purple', color: '#6750a4' },
  { id: 'blue', color: '#0061a4' },
  { id: 'orange', color: '#8b5000' },
  { id: 'rose', color: '#9c4146' },
];

export const DesktopToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme, previewFrame } = useAppSelector((state) => state.theme);

  return (
    <div className="desktop-toolbar">
      <div className="desktop-toolbar__brand">
        <img
          src="/favicon.svg"
          alt="HaySales Logo"
          className="desktop-toolbar__brand-logo"
        />
        <span className="desktop-toolbar__brand-title">HaySales</span>
        <span className="desktop-toolbar__brand-badge">M3 Mobile Shell</span>
      </div>

      <div className="desktop-toolbar__controls">
        {/* Dynamic Color Palette Picker */}
        <div className="desktop-toolbar__palette">
          <Palette className="h-3.5 w-3.5 text-outline" />
          {schemes.map((s) => (
            <button
              key={s.id}
              onClick={() => dispatch(setColorScheme(s.id))}
              style={{ backgroundColor: s.color }}
              className={clsx(
                'desktop-toolbar__palette-btn',
                scheme === s.id && 'desktop-toolbar__palette-btn--active',
              )}
              title={`M3 Theme: ${s.id}`}
              type="button"
            />
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() =>
            dispatch(setThemeMode(mode === 'dark' ? 'light' : 'dark'))
          }
          className="desktop-toolbar__btn"
          type="button"
        >
          {mode === 'dark' ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-blue-400" />
          )}
          <span>{mode === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Frame Toggle */}
        <button
          onClick={() => dispatch(togglePreviewFrame())}
          className="desktop-toolbar__btn"
          type="button"
        >
          {previewFrame ? (
            <Monitor className="h-3.5 w-3.5" />
          ) : (
            <Smartphone className="h-3.5 w-3.5" />
          )}
          <span>{previewFrame ? 'Full View' : 'Device Frame'}</span>
        </button>
      </div>
    </div>
  );
};

export default DesktopToolbar;
