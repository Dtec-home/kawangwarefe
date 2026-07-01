import { describe, it, expect } from 'vitest'
import {
  UPDATE_TUTORIAL_STATUS,
  RESET_ALL_TUTORIALS,
} from '@/lib/graphql/tutorial-mutations'

describe('tutorial-mutations', () => {
  it('exports UPDATE_TUTORIAL_STATUS as a DocumentNode with key + completed args', () => {
    expect(UPDATE_TUTORIAL_STATUS.kind).toBe('Document')
    const body = (UPDATE_TUTORIAL_STATUS as { loc?: { source: { body: string } } }).loc?.source.body || ''
    expect(body).toContain('updateTutorialStatus')
    expect(body).toContain('$tutorialKey')
    expect(body).toContain('$completed')
  })

  it('exports RESET_ALL_TUTORIALS returning success + tutorialState', () => {
    expect(RESET_ALL_TUTORIALS.kind).toBe('Document')
    const body = (RESET_ALL_TUTORIALS as { loc?: { source: { body: string } } }).loc?.source.body || ''
    expect(body).toContain('resetAllTutorials')
    expect(body).toContain('tutorialState')
  })
})
