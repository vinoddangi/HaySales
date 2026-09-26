import React from 'react';

export function getAvatarInitial(
  name?: string,
  fallback: string = 'V',
): string {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}

export interface UseAvatarOptions {
  name?: string;
  onClick?: () => void;
}

export const useAvatar = ({ name, onClick }: UseAvatarOptions) => {
  const initial = getAvatarInitial(name);

  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return {
    initial,
    handleKeyDown,
  };
};
