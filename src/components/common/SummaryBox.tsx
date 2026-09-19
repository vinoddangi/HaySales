import React from 'react';
import { cn } from '../../utils/cn';
import { Flex } from '../layout';
import { Text } from './Text';

export interface SummaryBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SummaryBox: React.FC<SummaryBoxProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'space-y-1.5 rounded-lg border border-m3-outline/40 bg-m3-surface-variant/30 p-2.5 text-xs',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
  isTotal?: boolean;
  isHighlight?: boolean;
  className?: string;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  isTotal = false,
  isHighlight = false,
  className,
}) => {
  return (
    <Flex
      direction="row"
      justify="between"
      align="center"
      fullWidth
      className={cn(
        isTotal && 'border-t border-m3-outline/20 pt-1.5',
        className,
      )}
    >
      <Text
        styleAs={isTotal ? 'body-sm' : 'caption'}
        appearance={isHighlight ? 'primary' : isTotal ? 'primary' : 'secondary'}
        weight={isTotal ? 'bold' : 'medium'}
      >
        {label}
      </Text>
      <Text
        styleAs={isTotal ? 'amount' : 'body-sm'}
        sentiment={isHighlight ? 'accent' : undefined}
        appearance={!isHighlight ? 'primary' : undefined}
        weight={isTotal ? 'black' : 'semibold'}
      >
        {value}
      </Text>
    </Flex>
  );
};
