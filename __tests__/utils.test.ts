import { describe, test, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  test('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
  })

  test('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  test('filters out falsy values', () => {
    const result = cn('text-red-500', false, null, undefined, 'bg-blue-500')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
    expect(result).not.toContain('false')
    expect(result).not.toContain('null')
  })

  test('resolves Tailwind conflicts (last class wins)', () => {
    const result = cn('p-4', 'p-8')
    // twMerge should keep only p-8
    expect(result).toBe('p-8')
  })

  test('handles empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  test('handles arrays of classes', () => {
    const result = cn(['text-red-500', 'bg-blue-500'])
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
  })

  test('handles objects with conditional classes', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
      'font-bold': true,
    })
    expect(result).toContain('text-red-500')
    expect(result).toContain('font-bold')
    expect(result).not.toContain('bg-blue-500')
  })
})
