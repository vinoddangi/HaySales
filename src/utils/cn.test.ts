import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('combines classes properly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isHidden = false;
    expect(cn('base', isActive && 'is-active', isHidden && 'is-hidden')).toBe(
      'base is-active',
    );
  });

  it('merges tailwind duplicate classes properly', () => {
    expect(cn('p-2 p-4', 'text-red-500 text-blue-500')).toBe(
      'p-4 text-blue-500',
    );
  });
});
