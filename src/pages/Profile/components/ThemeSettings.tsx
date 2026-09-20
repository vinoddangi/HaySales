import { Moon, Palette, Sun } from 'lucide-react';
import React from 'react';
import { Card, Switch, Text } from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { ColorScheme } from '../../../types';
import { cn } from '../../../utils/cn';

export interface ThemeSettingsProps {
  isDark: boolean;
  scheme: ColorScheme;
  onToggleDarkMode: (_isDark: boolean) => void;
  onSelectScheme: (_scheme: ColorScheme) => void;
}

const colorPalettes: { key: ColorScheme; name: string; bgClass: string }[] = [
  { key: 'green', name: 'Agriculture Green', bgClass: 'bg-emerald-600' },
  { key: 'purple', name: 'Material Baseline', bgClass: 'bg-purple-600' },
  { key: 'blue', name: 'Ocean Blue', bgClass: 'bg-blue-600' },
  { key: 'orange', name: 'Harvest Amber', bgClass: 'bg-amber-600' },
  { key: 'rose', name: 'Crimson Rose', bgClass: 'bg-rose-600' },
];

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  isDark,
  scheme,
  onToggleDarkMode,
  onSelectScheme,
}) => {
  return (
    <div className="space-y-2">
      <Flex align="center" gap="xs" className="px-1">
        <Palette className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Theme &amp; Colors
        </Text>
      </Flex>

      <Card variant="outlined" className="space-y-4 p-4">
        {/* Dark Mode Switch Row */}
        <div className="flex items-center justify-between rounded-xl border border-m3-outline-variant/30 bg-m3-surface-container-low p-3">
          <Flex align="center" gap="md">
            <div
              className={`rounded-full p-2.5 transition-colors ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-500'}`}
            >
              {isDark ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </div>
            <div>
              <Flex align="center" gap="xs">
                <Text styleAs="body-sm" appearance="primary" weight="bold">
                  Dark Mode
                </Text>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}
                >
                  {isDark ? 'ON' : 'OFF'}
                </span>
              </Flex>
              <Text
                styleAs="caption"
                appearance="secondary"
                className="mt-0.5 block text-[11px]"
              >
                {isDark
                  ? 'Dark theme active across all screens'
                  : 'Light theme active across all screens'}
              </Text>
            </div>
          </Flex>
          <Switch
            checked={isDark}
            onChange={onToggleDarkMode}
            activeColor="border-indigo-600 bg-indigo-600"
          />
        </div>

        {/* Color Scheme Picker */}
        <div className="border-t border-m3-outline-variant/30 pt-3">
          <Text
            styleAs="body-sm"
            appearance="primary"
            weight="bold"
            className="mb-2 block"
          >
            Dynamic M3 Color Palette
          </Text>
          <Grid columns={5} gap="xs" fullWidth>
            {colorPalettes.map((pal) => (
              <button
                key={pal.key}
                type="button"
                onClick={() => onSelectScheme(pal.key)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-m3-md p-1.5 transition-all',
                  scheme === pal.key
                    ? 'bg-m3-surface-container-highest ring-2 ring-m3-primary'
                    : 'opacity-75 hover:bg-m3-surface-container-high',
                )}
              >
                <div
                  className={cn('shadow-xs h-7 w-7 rounded-full', pal.bgClass)}
                />
                <Text
                  styleAs="caption"
                  appearance="primary"
                  align="center"
                  className="line-clamp-1 text-[9px]"
                >
                  {pal.name.split(' ')[0]}
                </Text>
              </button>
            ))}
          </Grid>
        </div>
      </Card>
    </div>
  );
};
