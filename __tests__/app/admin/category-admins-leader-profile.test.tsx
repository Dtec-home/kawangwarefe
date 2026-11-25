/**
 * Dept. Admins page — one leader record (R3): the assignment carries the
 * leader profile (title, bio, photo, show on website, order). The assign form
 * sends it as `profile`; each row shows the title / website status and an
 * "Edit profile" dialog calls updateDepartmentLeaderProfile.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

type Doc = { loc?: { source?: { body?: string } } }
const bodyOf = (doc: Doc) => doc?.loc?.source?.body || ''

const { calls, results, toastMock } = vi.hoisted(() => ({
  calls: { assign: [] as unknown[], update: [] as unknown[] },
  results: {
    assign: { assignCategoryAdmin: { success: true, message: 'Assigned' } } as Record<string, unknown>,
    update: { updateDepartmentLeaderProfile: { success: true, message: 'Profile saved' } } as Record<string, unknown>,
  },
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

const ADMINS = [
  {
    id: 'ca1',
    member: { id: 'm1', fullName: 'John Kamau', phoneNumber: '254712345678', memberNumber: 'MEM001', email: null },
    category: { id: '9', name: 'Elders', code: 'ELDERS', description: '', isActive: true },
    assignedBy: null,
    assignedAt: '2025-01-15T08:00:00Z',
    isActive: true,
    profile: { title: 'Head Elder', bio: 'Serves the board.', photoUrl: 'https://x.test/j.jpg', showOnWebsite: true, displayOrder: 1 },
  },
  {
    id: 'ca2',
    member: { id: 'm2', fullName: 'Jane Wanjiku', phoneNumber: '254798765432', memberNumber: null, email: null },
    category: { id: '9', name: 'Elders', code: 'ELDERS', description: '', isActive: true },
    assignedBy: null,
    assignedAt: '2025-02-10T10:00:00Z',
    isActive: true,
    profile: null,
  },
]

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: {
      contributionCategories: [{ id: '9', name: 'Elders', code: 'ELDERS', description: '', isActive: true }],
      membersList: {
        items: [{ id: 'm3', fullName: 'Mary Atieno', phoneNumber: '254700000003', memberNumber: null, email: null }],
        total: 1,
        hasMore: false,
      },
      categoryAdmins: ADMINS,
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMutation: (doc: Doc, options?: { onCompleted?: (d: unknown) => void }) => {
    const body = bodyOf(doc)
    const which = body.includes('assignCategoryAdmin(') ? 'assign' : body.includes('updateDepartmentLeaderProfile(') ? 'update' : null
    const run = async (opts: { variables: unknown }) => {
      if (which) calls[which].push(opts.variables)
      const data = which ? results[which] : {}
      options?.onCompleted?.(data)
      return { data }
    }
    return [run, { loading: false }]
  },
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/hooks/use-tour', () => ({ useTour: () => ({ start: vi.fn(), isReady: false }) }))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import CategoryAdminsPage from '@/app/(dashboard)/admin/category-admins/page'
import {
  ASSIGN_CATEGORY_ADMIN,
  GET_CATEGORY_ADMINS,
  UPDATE_DEPARTMENT_LEADER_PROFILE,
} from '@/lib/graphql/category-admin-queries'

function chooseMemberAndDepartment() {
  const [member, department] = screen.getAllByRole('combobox')
  fireEvent.change(member, { target: { value: 'm3' } })
  fireEvent.change(department, { target: { value: '9' } })
}

describe('category-admin documents (R3 contract)', () => {
  it('GET_CATEGORY_ADMINS asks for the profile', () => {
    expect(bodyOf(GET_CATEGORY_ADMINS as Doc)).toMatch(/profile\s*{\s*title\s+bio\s+photoUrl\s+showOnWebsite\s+displayOrder\s*}/)
  })

  it('ASSIGN_CATEGORY_ADMIN passes a LeaderProfileInput', () => {
    const body = bodyOf(ASSIGN_CATEGORY_ADMIN as Doc)
    expect(body).toContain('$profile: LeaderProfileInput')
    expect(body).toContain('profile: $profile')
  })

  it('UPDATE_DEPARTMENT_LEADER_PROFILE takes the assignment id and the profile', () => {
    const body = bodyOf(UPDATE_DEPARTMENT_LEADER_PROFILE as Doc)
    expect(body).toContain('$categoryAdminId: ID!')
    expect(body).toContain('$profile: LeaderProfileInput!')
    expect(body).toContain('updateDepartmentLeaderProfile(categoryAdminId: $categoryAdminId, profile: $profile)')
  })
})

describe('Dept. Admins page — leader profile (R3)', () => {
  beforeEach(() => {
    calls.assign.length = 0
    calls.update.length = 0
    toastMock.success.mockReset()
    toastMock.error.mockReset()
  })

  it('assigns with a leader profile', async () => {
    render(<CategoryAdminsPage />)
    chooseMemberAndDepartment()
    const section = screen.getByRole('group', { name: 'Leader profile' })
    fireEvent.change(within(section).getByLabelText('Title'), { target: { value: 'Head Elder' } })
    fireEvent.change(within(section).getByLabelText('Bio'), { target: { value: 'Leads the elders.' } })
    fireEvent.change(within(section).getByLabelText('Photo URL'), { target: { value: 'https://x.test/m.jpg' } })
    fireEvent.change(within(section).getByLabelText('Order'), { target: { value: '2' } })
    expect(within(section).getByRole('switch', { name: 'Show on the website' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Assign Admin/ }))
    await waitFor(() => expect(calls.assign).toHaveLength(1))
    expect(calls.assign[0]).toEqual({
      memberId: 'm3',
      categoryId: '9',
      profile: { title: 'Head Elder', bio: 'Leads the elders.', photoUrl: 'https://x.test/m.jpg', showOnWebsite: true, displayOrder: 2 },
    })
  })

  it('assigns without a profile when none is filled in', async () => {
    render(<CategoryAdminsPage />)
    chooseMemberAndDepartment()
    fireEvent.click(screen.getByRole('button', { name: /Assign Admin/ }))
    await waitFor(() => expect(calls.assign).toHaveLength(1))
    expect(calls.assign[0]).toEqual({ memberId: 'm3', categoryId: '9', profile: null })
  })

  it('a leader can be kept off the website', async () => {
    render(<CategoryAdminsPage />)
    chooseMemberAndDepartment()
    const section = screen.getByRole('group', { name: 'Leader profile' })
    fireEvent.change(within(section).getByLabelText('Title'), { target: { value: 'Elder' } })
    fireEvent.click(within(section).getByRole('switch', { name: 'Show on the website' }))
    fireEvent.click(screen.getByRole('button', { name: /Assign Admin/ }))
    await waitFor(() => expect(calls.assign).toHaveLength(1))
    expect((calls.assign[0] as { profile: { showOnWebsite: boolean } }).profile.showOnWebsite).toBe(false)
  })

  it('shows each assignment\'s title and website status', () => {
    render(<CategoryAdminsPage />)
    const john = screen.getAllByTestId('leader-profile-status').find((el) => el.closest('[data-admin-id="ca1"]'))!
    expect(john).toHaveTextContent('Head Elder')
    expect(john).toHaveTextContent('On the website')
    const jane = screen.getAllByTestId('leader-profile-status').find((el) => el.closest('[data-admin-id="ca2"]'))!
    expect(jane).toHaveTextContent('No profile')
  })

  it('edits a profile from the row', async () => {
    render(<CategoryAdminsPage />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit profile for John Kamau' })[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Head Elder')
    expect(within(dialog).getByLabelText('Bio')).toHaveValue('Serves the board.')
    expect(within(dialog).getByLabelText('Photo URL')).toHaveValue('https://x.test/j.jpg')
    expect(within(dialog).getByLabelText('Order')).toHaveValue(1)

    fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: 'Senior Elder' } })
    fireEvent.click(within(dialog).getByRole('switch', { name: 'Show on the website' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))

    await waitFor(() => expect(calls.update).toHaveLength(1))
    expect(calls.update[0]).toEqual({
      categoryAdminId: 'ca1',
      profile: { title: 'Senior Elder', bio: 'Serves the board.', photoUrl: 'https://x.test/j.jpg', showOnWebsite: false, displayOrder: 1 },
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Profile saved'))
  })

  it('shows the server refusal and keeps the dialog open', async () => {
    results.update = { updateDepartmentLeaderProfile: { success: false, message: 'Only staff may change leader profiles' } }
    try {
      render(<CategoryAdminsPage />)
      fireEvent.click(screen.getAllByRole('button', { name: 'Edit profile for Jane Wanjiku' })[0])
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: 'Elder' } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Only staff may change leader profiles'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    } finally {
      results.update = { updateDepartmentLeaderProfile: { success: true, message: 'Profile saved' } }
    }
  })
})
