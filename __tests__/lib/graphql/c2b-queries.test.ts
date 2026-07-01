import { describe, it, expect } from 'vitest'
import {
  GET_C2B_TRANSACTIONS,
  GET_C2B_TRANSACTION_STATS,
  RESOLVE_UNMATCHED_C2B,
} from '@/lib/graphql/c2b-queries'

describe('c2b-queries', () => {
  it('exports GET_C2B_TRANSACTIONS as DocumentNode', () => {
    expect(GET_C2B_TRANSACTIONS).toBeDefined()
    expect(GET_C2B_TRANSACTIONS.kind).toBe('Document')
  })

  it('GET_C2B_TRANSACTIONS contains c2bTransactions query', () => {
    const body = (GET_C2B_TRANSACTIONS as any).loc?.source?.body || ''
    expect(body).toContain('c2bTransactions')
  })

  it('exports GET_C2B_TRANSACTION_STATS as DocumentNode', () => {
    expect(GET_C2B_TRANSACTION_STATS).toBeDefined()
    expect(GET_C2B_TRANSACTION_STATS.kind).toBe('Document')
  })

  it('GET_C2B_TRANSACTION_STATS contains c2bTransactionStats query', () => {
    const body = (GET_C2B_TRANSACTION_STATS as any).loc?.source?.body || ''
    expect(body).toContain('c2bTransactionStats')
  })

  it('exports RESOLVE_UNMATCHED_C2B as DocumentNode', () => {
    expect(RESOLVE_UNMATCHED_C2B).toBeDefined()
    expect(RESOLVE_UNMATCHED_C2B.kind).toBe('Document')
  })

  it('RESOLVE_UNMATCHED_C2B contains resolveUnmatchedC2b operation', () => {
    const body = (RESOLVE_UNMATCHED_C2B as any).loc?.source?.body || ''
    expect(body).toContain('resolveUnmatchedC2b')
  })
})
