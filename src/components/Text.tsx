import clsx from 'clsx';
import React from 'react';
import './Text.css';

export type TextVariant =
  // Official M3 Typescale Roles (5 roles x 3 sizes)
  | 'display-lg'
  | 'display-md'
  | 'display-sm'
  | 'headline-lg'
  | 'headline-md'
  | 'headline-sm'
  | 'title-lg'
  | 'title-md'
  | 'title-sm'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'label-lg'
  | 'label-md'
  | 'label-sm'
  // Shorthand Aliases
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'label'
  | 'caption'
  | 'amount';

export type TextSentiment =
  'positive' | 'negative' | 'warning' | 'accent' | 'neutral';

export type TextAppearance = 'primary' | 'secondary' | 'disabled';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

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
  variant?: TextVariant;
  styleAs?: TextVariant; // alias
  sentiment?: TextSentiment;
  appearance?: TextAppearance;
  weight?: TextWeight;
  align?: TextAlign;
  uppercase?: boolean;
  truncate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Semantic M3 Typography component following the Google Material Design 3 Typescale.
 * Supports all 15 official M3 type roles (display, headline, title, body, label x lg/md/sm)
 * as well as common shorthands.
 */
export const Text: React.FC<TextProps> = ({
  as: Component = 'span',
  variant = 'body-md',
  styleAs,
  sentiment,
  appearance = 'primary',
  weight,
  align,
  uppercase = false,
  truncate = false,
  className,
  children,
  ...props
}) => {
  const resolvedVariant = styleAs || variant;

  return (
    <Component
      className={clsx(
        'text',
        `text--${resolvedVariant}`,
        sentiment
          ? `text--sentiment-${sentiment}`
          : `text--appearance-${appearance}`,
        weight && `text--weight-${weight}`,
        align && `text--align-${align}`,
        uppercase && 'text--uppercase',
        truncate && 'text--truncate',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Text;
