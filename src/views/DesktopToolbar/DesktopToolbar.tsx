import clsx from 'clsx';
import React from 'react';
import { FlexLayout, Pill, Text } from '@salt-ds/core';
import { Monitor, Moon, Palette, Smartphone, Sun } from 'lucide-react';
import './DesktopToolbar.css';
import { useDesktopToolbar } from './useDesktopToolbar';

export const DesktopToolbar: React.FC = () => {
  const {
    mode,
    scheme,
    previewFrame,
    schemes,
    handleSelectScheme,
    handleToggleTheme,
    handleToggleFrame,
  } = useDesktopToolbar();

  return (
    <FlexLayout
      direction="row"
      align="center"
      justify="space-between"
      className="desktop-toolbar"
    >
      <FlexLayout
        direction="row"
        align="center"
        gap={1}
        className="desktop-toolbar__brand"
      >
        <img
          src="/favicon.svg"
          alt="HaySales Logo"
          className="desktop-toolbar__brand-logo"
        />
        <Text styleAs="h4" className="desktop-toolbar__brand-title">
          <b>HaySales</b>
        </Text>
        <Pill>Salt Mobile Shell</Pill>
      </FlexLayout>

      <FlexLayout
        direction="row"
        align="center"
        gap={2}
        className="desktop-toolbar__controls"
      >
        {/* Dynamic Color Palette Picker */}
        <FlexLayout
          direction="row"
          align="center"
          gap={1}
          className="desktop-toolbar__palette"
        >
          <Palette size={16} className="desktop-toolbar__palette-icon" />
          {schemes.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectScheme(s.id)}
              style={{ backgroundColor: s.color }}
              className={clsx(
                'desktop-toolbar__palette-btn',
                scheme === s.id && 'desktop-toolbar__palette-btn--active',
              )}
              title={`Salt Theme: ${s.id}`}
              type="button"
            />
          ))}
        </FlexLayout>

        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme}
          className="desktop-toolbar__btn"
          type="button"
        >
          {mode === 'dark' ? (
            <Sun size={16} className="desktop-toolbar__sun-icon" />
          ) : (
            <Moon size={16} className="desktop-toolbar__moon-icon" />
          )}
          <Text styleAs="label">{mode === 'dark' ? 'Light' : 'Dark'}</Text>
        </button>

        {/* Frame Toggle */}
        <button
          onClick={handleToggleFrame}
          className="desktop-toolbar__btn"
          type="button"
        >
          {previewFrame ? <Monitor size={16} /> : <Smartphone size={16} />}
          <Text styleAs="label">
            {previewFrame ? 'Full View' : 'Device Frame'}
          </Text>
        </button>
      </FlexLayout>
    </FlexLayout>
  );
};

export default DesktopToolbar;
