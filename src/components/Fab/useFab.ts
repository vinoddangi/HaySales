import React, { useEffect, useRef } from 'react';

export type FabSize = 'medium' | 'small' | 'large' | 'sm' | 'md' | 'lg';

export interface UseFabOptions {
  size?: FabSize;
  onClick?: (_e: React.MouseEvent<HTMLElement>) => void;
}

export const useFab = ({ size = 'medium', onClick }: UseFabOptions) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onClick) return;

    const handleClick = (e: Event) => {
      onClick(e as unknown as React.MouseEvent<HTMLElement>);
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [onClick]);

  const resolvedSize: 'small' | 'medium' | 'large' =
    size === 'sm' || size === 'small'
      ? 'small'
      : size === 'lg' || size === 'large'
        ? 'large'
        : 'medium';

  return { ref, resolvedSize };
};
