import { describe, it, expect } from 'vitest'
import {
  GET_PAYMENT_STATUS,
  CHECK_PAYMENT_STATUS,
  GET_CONTRIBUTIONS_BY_CHECKOUT_ID,
} from '@/lib/graphql/payment-status-query'

describe('payment-status-query', () => {
  it('exports GET_PAYMENT_STATUS as DocumentNode', () => {
    expect(GET_PAYMENT_STATUS).toBeDefined()
    expect(GET_PAYMENT_STATUS.kind).toBe('Document')
  })

  it('GET_PAYMENT_STATUS contains paymentStatus query', () => {
    const body = (GET_PAYMENT_STATUS as any).loc?.source?.body || ''
    expect(body).toContain('paymentStatus')
  })

  it('exports CHECK_PAYMENT_STATUS as DocumentNode', () => {
    expect(CHECK_PAYMENT_STATUS).toBeDefined()
    expect(CHECK_PAYMENT_STATUS.kind).toBe('Document')
  })

  it('CHECK_PAYMENT_STATUS contains checkPaymentStatus operation', () => {
    const body = (CHECK_PAYMENT_STATUS as any).loc?.source?.body || ''
    expect(body).toContain('checkPaymentStatus')
  })

  it('exports GET_CONTRIBUTIONS_BY_CHECKOUT_ID as DocumentNode', () => {
    expect(GET_CONTRIBUTIONS_BY_CHECKOUT_ID).toBeDefined()
    expect(GET_CONTRIBUTIONS_BY_CHECKOUT_ID.kind).toBe('Document')
  })

  it('GET_CONTRIBUTIONS_BY_CHECKOUT_ID contains contributionsByCheckoutId query', () => {
    const body = (GET_CONTRIBUTIONS_BY_CHECKOUT_ID as any).loc?.source?.body || ''
    expect(body).toContain('contributionsByCheckoutId')
  })
})
