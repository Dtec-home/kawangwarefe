/**
 * Idempotency key helpers (T5.3)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  generateIdempotencyKey,
  submissionFingerprint,
  useIdempotencyKey,
} from '@/components/contributions/idempotency'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('generateIdempotencyKey', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns distinct UUIDs', () => {
    const a = generateIdempotencyKey()
    const b = generateIdempotencyKey()
    expect(a).toMatch(UUID_V4)
    expect(b).not.toBe(a)
  })

  it('falls back when crypto.randomUUID is unavailable (plain http)', () => {
    vi.stubGlobal('crypto', { getRandomValues: (arr: Uint8Array) => arr.fill(7) })
    expect(generateIdempotencyKey()).toMatch(UUID_V4)
  })
})

describe('submissionFingerprint', () => {
  it('ignores key order and undefined values', () => {
    expect(submissionFingerprint({ a: 1, b: [{ x: 1, y: 2 }], c: undefined })).toBe(
      submissionFingerprint({ b: [{ y: 2, x: 1 }], a: 1 })
    )
    expect(submissionFingerprint({ a: 1 })).not.toBe(submissionFingerprint({ a: 2 }))
  })
})

describe('useIdempotencyKey', () => {
  it('reuses the key for an unsettled identical submission', () => {
    const { result } = renderHook(() => useIdempotencyKey())
    const first = result.current.keyFor({ amount: '100' })
    expect(result.current.keyFor({ amount: '100' })).toBe(first)
  })

  it('issues a new key once settled or when the submission changes', () => {
    const { result } = renderHook(() => useIdempotencyKey())
    const first = result.current.keyFor({ amount: '100' })
    const changed = result.current.keyFor({ amount: '200' })
    expect(changed).not.toBe(first)
    result.current.settle()
    expect(result.current.keyFor({ amount: '200' })).not.toBe(changed)
  })
})
