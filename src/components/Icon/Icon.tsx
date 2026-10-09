import clsx from 'clsx';
import React from 'react';
import './Icon.css';
import { IconSentiment, IconSize, useIcon } from './useIcon';

export type { IconSentiment, IconSize };

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  children?: React.ReactNode;
  size?: IconSize;
  sentiment?: IconSentiment;
  color?: string;
  strokeWidth?: number;
  className?: string;
  slot?: string;
}

/**
 * Material Design 3 Icon Component.
 * Supports standard semantic sizes: 'xs' (12px), 'sm' (14px), 'md' (16px), 'lg' (20px), 'xl' (24px), '2xl' (32px),
 * or numeric pixel values (e.g. size={18}).
 * Supports M3 sentiment roles ('positive', 'negative', 'warning', 'info', 'accent', 'neutral') or direct color.
 * Directly renders Lucide SVG icons with full stroke preservation and zero Shadow DOM interference.
 */
export const Icon: React.FC<IconProps> = ({
  children,
  size = 'md',
  sentiment,
  color,
  strokeWidth,
  className = '',
  slot,
  style,
  ...props
}) => {
  const { pixelSize, sizeClass, sentimentClass } = useIcon({
    size,
    sentiment,
    color,
  });

  const resolvedClass = clsx('hs-icon', sizeClass, sentimentClass, className);

  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      size: pixelSize,
      width: pixelSize,
      height: pixelSize,
      color,
      strokeWidth: strokeWidth ?? (children.props as any).strokeWidth,
      className: clsx(resolvedClass, (children.props as any).className),
      style: {
        ...(color ? { color } : {}),
        ...style,
        ...(children.props as any).style,
      },
      ...props,
    });
  }

  return (
    <span
      slot={slot}
      className={resolvedClass}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        ...(color ? { color } : {}),
        ...style,
      }}
      {...(props as React.HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  );
};

export default Icon;
