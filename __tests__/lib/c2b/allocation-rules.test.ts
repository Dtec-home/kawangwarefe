/**
 * F5 (2026-11-09): resolving a Pay Bill payment to a department that splits
 * automatically (e.g. Combined Offering -> CKC/LCB) must not make the
 * treasurer pick a purpose or divide the amount: the configured split applies.
 */
import { describe, it, expect } from 'vitest'

import { AUTO_SPLIT, allocationIsValid, purposeChoice, purposeIdForApi } from '@/lib/c2b/allocation-rules'

const combined = { id: '9', routingMode: 'REQUIRES_PURPOSE', hasAutoSplit: true }
const missions = { id: '8', routingMode: 'REQUIRES_PURPOSE', hasAutoSplit: false }
const offering = { id: '7', routingMode: 'OPTIONAL_DETAILS', hasAutoSplit: false }
const tithe = { id: '1', routingMode: 'DIRECT', hasAutoSplit: false }

describe('purposeChoice', () => {
  it('an auto-split department offers "split automatically" and needs no pick', () => {
    expect(purposeChoice(combined)).toEqual({ show: true, required: false, autoSplit: true })
  })
  it('a department that requires a purpose and does not split still needs one', () => {
    expect(purposeChoice(missions)).toEqual({ show: true, required: true, autoSplit: false })
  })
  it('optional details are optional', () => {
    expect(purposeChoice(offering)).toEqual({ show: true, required: false, autoSplit: false })
  })
  it('a plain department has no purpose', () => {
    expect(purposeChoice(tithe)).toEqual({ show: false, required: false, autoSplit: false })
  })
})

describe('allocationIsValid', () => {
  const row = (categoryId: string, purposeId = '', amount = '50') => ({ categoryId, purposeId, amount })

  it('an auto-split department with no purpose chosen is valid (the screenshot case)', () => {
    expect(allocationIsValid(row('9'), combined)).toBe(true)
    expect(allocationIsValid(row('9', AUTO_SPLIT), combined)).toBe(true)
  })
  it('a purpose-required department without one is not', () => {
    expect(allocationIsValid(row('8'), missions)).toBe(false)
    expect(allocationIsValid(row('8', '42'), missions)).toBe(true)
  })
  it('needs a department and a positive amount', () => {
    expect(allocationIsValid(row(''), undefined)).toBe(false)
    expect(allocationIsValid(row('1', '', '0'), tithe)).toBe(false)
  })
})

describe('purposeIdForApi', () => {
  it('"split automatically" and "none" send no purpose', () => {
    expect(purposeIdForApi(AUTO_SPLIT)).toBeUndefined()
    expect(purposeIdForApi('')).toBeUndefined()
    expect(purposeIdForApi('42')).toBe('42')
  })
})
