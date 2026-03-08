import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null);
    expect(result).toBe('base');
  });

  it('merges tailwind conflicting classes correctly', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });
});
