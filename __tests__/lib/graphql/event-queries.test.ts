import { describe, it, expect } from 'vitest'
import {
  GET_ALL_EVENTS,
  GET_EVENT,
} from '@/lib/graphql/event-queries'

describe('event-queries', () => {
  it('exports GET_ALL_EVENTS as DocumentNode', () => {
    expect(GET_ALL_EVENTS).toBeDefined()
    expect(GET_ALL_EVENTS.kind).toBe('Document')
  })

  it('GET_ALL_EVENTS contains events query', () => {
    const body = (GET_ALL_EVENTS as any).loc?.source?.body || ''
    expect(body).toContain('events')
  })

  it('exports GET_EVENT as DocumentNode', () => {
    expect(GET_EVENT).toBeDefined()
    expect(GET_EVENT.kind).toBe('Document')
  })

  it('GET_EVENT contains event query', () => {
    const body = (GET_EVENT as any).loc?.source?.body || ''
    expect(body).toContain('event')
  })
})
