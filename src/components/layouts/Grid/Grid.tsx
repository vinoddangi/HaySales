import clsx from 'clsx';
import React from 'react';
import { SpacingScale } from '../Flex';
import './Grid.css';

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

export interface GridProps extends Omit<
  React.AllHTMLAttributes<HTMLElement>,
  'as'
> {
  children?: React.ReactNode;
  columns?: GridColumns;
  smColumns?: GridColumns;
  mdColumns?: GridColumns;
  gap?: SpacingScale;
  rowGap?: SpacingScale;
  columnGap?: SpacingScale;
  padding?: SpacingScale;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'stretch';
  fullWidth?: boolean;
  fullHeight?: boolean;
  as?: React.ElementType;
}

export interface GridItemProps extends Omit<
  React.AllHTMLAttributes<HTMLElement>,
  'as' | 'colSpan' | 'rowSpan'
> {
  children?: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';
  justifySelf?: 'start' | 'center' | 'end' | 'stretch';
  fullWidth?: boolean;
  fullHeight?: boolean;
  as?: React.ElementType;
}

export const GridItem = React.forwardRef<HTMLElement, GridItemProps>(
  (
    {
      children,
      colSpan,
      rowSpan,
      alignSelf,
      justifySelf,
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
          'hs-grid__item',
          colSpan && `hs-grid__item--col-span-${colSpan}`,
          rowSpan && `hs-grid__item--row-span-${rowSpan}`,
          alignSelf && `hs-grid__item--self-align-${alignSelf}`,
          justifySelf && `hs-grid__item--self-justify-${justifySelf}`,
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

GridItem.displayName = 'GridItem';

export const GridRoot = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      children,
      columns = 1,
      smColumns,
      mdColumns,
      gap,
      rowGap,
      columnGap,
      padding,
      align,
      justify,
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
          'hs-grid',
          `hs-grid--cols-${columns}`,
          smColumns && `hs-grid--sm-cols-${smColumns}`,
          mdColumns && `hs-grid--md-cols-${mdColumns}`,
          gap && `hs-grid--gap-${gap}`,
          rowGap && `hs-grid--row-gap-${rowGap}`,
          columnGap && `hs-grid--col-gap-${columnGap}`,
          padding && `hs-grid--p-${padding}`,
          align && `hs-grid--align-${align}`,
          justify && `hs-grid--justify-${justify}`,
          fullWidth && 'hs-grid--full-width',
          fullHeight && 'hs-grid--full-height',
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

GridRoot.displayName = 'Grid';

export const Grid = Object.assign(GridRoot, {
  Item: GridItem,
});

export default Grid;
