import { describe, it, expect } from 'vitest'
import {
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  TOGGLE_EVENT_ACTIVE,
} from '@/lib/graphql/event-mutations'

describe('event-mutations', () => {
  it('exports CREATE_EVENT as DocumentNode', () => {
    expect(CREATE_EVENT).toBeDefined()
    expect(CREATE_EVENT.kind).toBe('Document')
  })

  it('CREATE_EVENT contains createEvent operation', () => {
    const body = (CREATE_EVENT as any).loc?.source?.body || ''
    expect(body).toContain('createEvent')
  })

  it('exports UPDATE_EVENT as DocumentNode', () => {
    expect(UPDATE_EVENT).toBeDefined()
    expect(UPDATE_EVENT.kind).toBe('Document')
  })

  it('UPDATE_EVENT contains updateEvent operation', () => {
    const body = (UPDATE_EVENT as any).loc?.source?.body || ''
    expect(body).toContain('updateEvent')
  })

  it('exports DELETE_EVENT as DocumentNode', () => {
    expect(DELETE_EVENT).toBeDefined()
    expect(DELETE_EVENT.kind).toBe('Document')
  })

  it('DELETE_EVENT contains deleteEvent operation', () => {
    const body = (DELETE_EVENT as any).loc?.source?.body || ''
    expect(body).toContain('deleteEvent')
  })

  it('exports TOGGLE_EVENT_ACTIVE as DocumentNode', () => {
    expect(TOGGLE_EVENT_ACTIVE).toBeDefined()
    expect(TOGGLE_EVENT_ACTIVE.kind).toBe('Document')
  })

  it('TOGGLE_EVENT_ACTIVE contains toggleEventActive operation', () => {
    const body = (TOGGLE_EVENT_ACTIVE as any).loc?.source?.body || ''
    expect(body).toContain('toggleEventActive')
  })
})
