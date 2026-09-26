import clsx from 'clsx';
import React from 'react';
import './Flex.css';

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type FlexJustify =
  'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type SpacingScale = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FlexProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
  gap?: SpacingScale;
  padding?: SpacingScale;
  paddingHorizontal?: SpacingScale;
  paddingVertical?: SpacingScale;
  fullWidth?: boolean;
  as?: React.ElementType;
}

export const Flex = React.forwardRef<HTMLElement, FlexProps>(
  (
    {
      children,
      direction = 'row',
      align,
      justify,
      wrap = false,
      gap,
      padding,
      paddingHorizontal,
      paddingVertical,
      fullWidth = false,
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
          wrap && 'hs-flex--wrap',
          gap && `hs-flex--gap-${gap}`,
          padding && `hs-flex--p-${padding}`,
          paddingHorizontal && `hs-flex--px-${paddingHorizontal}`,
          paddingVertical && `hs-flex--py-${paddingVertical}`,
          fullWidth && 'hs-flex--full-width',
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

Flex.displayName = 'Flex';

export default Flex;
