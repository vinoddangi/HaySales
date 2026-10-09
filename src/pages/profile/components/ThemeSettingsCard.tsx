import clsx from 'clsx';
import React from 'react';
import {
  Badge,
  Card,
  Flex,
  IconMoon,
  IconPalette,
  IconSun,
  Switch,
  Text,
} from '../../../components';
import { ColorScheme } from '../../../store/slices/themeSlice';

export interface ThemeSettingsCardProps {
  isDark: boolean;
  scheme: ColorScheme;
  colorPalettes: { key: ColorScheme; name: string; hex: string }[];
  onToggleDarkMode: (_dark: boolean) => void;
  onSelectScheme: (_scheme: ColorScheme, _name: string) => void;
}

export const ThemeSettingsCard: React.FC<ThemeSettingsCardProps> = ({
  isDark,
  scheme,
  colorPalettes,
  onToggleDarkMode,
  onSelectScheme,
}) => {
  return (
    <div className="profile-section">
      <Flex align="center" gap="xs" className="profile-section__header">
        <IconPalette size="sm" className="profile-section__icon" />
        <Text variant="label-sm" appearance="secondary" uppercase>
          Theme &amp; Colors
        </Text>
      </Flex>

      <Card variant="outlined" className="theme-card">
        <Card.Content>
          {/* Dark Mode Switch Row */}
          <Flex
            align="center"
            justify="between"
            fullWidth
            className="theme-settings__mode-row"
            onClick={() => onToggleDarkMode(!isDark)}
          >
            <Flex align="center" gap="md" className="theme-settings__mode-left">
              <div
                className={clsx(
                  'theme-settings__icon-box',
                  isDark
                    ? 'theme-settings__icon-box--dark'
                    : 'theme-settings__icon-box--light',
                )}
              >
                {isDark ? <IconMoon size="lg" /> : <IconSun size="lg" />}
              </div>

              <Flex.Item grow>
                <Flex
                  align="center"
                  gap="xs"
                  className="theme-settings__title-row"
                >
                  <Text variant="title-sm" weight="bold">
                    Dark Mode
                  </Text>
                  <Badge sentiment={isDark ? 'accent' : 'neutral'} size="sm">
                    {isDark ? 'ON' : 'OFF'}
                  </Badge>
                </Flex>
                <Text variant="caption" appearance="secondary" as="div">
                  {isDark
                    ? 'Dark theme active across all screens'
                    : 'Light theme active across all screens'}
                </Text>
              </Flex.Item>
            </Flex>

            <Switch selected={isDark} onChange={onToggleDarkMode} />
          </Flex>

          {/* Dynamic Color Palette Grid */}
          <div className="theme-settings__palette-section">
            <Text variant="title-sm" weight="bold" as="span">
              Dynamic M3 Color Palette
            </Text>
            <div className="theme-settings__palette-grid">
              {colorPalettes.map((pal) => (
                <button
                  key={pal.key}
                  type="button"
                  onClick={() => onSelectScheme(pal.key, pal.name)}
                  className={clsx(
                    'theme-settings__palette-btn',
                    scheme === pal.key && 'theme-settings__palette-btn--active',
                  )}
                >
                  <div
                    className="theme-settings__palette-circle"
                    style={{ backgroundColor: pal.hex }}
                  />
                  <Text variant="caption" weight="medium" as="span">
                    {pal.name.split(' ')[0]}
                  </Text>
                </button>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ThemeSettingsCard;
