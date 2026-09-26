import clsx from 'clsx';
import React from 'react';
import { SpacingScale } from './Flex';
import './Grid.css';

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  columns?: GridColumns;
  gap?: SpacingScale;
  fullWidth?: boolean;
  as?: React.ElementType;
}

export const Grid = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      children,
      columns = 1,
      gap,
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
          'hs-grid',
          `hs-grid--cols-${columns}`,
          gap && `hs-grid--gap-${gap}`,
          fullWidth && 'hs-grid--full-width',
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

export default Grid;
