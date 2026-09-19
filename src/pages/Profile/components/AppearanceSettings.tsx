import { Moon, Palette, Sun, Type } from 'lucide-react';
import React from 'react';
import { Card, Switch, Text } from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { ColorScheme, FontSize } from '../../../types';
import { cn } from '../../../utils/cn';

export interface AppearanceSettingsProps {
  isDark: boolean;
  scheme: ColorScheme;
  fontSize: FontSize;
  onToggleDarkMode: (_isDark: boolean) => void;
  onSelectScheme: (_scheme: ColorScheme) => void;
  onSelectFontSize: (_size: FontSize) => void;
}

const colorPalettes: { key: ColorScheme; name: string; bgClass: string }[] = [
  { key: 'green', name: 'Agriculture Green', bgClass: 'bg-emerald-600' },
  { key: 'purple', name: 'Material Baseline', bgClass: 'bg-purple-600' },
  { key: 'blue', name: 'Ocean Blue', bgClass: 'bg-blue-600' },
  { key: 'orange', name: 'Harvest Amber', bgClass: 'bg-amber-600' },
  { key: 'rose', name: 'Crimson Rose', bgClass: 'bg-rose-600' },
];

const fontSizeOptions: {
  key: FontSize;
  label: string;
  level: string;
  symbolSize: string;
}[] = [
  { key: 'small', label: 'Small', level: '-1 Level', symbolSize: 'text-xs' },
  { key: 'medium', label: 'Default', level: 'Standard', symbolSize: 'text-sm' },
  { key: 'large', label: 'Large', level: '+1 Level', symbolSize: 'text-base' },
];

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  isDark,
  scheme,
  fontSize,
  onToggleDarkMode,
  onSelectScheme,
  onSelectFontSize,
}) => {
  return (
    <div className="space-y-2">
      <Flex align="center" gap="xs" className="px-1">
        <Palette className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Material 3 Appearance & Display
        </Text>
      </Flex>

      <Card variant="outlined" className="space-y-4 p-4">
        {/* Dark Mode Switch */}
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="md">
            <div className="rounded-full bg-m3-surface-container-high p-2 text-m3-on-surface">
              {isDark ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div>
              <Text
                styleAs="body-sm"
                appearance="primary"
                weight="bold"
                className="block"
              >
                Dark Theme
              </Text>
              <Text styleAs="caption" appearance="secondary" className="block">
                {isDark ? 'Dark mode enabled' : 'Light mode active'}
              </Text>
            </div>
          </Flex>
          <Switch checked={isDark} onChange={onToggleDarkMode} />
        </Flex>

        {/* Color Scheme Picker */}
        <div className="border-t border-m3-outline-variant/30 pt-3">
          <Text
            styleAs="body-sm"
            appearance="primary"
            weight="bold"
            className="mb-2 block"
          >
            Dynamic M3 Palette Accent
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

        {/* Font Size Scaling */}
        <div className="border-t border-m3-outline-variant/30 pt-3">
          <Flex align="center" justify="between" fullWidth className="mb-2">
            <Flex align="center" gap="xs">
              <Type className="h-4 w-4 text-m3-primary" />
              <Text styleAs="body-sm" appearance="primary" weight="bold">
                Font Size & Text Scaling
              </Text>
            </Flex>
            <span className="rounded bg-m3-surface-container-highest px-2 py-0.5 text-[10px] font-semibold text-m3-primary">
              {fontSize === 'small'
                ? 'Small (87.5%)'
                : fontSize === 'large'
                  ? 'Large (+1 Level / 112.5%)'
                  : 'Default (100%)'}
            </span>
          </Flex>

          <Grid columns={3} gap="sm" fullWidth>
            {fontSizeOptions.map((opt) => {
              const isSelected = fontSize === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onSelectFontSize(opt.key)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-m3-md border px-2 py-2.5 transition-all',
                    isSelected
                      ? 'shadow-xs border-m3-primary bg-m3-primary/10 text-m3-primary ring-1 ring-m3-primary'
                      : 'border-m3-outline-variant/40 bg-m3-surface-container-low text-m3-on-surface-variant hover:bg-m3-surface-container-high',
                  )}
                >
                  <span
                    className={cn('font-bold leading-none', opt.symbolSize)}
                  >
                    A
                  </span>
                  <Text
                    styleAs="caption"
                    weight="semibold"
                    className="mt-1.5 block"
                  >
                    {opt.label}
                  </Text>
                  <span className="text-[10px] opacity-75">{opt.level}</span>
                </button>
              );
            })}
          </Grid>

          <div className="mt-2.5 rounded-lg border border-m3-outline-variant/20 bg-m3-surface-container-high/50 p-2 text-center text-xs text-m3-on-surface">
            <span>Preview: Fast Hay Invoicing, Purchases & Ledger</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
