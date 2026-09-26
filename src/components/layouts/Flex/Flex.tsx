import clsx from 'clsx';
import React from 'react';
import './Flex.css';

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type FlexJustify =
  'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type SpacingScale = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FlexProps extends Omit<
  React.AllHTMLAttributes<HTMLElement>,
  'as' | 'wrap'
> {
  children?: React.ReactNode;
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  alignSelf?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  wrap?: boolean;
  gap?: SpacingScale;
  padding?: SpacingScale;
  paddingHorizontal?: SpacingScale;
  paddingVertical?: SpacingScale;
  fullWidth?: boolean;
  fullHeight?: boolean;
  grow?: boolean | number;
  shrink?: boolean | number;
  scrollable?: 'x' | 'y' | 'both';
  as?: React.ElementType;
}

export interface FlexItemProps extends Omit<
  React.AllHTMLAttributes<HTMLElement>,
  'as'
> {
  children?: React.ReactNode;
  grow?: boolean | number;
  shrink?: boolean | number;
  alignSelf?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  fullWidth?: boolean;
  fullHeight?: boolean;
  as?: React.ElementType;
}

export const FlexItem = React.forwardRef<HTMLElement, FlexItemProps>(
  (
    {
      children,
      grow,
      shrink,
      alignSelf,
      fullWidth = false,
      fullHeight = false,
      as: Component = 'div',
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          'hs-flex__item',
          grow === true && 'hs-flex__item--grow',
          grow === false && 'hs-flex__item--grow-0',
          typeof grow === 'number' && `hs-flex__item--grow-${grow}`,
          shrink === false && 'hs-flex__item--shrink-0',
          shrink === true && 'hs-flex__item--shrink',
          alignSelf && `hs-flex__item--self-${alignSelf}`,
          fullWidth && 'hs-flex__item--full-width',
          fullHeight && 'hs-flex__item--full-height',
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

FlexItem.displayName = 'FlexItem';

export const FlexRoot = React.forwardRef<HTMLElement, FlexProps>(
  (
    {
      children,
      direction = 'row',
      align,
      justify,
      alignSelf,
      wrap = false,
      gap,
      padding,
      paddingHorizontal,
      paddingVertical,
      fullWidth = false,
      fullHeight = false,
      grow,
      shrink,
      scrollable,
      as: Component = 'div',
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          'hs-flex',
          `hs-flex--dir-${direction}`,
          align && `hs-flex--align-${align}`,
          justify && `hs-flex--justify-${justify}`,
          alignSelf && `hs-flex--self-${alignSelf}`,
          wrap && 'hs-flex--wrap',
          gap && `hs-flex--gap-${gap}`,
          padding && `hs-flex--p-${padding}`,
          paddingHorizontal && `hs-flex--px-${paddingHorizontal}`,
          paddingVertical && `hs-flex--py-${paddingVertical}`,
          fullWidth && 'hs-flex--full-width',
          fullHeight && 'hs-flex--full-height',
          grow === true && 'hs-flex--grow',
          grow === false && 'hs-flex--grow-0',
          typeof grow === 'number' && `hs-flex--grow-${grow}`,
          shrink === false && 'hs-flex--shrink-0',
          shrink === true && 'hs-flex--shrink',
          scrollable && `hs-flex--scroll-${scrollable}`,
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

FlexRoot.displayName = 'Flex';

export const Flex = Object.assign(FlexRoot, {
  Item: FlexItem,
});

export default Flex;
