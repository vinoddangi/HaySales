import React from 'react';

export interface SegmentItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface UseSegmentedButtonOptions {
  segments: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
}

export const useSegmentedButton = ({
  segments,
  value,
  onChange,
}: UseSegmentedButtonOptions) => {
  const handleKeyDown = (e: React.KeyboardEvent, segValue: string) => {
    const currentIndex = segments.findIndex((s) => s.value === segValue);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = segments[(currentIndex + 1) % segments.length];
      if (next && !next.disabled) onChange(next.value);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev =
        segments[(currentIndex - 1 + segments.length) % segments.length];
      if (prev && !prev.disabled) onChange(prev.value);
    }
  };

  const activeIndex = segments.findIndex((s) => s.value === value);

  return { handleKeyDown, activeIndex };
};
