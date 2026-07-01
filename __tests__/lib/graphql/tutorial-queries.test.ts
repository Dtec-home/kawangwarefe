import { describe, it, expect } from 'vitest'
import {
  GET_TUTORIAL_STATE,
  GET_MY_TUTORIAL_STATE,
} from '@/lib/graphql/tutorial-queries'

describe('tutorial-queries', () => {
  it('exports GET_TUTORIAL_STATE as a DocumentNode selecting isTutorialCompleted', () => {
    expect(GET_TUTORIAL_STATE.kind).toBe('Document')
    const body = (GET_TUTORIAL_STATE as { loc?: { source: { body: string } } }).loc?.source.body || ''
    expect(body).toContain('isTutorialCompleted')
    expect(body).toContain('$tutorialKey')
  })

  it('exports GET_MY_TUTORIAL_STATE selecting the completedTutorials field', () => {
    expect(GET_MY_TUTORIAL_STATE.kind).toBe('Document')
    const body = (GET_MY_TUTORIAL_STATE as { loc?: { source: { body: string } } }).loc?.source.body || ''
    expect(body).toContain('myTutorialState')
    expect(body).toContain('completedTutorials')
  })
})
