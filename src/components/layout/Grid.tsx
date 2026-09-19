import React from 'react';
import { cn } from '../../utils/cn';
import { SpacingScale } from './Flex';

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  columns?: GridColumns;
  smColumns?: GridColumns;
  mdColumns?: GridColumns;
  templateColumns?: string;
  gap?: SpacingScale;
  gapHorizontal?: SpacingScale;
  gapVertical?: SpacingScale;
  padding?: SpacingScale;
  paddingHorizontal?: SpacingScale;
  paddingVertical?: SpacingScale;
  margin?: SpacingScale;
  marginHorizontal?: SpacingScale;
  marginVertical?: SpacingScale;
  fullWidth?: boolean;
  as?: React.ElementType;
}

const colsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const smColsMap: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  12: 'sm:grid-cols-12',
};

const mdColsMap: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  12: 'md:grid-cols-12',
};

const gapMap: Record<string, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
};

const gapXMap: Record<string, string> = {
  none: 'gap-x-0',
  xs: 'gap-x-1',
  sm: 'gap-x-2',
  md: 'gap-x-3',
  lg: 'gap-x-4',
  xl: 'gap-x-6',
  '1': 'gap-x-1',
  '2': 'gap-x-2',
  '3': 'gap-x-3',
  '4': 'gap-x-4',
  '5': 'gap-x-5',
  '6': 'gap-x-6',
  '8': 'gap-x-8',
};

const gapYMap: Record<string, string> = {
  none: 'gap-y-0',
  xs: 'gap-y-1',
  sm: 'gap-y-2',
  md: 'gap-y-3',
  lg: 'gap-y-4',
  xl: 'gap-y-6',
  '1': 'gap-y-1',
  '2': 'gap-y-2',
  '3': 'gap-y-3',
  '4': 'gap-y-4',
  '5': 'gap-y-5',
  '6': 'gap-y-6',
  '8': 'gap-y-8',
};

const paddingMap: Record<string, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
  '1': 'p-1',
  '2': 'p-2',
  '3': 'p-3',
  '4': 'p-4',
  '5': 'p-5',
  '6': 'p-6',
  '8': 'p-8',
};

const paddingXMap: Record<string, string> = {
  none: 'px-0',
  xs: 'px-1',
  sm: 'px-2',
  md: 'px-3',
  lg: 'px-4',
  xl: 'px-6',
  '1': 'px-1',
  '2': 'px-2',
  '3': 'px-3',
  '4': 'px-4',
  '5': 'px-5',
  '6': 'px-6',
  '8': 'px-8',
};

const paddingYMap: Record<string, string> = {
  none: 'py-0',
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-3',
  lg: 'py-4',
  xl: 'py-6',
  '1': 'py-1',
  '2': 'py-2',
  '3': 'py-3',
  '4': 'py-4',
  '5': 'py-5',
  '6': 'py-6',
  '8': 'py-8',
};

const marginMap: Record<string, string> = {
  none: 'm-0',
  xs: 'm-1',
  sm: 'm-2',
  md: 'm-3',
  lg: 'm-4',
  xl: 'm-6',
  '1': 'm-1',
  '2': 'm-2',
  '3': 'm-3',
  '4': 'm-4',
  '5': 'm-5',
  '6': 'm-6',
  '8': 'm-8',
};

const marginXMap: Record<string, string> = {
  none: 'mx-0',
  xs: 'mx-1',
  sm: 'mx-2',
  md: 'mx-3',
  lg: 'mx-4',
  xl: 'mx-6',
  '1': 'mx-1',
  '2': 'mx-2',
  '3': 'mx-3',
  '4': 'mx-4',
  '5': 'mx-5',
  '6': 'mx-6',
  '8': 'mx-8',
};

const marginYMap: Record<string, string> = {
  none: 'my-0',
  xs: 'my-1',
  sm: 'my-2',
  md: 'my-3',
  lg: 'my-4',
  xl: 'my-6',
  '1': 'my-1',
  '2': 'my-2',
  '3': 'my-3',
  '4': 'my-4',
  '5': 'my-5',
  '6': 'my-6',
  '8': 'my-8',
};

export const Grid = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      children,
      columns = 1,
      smColumns,
      mdColumns,
      templateColumns,
      gap,
      gapHorizontal,
      gapVertical,
      padding,
      paddingHorizontal,
      paddingVertical,
      margin,
      marginHorizontal,
      marginVertical,
      fullWidth = false,
      as: Component = 'div',
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const inlineStyle = templateColumns
      ? { ...style, gridTemplateColumns: templateColumns }
      : style;

    return (
      <Component
        ref={ref}
        style={inlineStyle}
        className={cn(
          'grid',
          !templateColumns && colsMap[columns],
          smColumns && smColsMap[smColumns],
          mdColumns && mdColsMap[mdColumns],
          gap !== undefined && gapMap[String(gap)],
          gapHorizontal !== undefined && gapXMap[String(gapHorizontal)],
          gapVertical !== undefined && gapYMap[String(gapVertical)],
          padding !== undefined && paddingMap[String(padding)],
          paddingHorizontal !== undefined &&
            paddingXMap[String(paddingHorizontal)],
          paddingVertical !== undefined && paddingYMap[String(paddingVertical)],
          margin !== undefined && marginMap[String(margin)],
          marginHorizontal !== undefined &&
            marginXMap[String(marginHorizontal)],
          marginVertical !== undefined && marginYMap[String(marginVertical)],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

Grid.displayName = 'Grid';
