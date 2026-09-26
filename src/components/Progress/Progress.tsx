import '@material/web/progress/circular-progress.js';
import '@material/web/progress/linear-progress.js';
import clsx from 'clsx';
import React from 'react';
import './Progress.css';

export interface ProgressProps {
  type?: 'circular' | 'linear';
  value?: number;
  buffer?: number;
  indeterminate?: boolean;
  fourColor?: boolean;
  className?: string;
}

/**
 * React component wrapping Google Material Design 3 Progress Indicators
 * Supporting linear and circular types in determinate and indeterminate flavors.
 */
export const Progress: React.FC<ProgressProps> = ({
  type = 'circular',
  value,
  buffer,
  indeterminate = true,
  fourColor = false,
  className = '',
}) => {
  if (type === 'linear') {
    return (
      <md-linear-progress
        value={value}
        buffer={buffer}
        indeterminate={indeterminate}
        fourColor={fourColor}
        className={clsx('hs-progress', 'hs-progress--linear', className)}
      />
    );
  }

  return (
    <md-circular-progress
      value={value}
      indeterminate={indeterminate}
      fourColor={fourColor}
      className={clsx('hs-progress', className)}
    />
  );
};

export default Progress;
