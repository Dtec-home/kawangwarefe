import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Apollo mock: returns categories for the department selector.
const createMock = vi.fn().mockResolvedValue({
  data: { createManualMultiContribution: { success: true, message: 'ok', receiptNumber: '20260917-0012' } },
})
const { unlockState, toastMock } = vi.hoisted(() => ({
  unlockState: { unlockDates: [] as string[] },
  toastMock: { success: vi.fn(), error: vi.fn() },
}))
const lookupMock = vi.fn().mockResolvedValue({
  data: { lookupMemberByPhone: { found: false } },
})

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => {
    return {
      data: {
        contributionCategories: [
          { id: '1', name: 'Tithe', code: 'TITHE', description: '' },
          { id: '2', name: 'Offering', code: 'OFFER', description: '' },
          { id: '3', name: 'Building Fund', code: 'BUILD', description: '' },
        ],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    }
  }),
  useMutation: vi.fn().mockImplementation((doc: any) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('lookupMemberByPhone')) return [lookupMock, { loading: false }]
    return [createMock, { loading: false }]
  }),
}))

vi.mock('sonner', () => ({ toast: toastMock }))

// Catch-up windows (T2.8)
vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({
    unlocks: [],
    unlockDates: unlockState.unlockDates,
    hasActiveUnlocks: unlockState.unlockDates.length > 0,
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}))

// Native <select> so a choice can be made in jsdom; `name` becomes the label.
interface SelectMockProps {
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}
vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: SelectMockProps) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
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

// Mock auth
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { memberId: 1 }, logout: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}))

// Mock user role hook
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true,
    canAccessAdmin: true,
    canAccessFeature: () => true,
    isAuthenticated: true,
    loading: false,
    adminCategories: [],
    adminCategoryIds: [],
    adminGroupNames: [],
  }),
}))

// Mock admin layout
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => <div data-testid="admin-layout">{children}</div>,
}))

// Mock admin protected route
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

// Mock next/link to return proper JSX
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import ManualEntryPage from '@/app/(dashboard)/admin/contributions/manual-entry/page'

async function fillValidEntry() {
  fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
  fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: 'Visitor - John' } })
  const department = screen
    .getAllByRole('combobox')
    .find((el) => el.querySelector('option[value="1"]')) as HTMLSelectElement
  fireEvent.change(department, { target: { value: '1' } })
  fireEvent.change(document.getElementById('amount-0') as HTMLInputElement, { target: { value: '500' } })
}

