/**
 * R2: every place money gets a destination offers only departments that accept
 * giving (`contributionCategories(forGiving: true)`), while admin lists keep
 * showing every department.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

import { CategorySelect } from '@/components/forms/category-select'
import { GET_GIVING_CATEGORIES } from '@/lib/graphql/queries'
import { PLEDGE_TARGETS } from '@/lib/graphql/fundraising/member-pledges'

const root = path.resolve(__dirname, '../../..')
const source = (file: string) => readFileSync(path.join(root, file), 'utf8')

const GIVING_PICKERS = [
  'components/forms/contribution-form.tsx',
  'components/forms/multi-category-selector.tsx',
  'components/forms/category-select.tsx',
  'components/recorder/record-gift-form.tsx',
  'components/campaigns/admin/form/use-campaign-departments.ts',
  'components/fund-transfers/move-gift-dialog.tsx',
  'app/(dashboard)/admin/c2b-transactions/page.tsx',
]

const ADMIN_LISTS = [
  'app/(dashboard)/admin/reports/page.tsx',
  'app/(dashboard)/admin/expenses/page.tsx',
  'app/(dashboard)/admin/contributions/page.tsx',
  'components/fund-transfers/fund-transfers-view.tsx',
  'app/(dashboard)/admin/category-admins/page.tsx',
  'app/(dashboard)/profile/page.tsx',
]

describe('giving pickers use GET_GIVING_CATEGORIES (R2)', () => {
  it.each(GIVING_PICKERS)('%s', (file) => {
    const src = source(file)
    expect(src).toContain('GET_GIVING_CATEGORIES')
    expect(src).not.toContain('GET_CONTRIBUTION_CATEGORIES')
  })

  it.each(ADMIN_LISTS)('admin list %s keeps every department', (file) => {
    const src = source(file)
    expect(src).not.toContain('GET_GIVING_CATEGORIES')
  })

  it('pledge targets ask only for giving departments', () => {
    const body = (PLEDGE_TARGETS as { loc?: { source?: { body?: string } } }).loc?.source?.body || ''
    expect(body).toMatch(/contributionCategories\(isActive: true, forGiving: true\)/)
  })
})

describe('CategorySelect', () => {
  it('lists the departments that accept giving', async () => {
    const tithe = {
      id: '1', name: 'Tithe', code: 'TITHE', description: '', isActive: true, routingMode: 'TOP_LEVEL',
      fallbackIfNoGroup: 'TOP_LEVEL', audience: 'all', hasAutoSplit: false, tracksMemberIdentifier: false,
      identifierLabel: '', identifierFormat: '', allowedGroups: [],
    }
    render(
      <MockedProvider
        mocks={[{ request: { query: GET_GIVING_CATEGORIES }, result: { data: { contributionCategories: [tithe] } } }]}
      >
        <CategorySelect name="categoryId" label="Department" value="1" onChange={() => {}} />
      </MockedProvider>,
    )
    expect(await screen.findByText('Tithe')).toBeInTheDocument()
  })
})
