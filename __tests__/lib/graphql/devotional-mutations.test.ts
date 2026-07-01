import { describe, it, expect } from 'vitest'
import {
  CREATE_DEVOTIONAL,
  UPDATE_DEVOTIONAL,
  DELETE_DEVOTIONAL,
  TOGGLE_DEVOTIONAL_FEATURED,
  TOGGLE_DEVOTIONAL_PUBLISHED,
} from '@/lib/graphql/devotional-mutations'

describe('devotional-mutations', () => {
  it('exports CREATE_DEVOTIONAL as DocumentNode', () => {
    expect(CREATE_DEVOTIONAL).toBeDefined()
    expect(CREATE_DEVOTIONAL.kind).toBe('Document')
  })

  it('CREATE_DEVOTIONAL contains createDevotional operation', () => {
    const body = (CREATE_DEVOTIONAL as any).loc?.source?.body || ''
    expect(body).toContain('createDevotional')
  })

  it('exports UPDATE_DEVOTIONAL as DocumentNode', () => {
    expect(UPDATE_DEVOTIONAL).toBeDefined()
    expect(UPDATE_DEVOTIONAL.kind).toBe('Document')
  })

  it('UPDATE_DEVOTIONAL contains updateDevotional operation', () => {
    const body = (UPDATE_DEVOTIONAL as any).loc?.source?.body || ''
    expect(body).toContain('updateDevotional')
  })

  it('exports DELETE_DEVOTIONAL as DocumentNode', () => {
    expect(DELETE_DEVOTIONAL).toBeDefined()
    expect(DELETE_DEVOTIONAL.kind).toBe('Document')
  })

  it('DELETE_DEVOTIONAL contains deleteDevotional operation', () => {
    const body = (DELETE_DEVOTIONAL as any).loc?.source?.body || ''
    expect(body).toContain('deleteDevotional')
  })

  it('exports TOGGLE_DEVOTIONAL_FEATURED as DocumentNode', () => {
    expect(TOGGLE_DEVOTIONAL_FEATURED).toBeDefined()
    expect(TOGGLE_DEVOTIONAL_FEATURED.kind).toBe('Document')
  })

  it('TOGGLE_DEVOTIONAL_FEATURED contains toggleDevotionalFeatured operation', () => {
    const body = (TOGGLE_DEVOTIONAL_FEATURED as any).loc?.source?.body || ''
    expect(body).toContain('toggleDevotionalFeatured')
  })

  it('exports TOGGLE_DEVOTIONAL_PUBLISHED as DocumentNode', () => {
    expect(TOGGLE_DEVOTIONAL_PUBLISHED).toBeDefined()
    expect(TOGGLE_DEVOTIONAL_PUBLISHED.kind).toBe('Document')
  })

  it('TOGGLE_DEVOTIONAL_PUBLISHED contains toggleDevotionalPublished operation', () => {
    const body = (TOGGLE_DEVOTIONAL_PUBLISHED as any).loc?.source?.body || ''
    expect(body).toContain('toggleDevotionalPublished')
  })
})
