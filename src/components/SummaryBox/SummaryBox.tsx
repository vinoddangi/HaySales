import clsx from 'clsx';
import React from 'react';
import { Card } from '../Card';
import { Flex, SpacingScale } from '../layouts/Flex';
import { Text, TextAppearance, TextSentiment, TextWeight } from '../Text';
import './SummaryBox.css';
import { SummaryBoxItem, useSummaryBox } from './useSummaryBox';

export interface SummaryBoxRowProps {
  label?: React.ReactNode;
  value?: React.ReactNode;
  sentiment?: TextSentiment;
  appearance?: TextAppearance;
  labelAppearance?: TextAppearance;
  valueSentiment?: TextSentiment;
  valueAppearance?: TextAppearance;
  bold?: boolean;
  weight?: TextWeight;
  className?: string;
  children?: React.ReactNode;
}

export const SummaryBoxRow: React.FC<SummaryBoxRowProps> = ({
  label,
  value,
  sentiment,
  appearance,
  labelAppearance = 'secondary',
  valueSentiment,
  valueAppearance,
  bold = true,
  weight,
  className,
  children,
}) => {
  if (children) {
    return (
      <Flex
        align="center"
        justify="between"
        fullWidth
        className={clsx('hs-summary-box__row', className)}
      >
        {children}
      </Flex>
    );
  }

  const resolvedWeight: TextWeight = weight ?? (bold ? 'bold' : 'regular');

  return (
    <Flex
      align="center"
      justify="between"
      fullWidth
      className={clsx('hs-summary-box__row', className)}
    >
      {typeof label === 'string' || typeof label === 'number' ? (
        <Text variant="body-sm" appearance={labelAppearance}>
          {label}
        </Text>
      ) : (
        label
      )}
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          variant="body-sm"
          weight={resolvedWeight}
          sentiment={valueSentiment ?? sentiment}
          appearance={valueAppearance ?? appearance}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  );
};

export interface SummaryBoxProps {
  items?: SummaryBoxItem[];
  variant?: 'outlined' | 'filled' | 'elevated';
  gap?: SpacingScale;
  padding?: SpacingScale;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const SummaryBoxRoot: React.FC<SummaryBoxProps> = ({
  items,
  variant = 'outlined',
  gap = 'xs',
  padding = 'sm',
  className,
  style,
  children,
}) => {
  const { items: resolvedItems } = useSummaryBox({ items });

  return (
    <Card
      variant={variant}
      corner="md"
      className={clsx('hs-summary-box', className)}
      style={style}
    >
      <Flex direction="column" gap={gap} padding={padding} fullWidth>
        {resolvedItems
          ? resolvedItems.map((item, index) => (
              <SummaryBoxRow
                key={item.key ?? index}
                label={item.label}
                value={item.value}
                sentiment={item.sentiment}
                appearance={item.appearance}
                labelAppearance={item.labelAppearance}
                valueSentiment={item.valueSentiment}
                valueAppearance={item.valueAppearance}
                bold={item.bold}
                weight={item.weight}
              />
            ))
          : children}
      </Flex>
    </Card>
  );
};

export const SummaryBox = Object.assign(SummaryBoxRoot, {
  Row: SummaryBoxRow,
  Item: SummaryBoxRow,
});

export default SummaryBox;
