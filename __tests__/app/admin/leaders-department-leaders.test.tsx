/**
 * Leaders page — department leaders are read-only here (R3): their profile
 * lives on the Dept. Admins assignment, so the row shows a "Department leader"
 * badge and a link to Dept. Admins instead of edit / delete.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

// Stable data: the page copies `data.leaders` into state in an effect.
const { LEADERS_DATA, CATEGORIES_DATA } = vi.hoisted(() => ({
  LEADERS_DATA: {
    leaders: [
      { id: 'l1', name: 'Rev. Grace', title: 'Senior Pastor', bio: null, photoUrl: null, email: null, phone: null, displayOrder: 0, isActive: true, category: null, isDepartmentLeader: false },
      { id: 'l2', name: 'John Kamau', title: 'Head Elder', bio: 'Serves.', photoUrl: null, email: null, phone: '254712345678', displayOrder: 1, isActive: true, category: { id: '9', name: 'Elders' }, isDepartmentLeader: true },
    ],
  },
  CATEGORIES_DATA: { contributionCategories: [{ id: '9', name: 'Elders' }] },
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: (query: { loc?: { source?: { body?: string } } }) => {
    const body = query?.loc?.source?.body || ''
    if (body.includes('leaders(')) return { data: LEADERS_DATA, loading: false, refetch: vi.fn() }
    return { data: CATEGORIES_DATA, loading: false, refetch: vi.fn() }
  },
  useMutation: () => [vi.fn(), { loading: false }],
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/hooks/use-tour', () => ({ useTour: () => ({ start: vi.fn(), isReady: false }) }))
vi.mock('@/hooks/use-confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(), ConfirmDialog: () => null }),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import LeadersManagementPage from '@/app/(dashboard)/admin/leaders/page'
import { GET_LEADERS } from '@/lib/graphql/leaders'

const rowOf = (name: string) => screen.getByText(name).closest('div.border') as HTMLElement

describe('Leaders page — department leaders (R3)', () => {
  it('asks whether each leader is a department leader', () => {
    const body = (GET_LEADERS as { loc?: { source?: { body?: string } } }).loc?.source?.body || ''
    expect(body).toContain('isDepartmentLeader')
  })

  it('marks a department leader and links to Dept. Admins instead of edit/delete', () => {
    render(<LeadersManagementPage />)
    const row = rowOf('John Kamau')
    expect(within(row).getByText('Department leader')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Edit under Dept. Admins' })).toHaveAttribute('href', '/admin/category-admins')
    expect(within(row).queryByRole('button', { name: /^Edit$/ })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /Deactivate|Activate/ })).not.toBeInTheDocument()
  })

  it('keeps edit and delete for a standalone website profile', () => {
    render(<LeadersManagementPage />)
    const row = rowOf('Rev. Grace')
    expect(within(row).queryByText('Department leader')).not.toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /^Edit$/ })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /Delete/ })).toBeInTheDocument()
  })
})
