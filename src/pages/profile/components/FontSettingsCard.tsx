import clsx from 'clsx';
import React from 'react';
import { Badge, Card, Flex, IconType, Text } from '../../../components';
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
        <IconType size="sm" className="profile-section__icon" />
        <Text variant="label-sm" appearance="secondary" uppercase>
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
              <Text variant="title-sm" weight="bold">
                Text Size Scaling
              </Text>
              <Text variant="body-sm" appearance="secondary">
                Adjust readable text size across the entire application
              </Text>
            </div>
            <Badge sentiment="neutral" size="sm">
              {getFontBadgeLabel()}
            </Badge>
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
                  <Text
                    as="span"
                    variant="title-lg"
                    weight="bold"
                    className={clsx('font-settings__symbol', opt.symbolClass)}
                  >
                    A
                  </Text>
                  <Text variant="label-md" weight="bold" as="span">
                    {opt.label}
                  </Text>
                  <Text variant="caption" appearance="secondary" as="span">
                    {opt.level}
                  </Text>
                </button>
              );
            })}
          </div>

          <div className="font-settings__preview">
            <Text variant="body-sm" appearance="secondary" as="span">
              Preview: Fast Hay Invoicing, Purchases &amp; Ledger
            </Text>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default FontSettingsCard;
