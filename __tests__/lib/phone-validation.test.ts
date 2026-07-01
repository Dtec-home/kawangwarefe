/**
 * Utility: Phone Number Validation
 * Tests regex + transformation logic used in PhoneInput and login page.
 *
 * FIRST: Fast (pure regex, no DOM), Independent, Repeatable, Self-validating, Timely
 * ISTQB: Equivalence Partitioning + Boundary Value Analysis
 */

import { describe, it, expect } from 'vitest'

// The exact regex from contribution-form.tsx and login/page.tsx
const PHONE_REGEX = /^\d{9}$/

/**
 * Strip leading "0" and limit to 9 digits (mirrors PhoneInput onChange behaviour)
 */
function normalisePhone(raw: string): string {
  let value = raw.replace(/\D/g, '')
  if (value.startsWith('0')) value = value.substring(1)
  return value.substring(0, 9)
}

describe('Phone number regex — equivalence partitioning', () => {
  it('passes for a valid 9-digit Safaricom number', () => {
    expect(PHONE_REGEX.test('798765432')).toBe(true)
  })

  it('passes for a valid 9-digit Airtel number', () => {
    expect(PHONE_REGEX.test('100000001')).toBe(true)
  })

  it('fails for an 8-digit number (below boundary)', () => {
    expect(PHONE_REGEX.test('79703030')).toBe(false)
  })

  it('fails for a 10-digit number (above boundary)', () => {
    expect(PHONE_REGEX.test('7987654320')).toBe(false)
  })

  it('fails for an empty string', () => {
    expect(PHONE_REGEX.test('')).toBe(false)
  })

  it('fails for a number containing letters', () => {
    expect(PHONE_REGEX.test('79703030a')).toBe(false)
  })

  it('fails for a number containing spaces', () => {
    expect(PHONE_REGEX.test('797 03 030')).toBe(false)
  })

  it('fails for a number with a leading +254 prefix', () => {
    // Users must input 9-digit portion only
    expect(PHONE_REGEX.test('254798765432')).toBe(false)
  })
})

describe('normalisePhone — transformation logic (boundary analysis)', () => {
  it('strips non-digit characters', () => {
    expect(normalisePhone('798-765-432')).toBe('798765432')
  })

  it('removes a leading zero', () => {
    expect(normalisePhone('0798765432')).toBe('798765432')
  })

  it('truncates to 9 characters max', () => {
    expect(normalisePhone('7987654321234')).toBe('798765432')
  })

  it('handles an already-clean 9-digit string unchanged', () => {
    expect(normalisePhone('798765432')).toBe('798765432')
  })

  it('returns empty string for all non-digit input', () => {
    expect(normalisePhone('abc')).toBe('')
  })
})
