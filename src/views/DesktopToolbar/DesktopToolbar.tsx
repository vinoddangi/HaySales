import clsx from 'clsx';
import { Monitor, Moon, Palette, Smartphone, Sun } from 'lucide-react';
import React from 'react';
import { Flex } from '../../components';
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
    <Flex
      direction="row"
      align="center"
      justify="between"
      fullWidth
      className="desktop-toolbar"
    >
      <Flex
        direction="row"
        align="center"
        gap="xs"
        className="desktop-toolbar__brand"
      >
        <img
          src="/favicon.svg"
          alt="HaySales Logo"
          className="desktop-toolbar__brand-logo"
        />
        <span className="desktop-toolbar__brand-title">HaySales</span>
        <span className="desktop-toolbar__brand-badge">M3 Mobile Shell</span>
      </Flex>

      <Flex
        direction="row"
        align="center"
        gap="md"
        className="desktop-toolbar__controls"
      >
        {/* Dynamic Color Palette Picker */}
        <Flex
          direction="row"
          align="center"
          gap="xs"
          className="desktop-toolbar__palette"
        >
          <Palette className="h-3.5 w-3.5 text-outline" />
          {schemes.map((s) => (
            <Flex.Item
              key={s.id}
              as="button"
              onClick={() => handleSelectScheme(s.id)}
              style={{ backgroundColor: s.color }}
              className={clsx(
                'desktop-toolbar__palette-btn',
                scheme === s.id && 'desktop-toolbar__palette-btn--active',
              )}
              title={`M3 Theme: ${s.id}`}
              type="button"
            />
          ))}
        </Flex>

        {/* Theme Toggle */}
        <Flex.Item
          as="button"
          onClick={handleToggleTheme}
          className="desktop-toolbar__btn"
          type="button"
        >
          {mode === 'dark' ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-blue-400" />
          )}
          <span>{mode === 'dark' ? 'Light' : 'Dark'}</span>
        </Flex.Item>

        {/* Frame Toggle */}
        <Flex.Item
          as="button"
          onClick={handleToggleFrame}
          className="desktop-toolbar__btn"
          type="button"
        >
          {previewFrame ? (
            <Monitor className="h-3.5 w-3.5" />
          ) : (
            <Smartphone className="h-3.5 w-3.5" />
          )}
          <span>{previewFrame ? 'Full View' : 'Device Frame'}</span>
        </Flex.Item>
      </Flex>
    </Flex>
  );
};

export default DesktopToolbar;
