import clsx from 'clsx';
import { Moon, Palette, Sun } from 'lucide-react';
import React from 'react';
import { Card, Flex, Switch, Text } from '../../../components';
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
        <Palette className="profile-section__icon" />
        <Text styleAs="label" appearance="secondary" uppercase>
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
                {isDark ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </div>

              <Flex.Item grow>
                <Flex
                  align="center"
                  gap="xs"
                  className="theme-settings__title-row"
                >
                  <span className="theme-settings__title">Dark Mode</span>
                  <span
                    className={clsx(
                      'theme-settings__status-badge',
                      isDark
                        ? 'theme-settings__status-badge--dark'
                        : 'theme-settings__status-badge--light',
                    )}
                  >
                    {isDark ? 'ON' : 'OFF'}
                  </span>
                </Flex>
                <div className="theme-settings__subtitle">
                  {isDark
                    ? 'Dark theme active across all screens'
                    : 'Light theme active across all screens'}
                </div>
              </Flex.Item>
            </Flex>

            <Switch selected={isDark} onChange={onToggleDarkMode} />
          </Flex>

          {/* Dynamic Color Palette Grid */}
          <div className="theme-settings__palette-section">
            <span className="theme-settings__palette-title">
              Dynamic M3 Color Palette
            </span>
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
                  <span className="theme-settings__palette-label">
                    {pal.name.split(' ')[0]}
                  </span>
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
