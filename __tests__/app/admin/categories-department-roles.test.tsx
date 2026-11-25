/**
 * Categories page — "Show in giving" and "Writes a yearly report" (R1):
 * two switches with one-line help on create and inline edit, and list badges.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { mockCreate, mockUpdate, toastMock, roleMock } = vi.hoisted(() => ({
  roleMock: { isAdmin: true, isTreasurer: false },
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: (query: { loc?: { source?: { body?: string } } }) => {
    const body = query?.loc?.source?.body || ''
    if (body.includes('groupsList')) return { data: { groupsList: [] }, loading: false, refetch: vi.fn() }
    if (body.includes('statementColumns')) return { data: undefined, loading: false, refetch: vi.fn() }
    return {
      data: {
        contributionCategories: [
          { id: '1', name: 'Tithe', code: 'TITHE', description: '', isActive: true, routingMode: 'TOP_LEVEL', isTrustFund: true, statementOrder: 10, acceptsGiving: true, filesYearlyReport: false },
          { id: '2', name: 'Elders', code: 'ELDERS', description: '', isActive: true, routingMode: 'TOP_LEVEL', isTrustFund: false, statementOrder: 300, acceptsGiving: false, filesYearlyReport: true },
          { id: '3', name: 'Youth', code: 'YOUTH', description: '', isActive: true, routingMode: 'TOP_LEVEL', isTrustFund: false, statementOrder: 200, acceptsGiving: true, filesYearlyReport: true },
        ],
      },
      loading: false,
      refetch: vi.fn(),
    }
  },
  useMutation: (doc: { loc?: { source?: { body?: string } } }) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('createCategory')) return [mockCreate, { loading: false }]
    if (body.includes('updateCategory(')) return [mockUpdate, { loading: false }]
    return [vi.fn(), { loading: false }]
  },
}))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => roleMock }))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/hooks/use-confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(), ConfirmDialog: () => null }),
}))

import CategoryManagementPage from '@/app/(dashboard)/admin/categories/page'
import { CREATE_CATEGORY, UPDATE_CATEGORY, GET_ALL_CATEGORIES } from '@/lib/graphql/category-mutations'

const GIVING_HELP = 'Members and the desk can choose it when giving. Turn off for departments like Elders that never receive money.'
const REPORT_HELP = 'Asked for a yearly department report.'

const rowOf = (name: string) => screen.getByText(name).closest('div[class*="border"]') as HTMLElement

describe('category documents carry the two switches', () => {
  it.each([
    ['CREATE_CATEGORY', CREATE_CATEGORY],
    ['UPDATE_CATEGORY', UPDATE_CATEGORY],
    ['GET_ALL_CATEGORIES', GET_ALL_CATEGORIES],
  ])('%s asks for acceptsGiving and filesYearlyReport', (_name, doc) => {
    const body = (doc as { loc?: { source?: { body?: string } } }).loc?.source?.body || ''
    expect(body).toContain('acceptsGiving')
    expect(body).toContain('filesYearlyReport')
  })
})

describe('Categories page — giving and yearly-report switches (R1)', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockUpdate.mockReset()
  })

  it('badges departments that are not in giving and those that write a yearly report', () => {
    render(<CategoryManagementPage />)
    expect(within(rowOf('Elders')).getByText('Not in giving')).toBeInTheDocument()
    expect(within(rowOf('Elders')).getByText('Yearly report')).toBeInTheDocument()
    expect(within(rowOf('Youth')).queryByText('Not in giving')).not.toBeInTheDocument()
    expect(within(rowOf('Youth')).getByText('Yearly report')).toBeInTheDocument()
    expect(within(rowOf('Tithe')).queryByText('Not in giving')).not.toBeInTheDocument()
    expect(within(rowOf('Tithe')).queryByText('Yearly report')).not.toBeInTheDocument()
  })

  it('create form shows both switches with help; defaults: in giving, no yearly report', async () => {
    mockCreate.mockResolvedValue({ data: { createCategory: { success: true, message: 'Created' } } })
    render(<CategoryManagementPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Add Department/i })[0])

    expect(screen.getByText(GIVING_HELP)).toBeInTheDocument()
    expect(screen.getByText(REPORT_HELP)).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Show in giving' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: 'Writes a yearly report' })).toHaveAttribute('aria-checked', 'false')

    fireEvent.change(screen.getByLabelText('Department Name *'), { target: { value: 'Welfare' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Department' }))
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate.mock.calls[0][0].variables).toMatchObject({ acceptsGiving: true, filesYearlyReport: false })
  })

  it('creates a reporting department that never receives money', async () => {
    mockCreate.mockResolvedValue({ data: { createCategory: { success: true, message: 'Created' } } })
    render(<CategoryManagementPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Add Department/i })[0])
    fireEvent.change(screen.getByLabelText('Department Name *'), { target: { value: 'Deacons' } })
    fireEvent.click(screen.getByRole('switch', { name: 'Show in giving' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Writes a yearly report' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create Department' }))
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate.mock.calls[0][0].variables).toMatchObject({ acceptsGiving: false, filesYearlyReport: true })
  })

  it('edit pre-fills the switches and sends them', async () => {
    mockUpdate.mockResolvedValue({ data: { updateCategory: { success: true, message: 'Updated' } } })
    render(<CategoryManagementPage />)
    fireEvent.click(within(rowOf('Elders')).getByRole('button', { name: /^Edit$/i }))

    const giving = screen.getByRole('switch', { name: 'Show in giving' })
    const report = screen.getByRole('switch', { name: 'Writes a yearly report' })
    expect(giving).toHaveAttribute('aria-checked', 'false')
    expect(report).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(giving)
    fireEvent.click(report)
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate.mock.calls[0][0].variables).toMatchObject({ categoryId: '2', acceptsGiving: true, filesYearlyReport: false })
  })

  it('a treasurer (not admin) cannot change the switches and does not send them', async () => {
    roleMock.isAdmin = false
    roleMock.isTreasurer = true
    try {
      mockUpdate.mockResolvedValue({ data: { updateCategory: { success: true, message: 'Updated' } } })
      render(<CategoryManagementPage />)
      fireEvent.click(within(rowOf('Elders')).getByRole('button', { name: /^Edit$/i }))
      expect(screen.getByRole('switch', { name: 'Show in giving' })).toBeDisabled()
      expect(screen.getByRole('switch', { name: 'Writes a yearly report' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
      const vars = mockUpdate.mock.calls[0][0].variables
      expect(vars).not.toHaveProperty('acceptsGiving')
      expect(vars).not.toHaveProperty('filesYearlyReport')
    } finally {
      roleMock.isAdmin = true
      roleMock.isTreasurer = false
    }
  })
})