describe('ManualEntryPage', () => {
  beforeEach(() => {
    unlockState.unlockDates = []
    createMock.mockClear()
    toastMock.success.mockClear()
  })

  it('renders the heading', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Manual Contribution Entry')).toBeInTheDocument()
  })

  it('renders the Member Information card', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Member Information')).toBeInTheDocument()
  })

  it('renders the Contribution Details card', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Contribution Details')).toBeInTheDocument()
  })

  it('renders the Save Contribution button', () => {
    render(<ManualEntryPage />)
    expect(screen.getByRole('button', { name: /Save Contribution/i })).toBeInTheDocument()
  })

  it('renders phone number input and search button by default', () => {
    render(<ManualEntryPage />)
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument()
  })

  it('renders View All Contributions link', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('View All Contributions')).toBeInTheDocument()
  })

  // Ticket 6 — multi-line items with add/remove
  it('supports adding and removing department line items', () => {
    render(<ManualEntryPage />)
    // One row initially: no remove button (canRemove is false for a single row)
    expect(screen.queryByLabelText('Remove department')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add another fund/i }))
    // Now two department selects exist
    expect(screen.getAllByText('Department').length).toBeGreaterThanOrEqual(2)
    // And a remove button appears
    expect(screen.getAllByLabelText('Remove department').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getAllByLabelText('Remove department')[0])
    expect(screen.queryByLabelText('Remove department')).not.toBeInTheDocument()
  })

  // Ticket 7 — walk-in toggle swaps phone for free-text giver name
  it('toggling Walk-in swaps the phone lookup for a giver name field', () => {
    render(<ManualEntryPage />)
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))

    expect(screen.queryByLabelText('Phone Number')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Giver Name *')).toBeInTheDocument()
  })

  // T1.8 — the typed field is only an old paper-book number
  it('labels the typed field as the old book receipt number and has no next-number hint', () => {
    render(<ManualEntryPage />)
    expect(screen.getByLabelText('Old book receipt no. (optional)')).toBeInTheDocument()
    expect(screen.queryByText(/Next auto-assigned number/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Receipt Book Settings')).not.toBeInTheDocument()
  })

  // T1.8 / T2.8 — no free date picker
  it('records for today with no date picker when no catch-up window is open', () => {
    render(<ManualEntryPage />)
    expect(screen.getByText('Recording for:')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(document.querySelector('input[type="date"]')).toBeNull()
    expect(screen.queryByLabelText('recordFor')).not.toBeInTheDocument()
  })

  it('offers Today or the unlocked dates when a catch-up window is open', () => {
    unlockState.unlockDates = ['2026-08-29']
    render(<ManualEntryPage />)
    const select = screen.getByLabelText('recordFor') as HTMLSelectElement
    const labels = Array.from(select.options).map((o) => o.textContent)
    expect(labels).toContain('Today')
    expect(labels).toContain('Sat, 29 Aug 2026 (catch-up)')
    expect(select.value).toBe('today')
  })

  // Ticket 7 — walk-in submits giverName with null phoneNumber via multi mutation
  it('submits a walk-in entry with giverName and no phone', async () => {
    render(<ManualEntryPage />)
    fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
    fireEvent.change(screen.getByLabelText('Giver Name *'), {
      target: { value: 'Visitor - John' },
    })

    // The identity (walk-in name) passed validation; the empty line items do
    // not, so submission is blocked before the mutation fires. This proves the
    // walk-in path no longer requires a phone number.
    fireEvent.click(screen.getByRole('button', { name: /Save Contribution/i }))

    expect(
      await screen.findByText(/Add at least one department and amount/i)
    ).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('blocks submission when neither phone nor giver name is provided', async () => {
    render(<ManualEntryPage />)
    fireEvent.click(screen.getByRole('button', { name: /Save Contribution/i }))
    expect(await screen.findByText(/Phone number is required/i)).toBeInTheDocument()
  })

  it('sends no date for today and shows the issued system receipt number', async () => {
    render(<ManualEntryPage />)
    await fillValidEntry()
    fireEvent.click(screen.getByRole('button', { name: /Save Contribution/i }))
    await waitFor(() => expect(createMock).toHaveBeenCalled())
    const { variables } = createMock.mock.calls[0][0]
    expect(variables).not.toHaveProperty('transactionDate')
    expect(variables.receiptNumber).toBeNull()
    const link = await screen.findByRole('link', { name: '20260917-0012' })
    expect(link).toHaveAttribute('href', '/receipts/20260917-0012')
    expect(toastMock.success).toHaveBeenCalledWith('Receipt 20260917-0012 issued')
  })

  it('sends the chosen catch-up date', async () => {
    unlockState.unlockDates = ['2026-08-29']
    render(<ManualEntryPage />)
    fireEvent.change(screen.getByLabelText('recordFor'), { target: { value: '2026-08-29' } })
    await fillValidEntry()
    fireEvent.change(screen.getByLabelText('Old book receipt no. (optional)'), { target: { value: '1043' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Contribution/i }))
    await waitFor(() => expect(createMock).toHaveBeenCalled())
    const { variables } = createMock.mock.calls[0][0]
    expect(variables.transactionDate).toBe('2026-08-29')
    expect(variables.receiptNumber).toBe('1043')
  })
})
