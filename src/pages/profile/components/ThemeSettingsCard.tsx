import React from 'react';
import {
  Card,
  FlexLayout,
  Pill,
  StackLayout,
  Switch,
  Text,
} from '@salt-ds/core';
import { clsx } from 'clsx';
import { Moon, Palette, Sun } from 'lucide-react';
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
      <FlexLayout align="center" gap={0.5} className="profile-section__header">
        <Palette size={16} className="profile-section__icon" />
        <Text styleAs="label">
          <b>THEME & COLORS</b>
        </Text>
      </FlexLayout>

      <Card className="theme-card">
        <StackLayout gap={2}>
          {/* Dark Mode Switch Row */}
          <FlexLayout
            align="center"
            justify="space-between"
            className="theme-settings__mode-row"
            onClick={() => onToggleDarkMode(!isDark)}
            style={{ cursor: 'pointer' }}
          >
            <FlexLayout
              align="center"
              gap={1}
              className="theme-settings__mode-left"
            >
              <div
                className={clsx(
                  'theme-settings__icon-box',
                  isDark
                    ? 'theme-settings__icon-box--dark'
                    : 'theme-settings__icon-box--light',
                )}
              >
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
              </div>

              <div>
                <FlexLayout align="center" gap={0.5}>
                  <Text>
                    <b>Dark Mode</b>
                  </Text>
                  <Pill>{isDark ? 'ON' : 'OFF'}</Pill>
                </FlexLayout>
                <Text styleAs="notation" color="secondary">
                  {isDark
                    ? 'Dark theme active across all screens'
                    : 'Light theme active across all screens'}
                </Text>
              </div>
            </FlexLayout>

            <Switch
              checked={isDark}
              onChange={(e) => onToggleDarkMode(e.target.checked)}
            />
          </FlexLayout>

          {/* Dynamic Color Palette Grid */}
          <div className="theme-settings__palette-section">
            <Text styleAs="label">
              <b>Accent Color</b>
            </Text>
            <div
              className="theme-settings__palette-grid"
              style={{ marginTop: '8px' }}
            >
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
                  <Text styleAs="notation">
                    <b>{pal.name.split(' ')[0]}</b>
                  </Text>
                </button>
              ))}
            </div>
          </div>
        </StackLayout>
      </Card>
    </div>
  );
};

export default ThemeSettingsCard;
