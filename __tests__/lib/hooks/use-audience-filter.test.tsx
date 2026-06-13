/**
 * useAudienceFilter tests.
 *
 * Pure state hook (no GraphQL) that builds the audience filter object the
 * messaging mutations consume. Covers every setter, reset, and the toJson
 * serialiser's omit-when-default rules.
 */

import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAudienceFilter } from '@/lib/hooks/use-audience-filter'

describe('useAudienceFilter', () => {
  it('starts with the empty default filter', () => {
    const { result } = renderHook(() => useAudienceFilter())
    expect(result.current.filter).toEqual({
      departmentIds: [],
      groupIds: [],
      roles: [],
      memberIds: [],
      includeGuests: false,
      includeMinors: true,
      extraPhoneNumbers: [],
    })
  })

  it('updates each list/flag through its setter', () => {
    const { result } = renderHook(() => useAudienceFilter())

    act(() => result.current.setDepartmentIds(['1', '2']))
    act(() => result.current.setGroupIds(['3']))
    act(() => result.current.setRoles(['ADMIN']))
    act(() => result.current.setMemberIds(['9']))
    act(() => result.current.setIncludeGuests(true))
    act(() => result.current.setIncludeMinors(false))
    act(() => result.current.setExtraPhoneNumbers(['254700000000']))

    expect(result.current.filter).toEqual({
      departmentIds: ['1', '2'],
      groupIds: ['3'],
      roles: ['ADMIN'],
      memberIds: ['9'],
      includeGuests: true,
      includeMinors: false,
      extraPhoneNumbers: ['254700000000'],
    })
  })

  it('toJson emits an empty object for the default filter', () => {
    const { result } = renderHook(() => useAudienceFilter())
    expect(JSON.parse(result.current.toJson())).toEqual({})
  })

  it('toJson serialises numeric ids and snake_case keys', () => {
    const { result } = renderHook(() => useAudienceFilter())

    act(() => result.current.setDepartmentIds(['1', '2']))
    act(() => result.current.setGroupIds(['3']))
    act(() => result.current.setRoles(['ADMIN', 'CLERK']))
    act(() => result.current.setMemberIds(['10', '11']))
    act(() => result.current.setExtraPhoneNumbers(['254700111222']))

    const out = JSON.parse(result.current.toJson())
    expect(out).toEqual({
      department_ids: [1, 2],
      group_ids: [3],
      roles: ['ADMIN', 'CLERK'],
      member_ids: [10, 11],
      extra_phone_numbers: ['254700111222'],
    })
  })

  it('toJson includes include_guests only when true', () => {
    const { result } = renderHook(() => useAudienceFilter())
    act(() => result.current.setIncludeGuests(true))
    expect(JSON.parse(result.current.toJson())).toEqual({ include_guests: true })
  })

  it('toJson includes include_minors only when false (opt-out)', () => {
    const { result } = renderHook(() => useAudienceFilter())
    act(() => result.current.setIncludeMinors(false))
    expect(JSON.parse(result.current.toJson())).toEqual({ include_minors: false })
  })

  it('reset restores the empty default', () => {
    const { result } = renderHook(() => useAudienceFilter())
    act(() => result.current.setRoles(['ADMIN']))
    act(() => result.current.setIncludeGuests(true))
    act(() => result.current.reset())
    expect(result.current.filter.roles).toEqual([])
    expect(result.current.filter.includeGuests).toBe(false)
    expect(JSON.parse(result.current.toJson())).toEqual({})
  })
})
