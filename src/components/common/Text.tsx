import React from 'react';
import { cn } from '../../utils/cn';

export type TextStyleAs =
  | 'display1'
  | 'display2'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'body-sm'
  | 'label'
  | 'caption'
  | 'amount'
  | 'heading'
  | 'title'; // aliases for backwards-compatibility

export type TextSentiment =
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info'
  | 'accent'
  | 'neutral'
  | 'inherit';

export type TextAppearance = 'primary' | 'secondary' | 'disabled' | 'inherit';

export type TextWeight =
  'regular' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

export type TextAlign = 'left' | 'center' | 'right';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?:
    | 'span'
    | 'p'
    | 'div'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'label'
    | 'strong'
    | 'small';
  htmlFor?: string;
  styleAs?: TextStyleAs;
  variant?: TextStyleAs; // alias for styleAs
  sentiment?: TextSentiment;
  appearance?: TextAppearance;
  color?: string; // legacy or direct override
  weight?: TextWeight;
  align?: TextAlign;
  uppercase?: boolean;
  truncate?: boolean;
  children?: React.ReactNode;
}

const styleAsClasses: Record<TextStyleAs, string> = {
  display1: 'text-3xl font-black tracking-tight',
  display2: 'text-2xl font-black tracking-tight',
  display: 'text-3xl font-black tracking-tight',
  h1: 'text-xl font-bold tracking-tight',
  heading: 'text-xl font-bold tracking-tight',
  h2: 'text-lg font-bold tracking-tight',
  h3: 'text-base font-semibold',
  title: 'text-base font-semibold',
  h4: 'text-sm font-semibold',
  body: 'text-sm font-normal leading-relaxed',
  'body-sm': 'text-xs font-normal leading-normal',
  label: 'text-[11px] font-bold uppercase tracking-wider',
  caption: 'text-[10px] font-medium',
  amount: 'text-sm font-bold tabular-nums',
};

const sentimentClasses: Record<TextSentiment, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
  accent: 'text-m3-primary',
  neutral: 'text-m3-on-surface',
  inherit: '',
};

const appearanceClasses: Record<TextAppearance, string> = {
  primary: 'text-m3-on-surface',
  secondary: 'text-m3-on-surface-variant',
  disabled: 'text-m3-on-surface-variant/40',
  inherit: '',
};

const weightClasses: Record<TextWeight, string> = {
  regular: 'font-normal',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
};

const alignClasses: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const Text: React.FC<TextProps> = ({
  as: Component = 'span',
  styleAs,
  variant = 'body',
  sentiment,
  appearance,
  color,
  weight,
  align,
  uppercase = false,
  truncate = false,
  className,
  children,
  ...props
}) => {
  const resolvedStyle = styleAs || variant;

  return (
    <Component
      className={cn(
        styleAsClasses[resolvedStyle],
        sentiment
          ? sentimentClasses[sentiment]
          : appearance
            ? appearanceClasses[appearance]
            : color
              ? color.startsWith('text-')
                ? color
                : undefined
              : undefined,
        weight && weightClasses[weight],
        align && alignClasses[align],
        uppercase && 'uppercase tracking-wider',
        truncate && 'block truncate',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
