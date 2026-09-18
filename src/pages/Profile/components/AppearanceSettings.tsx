import { Moon, Palette, Sun, Type } from 'lucide-react';
import React from 'react';
import { Card } from '../../../components/common/Card';
import { Switch } from '../../../components/common/Switch';
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
      <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
        <Palette className="h-3.5 w-3.5 text-m3-primary" />
        <span>Material 3 Appearance & Display</span>
      </h3>

      <Card variant="outlined" className="space-y-4 p-4">
        {/* Dark Mode Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-m3-surface-container-high p-2 text-m3-on-surface">
              {isDark ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-m3-on-surface">
                Dark Theme
              </div>
              <div className="text-[11px] text-m3-on-surface-variant">
                {isDark ? 'Dark mode enabled' : 'Light mode active'}
              </div>
            </div>
          </div>
          <Switch checked={isDark} onChange={onToggleDarkMode} />
        </div>

        {/* Color Scheme Picker */}
        <div className="border-t border-m3-outline-variant/30 pt-3">
          <span className="mb-2 block text-xs font-bold text-m3-on-surface">
            Dynamic M3 Palette Accent
          </span>
          <div className="grid grid-cols-5 gap-2">
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
                <span className="line-clamp-1 text-center text-[9px] font-medium text-m3-on-surface">
                  {pal.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Scaling */}
        <div className="border-t border-m3-outline-variant/30 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Type className="h-4 w-4 text-m3-primary" />
              <span className="text-xs font-bold text-m3-on-surface">
                Font Size & Text Scaling
              </span>
            </div>
            <span className="rounded bg-m3-surface-container-highest px-2 py-0.5 text-[10px] font-semibold text-m3-primary">
              {fontSize === 'small'
                ? 'Small (87.5%)'
                : fontSize === 'large'
                  ? 'Large (+1 Level / 112.5%)'
                  : 'Default (100%)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
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
                  <span className="mt-1.5 text-[11px] font-semibold">
                    {opt.label}
                  </span>
                  <span className="text-[10px] opacity-75">{opt.level}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 rounded-lg border border-m3-outline-variant/20 bg-m3-surface-container-high/50 p-2 text-center text-xs text-m3-on-surface">
            <span>Preview: Fast Hay Invoicing, Purchases & Ledger</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
