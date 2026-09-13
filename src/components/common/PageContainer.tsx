import React from 'react';
import { cn } from '../../utils/cn';

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
  const spacingClasses = {
    none: '',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-5',
  };

  const pbClasses = {
    none: 'pb-4',
    sm: 'pb-8',
    md: 'pb-12',
    lg: 'pb-24',
  };

  return (
    <div
      className={cn(
        'animate-fade-in p-4',
        spacingClasses[spacing],
        pbClasses[bottomPadding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
