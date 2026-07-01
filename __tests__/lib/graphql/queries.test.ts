import { describe, it, expect } from 'vitest'
import {
  GET_CONTRIBUTION_CATEGORIES,
  GET_DEPARTMENT_PURPOSES,
  GET_PAYBILL_INSTRUCTION_MESSAGE,
  GET_MY_CONTRIBUTIONS,
  GET_CONTRIBUTION,
  GET_MEMBER_BY_PHONE,
} from '@/lib/graphql/queries'

describe('queries', () => {
  it('exports GET_CONTRIBUTION_CATEGORIES as DocumentNode', () => {
    expect(GET_CONTRIBUTION_CATEGORIES).toBeDefined()
    expect(GET_CONTRIBUTION_CATEGORIES.kind).toBe('Document')
  })

  it('GET_CONTRIBUTION_CATEGORIES contains contributionCategories query', () => {
    const body = (GET_CONTRIBUTION_CATEGORIES as any).loc?.source?.body || ''
    expect(body).toContain('contributionCategories')
  })

  it('exports GET_DEPARTMENT_PURPOSES as DocumentNode', () => {
    expect(GET_DEPARTMENT_PURPOSES).toBeDefined()
    expect(GET_DEPARTMENT_PURPOSES.kind).toBe('Document')
  })

  it('GET_DEPARTMENT_PURPOSES contains departmentPurposes query', () => {
    const body = (GET_DEPARTMENT_PURPOSES as any).loc?.source?.body || ''
    expect(body).toContain('departmentPurposes')
  })

  it('exports GET_PAYBILL_INSTRUCTION_MESSAGE as DocumentNode', () => {
    expect(GET_PAYBILL_INSTRUCTION_MESSAGE).toBeDefined()
    expect(GET_PAYBILL_INSTRUCTION_MESSAGE.kind).toBe('Document')
  })

  it('GET_PAYBILL_INSTRUCTION_MESSAGE contains paybillInstructionMessage query', () => {
    const body = (GET_PAYBILL_INSTRUCTION_MESSAGE as any).loc?.source?.body || ''
    expect(body).toContain('paybillInstructionMessage')
  })

  it('exports GET_MY_CONTRIBUTIONS as DocumentNode', () => {
    expect(GET_MY_CONTRIBUTIONS).toBeDefined()
    expect(GET_MY_CONTRIBUTIONS.kind).toBe('Document')
  })

  it('GET_MY_CONTRIBUTIONS contains myContributions query', () => {
    const body = (GET_MY_CONTRIBUTIONS as any).loc?.source?.body || ''
    expect(body).toContain('myContributions')
  })

  it('exports GET_CONTRIBUTION as DocumentNode', () => {
    expect(GET_CONTRIBUTION).toBeDefined()
    expect(GET_CONTRIBUTION.kind).toBe('Document')
  })

  it('GET_CONTRIBUTION contains contribution query', () => {
    const body = (GET_CONTRIBUTION as any).loc?.source?.body || ''
    expect(body).toContain('contribution')
  })

  it('exports GET_MEMBER_BY_PHONE as DocumentNode', () => {
    expect(GET_MEMBER_BY_PHONE).toBeDefined()
    expect(GET_MEMBER_BY_PHONE.kind).toBe('Document')
  })

  it('GET_MEMBER_BY_PHONE contains memberByPhone query', () => {
    const body = (GET_MEMBER_BY_PHONE as any).loc?.source?.body || ''
    expect(body).toContain('memberByPhone')
  })
})
