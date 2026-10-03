import clsx from 'clsx';
import { Type } from 'lucide-react';
import React from 'react';
import { Card, Flex, Text } from '../../../components';
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
      <Flex align="center" gap="xs" className="profile-section__header">
        <Type className="profile-section__icon" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Font &amp; Text Scaling
        </Text>
      </Flex>

      <Card variant="outlined" className="font-card">
        <Card.Content>
          <Flex
            align="center"
            justify="between"
            fullWidth
            className="font-settings__top-row"
          >
            <div className="font-settings__title-group">
              <span className="font-settings__title">Text Size Scaling</span>
              <span className="font-settings__subtitle">
                Adjust readable text size across the entire application
              </span>
            </div>
            <span className="font-settings__badge">{getFontBadgeLabel()}</span>
          </Flex>

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
                  >
                    A
                  </span>
                  <span className="font-settings__label">{opt.label}</span>
                  <span className="font-settings__level">{opt.level}</span>
                </button>
              );
            })}
          </div>

          <div className="font-settings__preview">
            <span>Preview: Fast Hay Invoicing, Purchases &amp; Ledger</span>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default FontSettingsCard;
