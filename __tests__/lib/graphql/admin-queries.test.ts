import { describe, it, expect } from 'vitest'
import {
  GET_ALL_CONTRIBUTIONS,
  GET_CONTRIBUTION_STATS,
  GET_DASHBOARD_STATS,
  GET_MEMBERS_LIST,
  GET_DEPARTMENT_ROUTING_REPORT,
  GET_GROUP_CONTRIBUTIONS,
  GET_MY_GROUP_NAMES,
} from '@/lib/graphql/admin-queries'

describe('admin-queries', () => {
  it('exports GET_ALL_CONTRIBUTIONS as DocumentNode', () => {
    expect(GET_ALL_CONTRIBUTIONS).toBeDefined()
    expect(GET_ALL_CONTRIBUTIONS.kind).toBe('Document')
  })

  it('GET_ALL_CONTRIBUTIONS contains allContributions query', () => {
    const body = (GET_ALL_CONTRIBUTIONS as any).loc?.source?.body || ''
    expect(body).toContain('allContributions')
  })

  it('exports GET_CONTRIBUTION_STATS as DocumentNode', () => {
    expect(GET_CONTRIBUTION_STATS).toBeDefined()
    expect(GET_CONTRIBUTION_STATS.kind).toBe('Document')
  })

  it('GET_CONTRIBUTION_STATS contains contributionStats query', () => {
    const body = (GET_CONTRIBUTION_STATS as any).loc?.source?.body || ''
    expect(body).toContain('contributionStats')
  })

  it('exports GET_DASHBOARD_STATS as DocumentNode', () => {
    expect(GET_DASHBOARD_STATS).toBeDefined()
    expect(GET_DASHBOARD_STATS.kind).toBe('Document')
  })

  it('GET_DASHBOARD_STATS contains dashboardStats query', () => {
    const body = (GET_DASHBOARD_STATS as any).loc?.source?.body || ''
    expect(body).toContain('dashboardStats')
  })

  it('exports GET_MEMBERS_LIST as DocumentNode', () => {
    expect(GET_MEMBERS_LIST).toBeDefined()
    expect(GET_MEMBERS_LIST.kind).toBe('Document')
  })

  it('GET_MEMBERS_LIST contains membersList query', () => {
    const body = (GET_MEMBERS_LIST as any).loc?.source?.body || ''
    expect(body).toContain('membersList')
  })

  it('exports GET_DEPARTMENT_ROUTING_REPORT as DocumentNode', () => {
    expect(GET_DEPARTMENT_ROUTING_REPORT).toBeDefined()
    expect(GET_DEPARTMENT_ROUTING_REPORT.kind).toBe('Document')
  })

  it('GET_DEPARTMENT_ROUTING_REPORT contains departmentRoutingReport query', () => {
    const body = (GET_DEPARTMENT_ROUTING_REPORT as any).loc?.source?.body || ''
    expect(body).toContain('departmentRoutingReport')
  })

  it('exports GET_GROUP_CONTRIBUTIONS as DocumentNode', () => {
    expect(GET_GROUP_CONTRIBUTIONS).toBeDefined()
    expect(GET_GROUP_CONTRIBUTIONS.kind).toBe('Document')
  })

  it('GET_GROUP_CONTRIBUTIONS contains groupContributions query', () => {
    const body = (GET_GROUP_CONTRIBUTIONS as any).loc?.source?.body || ''
    expect(body).toContain('groupContributions')
  })

  it('exports GET_MY_GROUP_NAMES as DocumentNode', () => {
    expect(GET_MY_GROUP_NAMES).toBeDefined()
    expect(GET_MY_GROUP_NAMES.kind).toBe('Document')
  })

  it('GET_MY_GROUP_NAMES contains myGroupNames query', () => {
    const body = (GET_MY_GROUP_NAMES as any).loc?.source?.body || ''
    expect(body).toContain('myGroupNames')
  })
})
