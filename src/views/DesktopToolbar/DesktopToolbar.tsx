import clsx from 'clsx';
import React from 'react';
import {
  Badge,
  Flex,
  IconMonitor,
  IconMoon,
  IconPalette,
  IconSmartphone,
  IconSun,
  Text,
} from '../../components';
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
        <Text
          variant="title-sm"
          weight="bold"
          as="span"
          className="desktop-toolbar__brand-title"
        >
          HaySales
        </Text>
        <Badge size="sm" sentiment="neutral">
          M3 Mobile Shell
        </Badge>
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
          <IconPalette size="sm" className="desktop-toolbar__palette-icon" />
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
            <IconSun size="sm" className="desktop-toolbar__sun-icon" />
          ) : (
            <IconMoon size="sm" className="desktop-toolbar__moon-icon" />
          )}
          <Text variant="label-sm" weight="medium" as="span">
            {mode === 'dark' ? 'Light' : 'Dark'}
          </Text>
        </Flex.Item>

        {/* Frame Toggle */}
        <Flex.Item
          as="button"
          onClick={handleToggleFrame}
          className="desktop-toolbar__btn"
          type="button"
        >
          {previewFrame ? (
            <IconMonitor size="sm" />
          ) : (
            <IconSmartphone size="sm" />
          )}
          <Text variant="label-sm" weight="medium" as="span">
            {previewFrame ? 'Full View' : 'Device Frame'}
          </Text>
        </Flex.Item>
      </Flex>
    </Flex>
  );
};

export default DesktopToolbar;
