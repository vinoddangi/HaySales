import clsx from 'clsx';
import React from 'react';
import './PageContainer.css';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  bottomPadding?: 'none' | 'sm' | 'md' | 'lg';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  spacing = 'md',
  bottomPadding = 'lg',
  ...props
}) => {
  return (
    <div
      className={clsx(
        'hs-page-container',
        `hs-page-container--spacing-${spacing}`,
        `hs-page-container--pb-${bottomPadding}`,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default PageContainer;
