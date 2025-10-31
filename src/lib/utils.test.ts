import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toBe('base visible');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4'); // px-4 should override px-2
  });

  it('should handle undefined and null', () => {
    const result = cn('class1', undefined, 'class2', null);
    expect(result).toBe('class1 class2');
  });

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toBe('class1 class3');
  });

  it('should handle mixed inputs', () => {
    const result = cn(
      'base',
      ['array1', 'array2'],
      { conditional: true, hidden: false },
      'final'
    );
    expect(result).toContain('base');
    expect(result).toContain('array1');
    expect(result).toContain('conditional');
    expect(result).not.toContain('hidden');
    expect(result).toContain('final');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle duplicate classes', () => {
    // Note: clsx doesn't automatically deduplicate non-conflicting classes
    const result = cn('class1', 'class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle Tailwind conflict resolution', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500'); // Later class should win
  });

  it('should handle complex Tailwind classes', () => {
    const result = cn(
      'p-4 text-center',
      'hover:bg-blue-500',
      'md:text-left'
    );
    expect(result).toContain('p-4');
    expect(result).toContain('text-center');
    expect(result).toContain('hover:bg-blue-500');
    expect(result).toContain('md:text-left');
  });

  it('should handle responsive class overrides', () => {
    const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
    expect(result).toContain('text-sm');
    expect(result).toContain('md:text-base');
    expect(result).toContain('lg:text-lg');
  });
});

