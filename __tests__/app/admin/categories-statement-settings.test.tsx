/**
 * Categories page — Cash Statement settings (T1.8 / spec 03 §2.2):
 * "Trust fund" switch and "Statement order" on create and edit.
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
          { id: '1', name: 'Tithe', code: 'TITHE', description: '', isActive: true, routingMode: 'TOP_LEVEL', isTrustFund: true, statementOrder: 10 },
          { id: '2', name: 'Church Budget', code: 'BUDGET', description: '', isActive: true, routingMode: 'TOP_LEVEL', isTrustFund: false, statementOrder: 200 },
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

describe('Categories page — Cash Statement settings', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockUpdate.mockReset()
    toastMock.error.mockReset()
  })

  it('shows a Trust/Local badge and the statement order for each department', () => {
    render(<CategoryManagementPage />)
    expect(screen.getByText('Trust')).toBeInTheDocument()
    expect(screen.getByText('Local')).toBeInTheDocument()
    expect(screen.getByText('Order 10')).toBeInTheDocument()
    expect(screen.getByText('Order 200')).toBeInTheDocument()
  })

  it('create form sends isTrustFund and statementOrder', async () => {
    mockCreate.mockResolvedValue({ data: { createCategory: { success: true, message: 'Created' } } })
    render(<CategoryManagementPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Add Department/i })[0])

    fireEvent.change(screen.getByLabelText('Department Name *'), { target: { value: 'Camp Offering' } })
    expect(screen.getByText(/Lower numbers appear first on the Cash Statement/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: /Trust fund \(remitted to conference\)/ }))
    fireEvent.change(screen.getByLabelText('Statement order'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Department' }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    const { variables } = mockCreate.mock.calls[0][0]
    expect(variables.isTrustFund).toBe(true)
    expect(variables.statementOrder).toBe(15)
  })

  it('defaults a new department to local with order 100', async () => {
    mockCreate.mockResolvedValue({ data: { createCategory: { success: true, message: 'Created' } } })
    render(<CategoryManagementPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Add Department/i })[0])
    fireEvent.change(screen.getByLabelText('Department Name *'), { target: { value: 'Welfare' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Department' }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    const { variables } = mockCreate.mock.calls[0][0]
    expect(variables.isTrustFund).toBe(false)
    expect(variables.statementOrder).toBe(100)
  })

  it('rejects an out-of-range statement order without calling the backend', () => {
    render(<CategoryManagementPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Add Department/i })[0])
    fireEvent.change(screen.getByLabelText('Department Name *'), { target: { value: 'Welfare' } })
    fireEvent.change(screen.getByLabelText('Statement order'), { target: { value: '40000' } })
    // submit directly: jsdom's constraint validation (max) would block a click
    fireEvent.submit(screen.getByRole('button', { name: 'Create Department' }).closest('form') as HTMLFormElement)

    expect(mockCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/Statement order must be a whole number between 0 and 32767/)).toBeInTheDocument()
  })

  it('edit form pre-fills and sends the flags', async () => {
    mockUpdate.mockResolvedValue({ data: { updateCategory: { success: true, message: 'Updated' } } })
    render(<CategoryManagementPage />)
    const titheRow = screen.getByText('Tithe').closest('div[class*="border"]') as HTMLElement
    fireEvent.click(within(titheRow).getByRole('button', { name: /^Edit$/i }))

    const trustSwitch = screen.getByRole('switch', { name: /Trust fund \(remitted to conference\)/ })
    expect(trustSwitch).toHaveAttribute('aria-checked', 'true')
    const order = screen.getByLabelText('Statement order') as HTMLInputElement
    expect(order.value).toBe('10')

    fireEvent.click(trustSwitch)
    fireEvent.change(order, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    const { variables } = mockUpdate.mock.calls[0][0]
    expect(variables).toMatchObject({ categoryId: '1', isTrustFund: false, statementOrder: 3 })
  })

  it('a treasurer (not admin) sends only the Cash Statement settings', async () => {
    roleMock.isAdmin = false
    roleMock.isTreasurer = true
    try {
      mockUpdate.mockResolvedValue({ data: { updateCategory: { success: true, message: 'Updated' } } })
      render(<CategoryManagementPage />)
      const titheRow = screen.getByText('Tithe').closest('div[class*="border"]') as HTMLElement
      fireEvent.click(within(titheRow).getByRole('button', { name: /^Edit$/i }))
      fireEvent.change(screen.getByLabelText('Statement order'), { target: { value: '5' } })
      fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
      expect(mockUpdate.mock.calls[0][0].variables).toEqual({ categoryId: '1', isTrustFund: true, statementOrder: 5 })
    } finally {
      roleMock.isAdmin = true
      roleMock.isTreasurer = false
    }
  })

  it('surfaces a backend refusal via toast', async () => {
    mockUpdate.mockResolvedValue({ data: { updateCategory: { success: false, message: 'Requires admin privileges' } } })
    render(<CategoryManagementPage />)
    const titheRow = screen.getByText('Tithe').closest('div[class*="border"]') as HTMLElement
    fireEvent.click(within(titheRow).getByRole('button', { name: /^Edit$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Requires admin privileges'))
  })
})

describe('Categories page — statement preview', () => {
  it('opens the Cash Statement columns preview from the header', () => {
    render(<CategoryManagementPage />)
    fireEvent.click(screen.getByRole('button', { name: /Statement preview/i }))
    expect(screen.getByText('Cash Statement columns')).toBeInTheDocument()
  })
})
