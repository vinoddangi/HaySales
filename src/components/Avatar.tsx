import clsx from 'clsx';
import React from 'react';
import './Avatar.css';

export interface AvatarProps {
  name?: string;
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'rounded';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function getAvatarInitial(
  name?: string,
  fallback: string = 'V',
): string {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}

/**
 * Reusable Material Design 3 Avatar building block.
 * Displays user image or initial derived from profile / contact name.
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  alt,
  size = 'md',
  variant = 'circular',
  className = '',
  style,
  onClick,
  title,
  children,
}) => {
  const initial = getAvatarInitial(name);

  const resolvedClassName = clsx(
    'hs-avatar',
    `hs-avatar--${size}`,
    `hs-avatar--${variant}`,
    onClick && 'hs-avatar--clickable',
    className,
  );

  return (
    <div
      className={resolvedClassName}
      style={style}
      onClick={onClick}
      title={title || name || 'Profile Avatar'}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="hs-avatar__image"
        />
      ) : children ? (
        children
      ) : (
        <span className="hs-avatar__text">{initial}</span>
      )}
    </div>
  );
};

export default Avatar;
