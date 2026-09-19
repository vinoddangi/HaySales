import React from 'react';
import { cn } from '../../utils/cn';

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type FlexJustify =
  'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type SpacingScale =
  'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 1 | 2 | 3 | 4 | 5 | 6 | 8;

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
  margin?: SpacingScale;
  marginHorizontal?: SpacingScale;
  marginVertical?: SpacingScale;
  fullWidth?: boolean;
  as?: React.ElementType;
}

const gapMap: Record<string, string> = {
  none: 'gap-0',
  xs: 'gap-1', // 4px
  sm: 'gap-2', // 8px
  md: 'gap-3', // 12px
  lg: 'gap-4', // 16px
  xl: 'gap-6', // 24px
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
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

const directionMap: Record<FlexDirection, string> = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

const alignMap: Record<FlexAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const justifyMap: Record<FlexJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

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
      margin,
      marginHorizontal,
      marginVertical,
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
        className={cn(
          'flex',
          directionMap[direction],
          align && alignMap[align],
          justify && justifyMap[justify],
          wrap && 'flex-wrap',
          gap !== undefined && gapMap[String(gap)],
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

Flex.displayName = 'Flex';
