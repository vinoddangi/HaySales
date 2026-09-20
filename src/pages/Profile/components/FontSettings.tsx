import { Type } from 'lucide-react';
import React from 'react';
import { Card, Text } from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { FontSize } from '../../../types';
import { cn } from '../../../utils/cn';

export interface FontSettingsProps {
  fontSize: FontSize;
  onSelectFontSize: (_size: FontSize) => void;
}

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

export const FontSettings: React.FC<FontSettingsProps> = ({
  fontSize,
  onSelectFontSize,
}) => {
  return (
    <div className="space-y-2">
      <Flex align="center" gap="xs" className="px-1">
        <Type className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Font &amp; Text Scaling
        </Text>
      </Flex>

      <Card variant="outlined" className="space-y-3.5 p-4">
        <Flex align="center" justify="between" fullWidth>
          <div className="space-y-0.5">
            <Text styleAs="body-sm" appearance="primary" weight="bold">
              Text Size Scaling
            </Text>
            <Text styleAs="caption" appearance="secondary">
              Adjust readable text size across the entire application
            </Text>
          </div>
          <span className="rounded-full bg-m3-primary/10 px-2.5 py-1 text-[11px] font-bold text-m3-primary">
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
                <span className={cn('font-bold leading-none', opt.symbolSize)}>
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

        <div className="rounded-lg border border-m3-outline-variant/20 bg-m3-surface-container-high/50 p-2.5 text-center text-xs text-m3-on-surface">
          <span>Preview: Fast Hay Invoicing, Purchases &amp; Ledger</span>
        </div>
      </Card>
    </div>
  );
};
