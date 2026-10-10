import React from 'react';
import { Card, FlexLayout, Pill, StackLayout, Text } from '@salt-ds/core';
import { clsx } from 'clsx';
import { Type } from 'lucide-react';
import { FontSize } from '../../../store/slices/themeSlice';

export interface FontSettingsCardProps {
  fontSize: FontSize;
  fontSizeOptions: {
    key: FontSize;
    label: string;
    level: string;
    symbolClass: string;
  }[];
  getFontBadgeLabel: () => string;
  onSelectFontSize: (_size: FontSize) => void;
}

export const FontSettingsCard: React.FC<FontSettingsCardProps> = ({
  fontSize,
  fontSizeOptions,
  getFontBadgeLabel,
  onSelectFontSize,
}) => {
  return (
    <div className="profile-section">
      <FlexLayout align="center" gap={0.5} className="profile-section__header">
        <Type size={16} className="profile-section__icon" />
        <Text styleAs="label">
          <b>FONT & TEXT SCALING</b>
        </Text>
      </FlexLayout>

      <Card className="font-card">
        <StackLayout gap={1.5}>
          <FlexLayout
            align="center"
            justify="space-between"
            className="font-settings__top-row"
          >
            <div className="font-settings__title-group">
              <Text>
                <b>Text Size Scaling</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Adjust readable text size across the entire application
              </Text>
            </div>
            <Pill>{getFontBadgeLabel()}</Pill>
          </FlexLayout>

          <div className="font-settings__grid">
            {fontSizeOptions.map((opt) => {
              const isSelected = fontSize === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onSelectFontSize(opt.key)}
                  className={clsx(
                    'font-settings__option-btn',
                    isSelected && 'font-settings__option-btn--active',
                  )}
                >
                  <span
                    className={clsx('font-settings__symbol', opt.symbolClass)}
                    style={{
                      fontSize:
                        opt.key === 'large'
                          ? '22px'
                          : opt.key === 'medium'
                            ? '18px'
                            : '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    A
                  </span>
                  <Text styleAs="label">
                    <b>{opt.label}</b>
                  </Text>
                  <Text styleAs="notation" color="secondary">
                    {opt.level}
                  </Text>
                </button>
              );
            })}
          </div>

          <div className="font-settings__preview">
            <Text styleAs="notation" color="secondary">
              Preview: Fast Hay Invoicing, Purchases & Ledger
            </Text>
          </div>
        </StackLayout>
      </Card>
    </div>
  );
};

export default FontSettingsCard;
