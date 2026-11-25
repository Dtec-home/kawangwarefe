/**
 * Binding for `department-roles/departments_and_leaders.feature` (R1-R3).
 *
 * Renders the real Departments, Dept. Admins and Leaders pages and the give
 * page's department picker. Apollo is answered by operation body (the server
 * side — forGiving filtering — is the backend's contract).
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

type Doc = { loc?: { source?: { body?: string } } }
const bodyOf = (doc: Doc) => doc?.loc?.source?.body || ''

const { world } = vi.hoisted(() => ({
  world: {
    // Every department, as admin lists see them.
    departments: [] as Record<string, unknown>[],
    // What `contributionCategories(forGiving: true)` answers.
    givingDepartments: [] as Record<string, unknown>[],
    categoryAdmins: [] as Record<string, unknown>[],
    members: [] as Record<string, unknown>[],
    leaders: { leaders: [] as Record<string, unknown>[] },
    queried: [] as string[],
    mutations: [] as { body: string; variables: Record<string, unknown> }[],
  },
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: Doc) => {
    const body = bodyOf(doc)
    world.queried.push(body)
    const ok = (data: unknown) => ({ data, loading: false, error: null, refetch: vi.fn() })
    if (body.includes('leaders(')) return ok(world.leaders)
    if (body.includes('departmentPurposes')) return ok({ departmentPurposes: [] })
    if (body.includes('groupsList')) return ok({ groupsList: [] })
    if (body.includes('statementColumns')) return ok(undefined)
    if (body.includes('forGiving: true')) return ok({ contributionCategories: world.givingDepartments })
    return ok({
      contributionCategories: world.departments,
      categoryAdmins: world.categoryAdmins,
      membersList: { items: world.members, total: world.members.length, hasMore: false },
    })
  },
  useMutation: (doc: Doc, options?: { onCompleted?: (d: unknown) => void }) => {
    const body = bodyOf(doc)
    const run = async ({ variables }: { variables: Record<string, unknown> }) => {
      world.mutations.push({ body, variables })
      const field = body.match(/{\s*(\w+)\(/)?.[1] ?? 'result'
      const data = { [field]: { success: true, message: 'Saved' } }
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

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/hooks/use-tour', () => ({ useTour: () => ({ start: vi.fn(), isReady: false }) }))
vi.mock('@/hooks/use-confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(), ConfirmDialog: () => null }),
}))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => ({ isAdmin: true, isTreasurer: false, isStaff: true }) }))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import CategoryManagementPage from '@/app/(dashboard)/admin/categories/page'
import CategoryAdminsPage from '@/app/(dashboard)/admin/category-admins/page'
import LeadersManagementPage from '@/app/(dashboard)/admin/leaders/page'
import { MultiCategorySelector } from '@/components/forms/multi-category-selector'

const feature = loadFeature('./departments_and_leaders.feature', { loadRelativePath: true })

const department = (id: string, name: string, acceptsGiving: boolean, filesYearlyReport: boolean) => ({
  id, name, code: name.toUpperCase(), description: '', isActive: true, routingMode: 'TOP_LEVEL',
  fallbackIfNoGroup: 'TOP_LEVEL', audience: 'all', hasAutoSplit: false, tracksMemberIdentifier: false,
  identifierLabel: '', identifierFormat: '', isTrustFund: false, statementOrder: 100, allowedGroups: [],
  acceptsGiving, filesYearlyReport,
})

const rowOf = (name: string) => screen.getAllByText(name)[0].closest('div[class*="border"]') as HTMLElement

defineFeature(feature, (test) => {
  beforeEach(() => {
    cleanup()
    world.departments = []
    world.givingDepartments = []
    world.categoryAdmins = []
    world.members = []
    world.leaders = { leaders: [] }
    world.queried = []
    world.mutations = []
  })

  test('The admin marks Elders as a reporting department that takes no money', ({ given, when, then }) => {
    given(/^the department "(.*)" is in giving and writes no yearly report$/, (name: string) => {
      world.departments = [department('9', name, true, false)]
    })
    when(/^the admin turns off "(.*)" and turns on "(.*)" for "(.*)"$/, async (giving: string, report: string, name: string) => {
      render(<CategoryManagementPage />)
      fireEvent.click(within(rowOf(name)).getByRole('button', { name: /^Edit$/i }))
      fireEvent.click(screen.getByRole('switch', { name: giving }))
      fireEvent.click(screen.getByRole('switch', { name: report }))
      fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    })
    then('the department is saved with giving off and the yearly report on', async () => {
      await waitFor(() => expect(world.mutations.find((m) => m.body.includes('updateCategory('))).toBeDefined())
      const saved = world.mutations.find((m) => m.body.includes('updateCategory('))!
      expect(saved.variables).toMatchObject({ categoryId: '9', acceptsGiving: false, filesYearlyReport: true })
    })
  })

  test('The list shows which departments are not in giving', ({ given, when, then }) => {
    given(/^the department "(.*)" is not in giving and writes a yearly report$/, (name: string) => {
      world.departments = [department('9', name, false, true)]
    })
    when('the admin opens the departments page', () => {
      render(<CategoryManagementPage />)
    })
    then(/^"(.*)" is badged "(.*)" and "(.*)"$/, (name: string, a: string, b: string) => {
      const row = rowOf(name)
      expect(within(row).getByText(a)).toBeInTheDocument()
      expect(within(row).getByText(b)).toBeInTheDocument()
    })
  })

  test('Elders is not offered on the give page', ({ given, when, then, and }) => {
    given(/^the departments "(.*)" \(in giving\) and "(.*)" \(not in giving\)$/, (giving: string, other: string) => {
      const tithe = department('1', giving, true, false)
      world.departments = [tithe, department('9', other, false, true)]
      world.givingDepartments = [tithe]
    })
    when('a member opens the give page', () => {
      render(<MultiCategorySelector contributions={[{ categoryId: '', amount: '' }]} onChange={vi.fn()} />)
    })
    then('the give page asks only for departments that accept giving', () => {
      const categoryQueries = world.queried.filter((b) => b.includes('contributionCategories'))
      expect(categoryQueries.length).toBeGreaterThan(0)
      for (const q of categoryQueries) expect(q).toContain('forGiving: true')
    })
    and(/^"(.*)" is not offered$/, async (name: string) => {
      expect(await screen.findByRole('option', { name: /Tithe/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: new RegExp(name) })).not.toBeInTheDocument()
    })
  })

  test('The admin sets a leader profile when assigning a department leader', ({ given, when, and, then }) => {
    given(/^the admin is assigning "(.*)" to "(.*)"$/, (member: string, dept: string) => {
      world.departments = [department('9', dept, false, true)]
      world.members = [{ id: 'm3', fullName: member, phoneNumber: '254700000003', memberNumber: null, email: null }]
      render(<CategoryAdminsPage />)
      const [memberSelect, departmentSelect] = screen.getAllByRole('combobox')
      fireEvent.change(memberSelect, { target: { value: 'm3' } })
      fireEvent.change(departmentSelect, { target: { value: '9' } })
    })
    when(/^they fill the leader profile with title "(.*)" shown on the website$/, (title: string) => {
      const section = screen.getByRole('group', { name: 'Leader profile' })
      fireEvent.change(within(section).getByLabelText('Title'), { target: { value: title } })
      expect(within(section).getByRole('switch', { name: 'Show on the website' })).toHaveAttribute('aria-checked', 'true')
    })
    and('they assign the leader', () => {
      fireEvent.click(screen.getByRole('button', { name: /Assign Admin/ }))
    })
    then('the assignment is saved with that profile', async () => {
      await waitFor(() => expect(world.mutations.find((m) => m.body.includes('assignCategoryAdmin('))).toBeDefined())
      const saved = world.mutations.find((m) => m.body.includes('assignCategoryAdmin('))!
      expect(saved.variables).toMatchObject({
        memberId: 'm3',
        categoryId: '9',
        profile: { title: 'Head Elder', showOnWebsite: true },
      })
    })
  })

  test('A department leader is read-only on the Leaders page', ({ given, when, then, and }) => {
    given(/^"(.*)" is a department leader with a website profile$/, (name: string) => {
      world.leaders = {
        leaders: [{
          id: 'l2', name, title: 'Head Elder', bio: null, photoUrl: null, email: null, phone: null,
          displayOrder: 1, isActive: true, category: { id: '9', name: 'Elders' }, isDepartmentLeader: true,
        }],
      }
    })
    when('the admin opens the Leaders page', () => {
      render(<LeadersManagementPage />)
    })
    then(/^"(.*)" is marked "(.*)"$/, (name: string, badge: string) => {
      expect(within(rowOf(name)).getByText(badge)).toBeInTheDocument()
    })
    and(/^the row links to "(.*)" instead of edit and delete$/, (link: string) => {
      const row = rowOf('John Kamau')
      expect(within(row).getByRole('link', { name: link })).toHaveAttribute('href', '/admin/category-admins')
      expect(within(row).queryByRole('button', { name: /^Edit$/ })).not.toBeInTheDocument()
      expect(within(row).queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    })
  })
})
