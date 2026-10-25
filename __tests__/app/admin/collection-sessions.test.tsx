/**
 * Collection sessions admin page (T5.3)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { state, confirmMock, refetchMock, toastMock, protectedProps } = vi.hoisted(() => ({
  state: {
    role: { canManageBooks: true },
    sessions: [] as unknown[],
    certifications: [] as unknown[],
    vars: [] as Array<{ doc: string; variables: unknown }>,
  },
  confirmMock: vi.fn(),
  refetchMock: vi.fn().mockResolvedValue({}),
  toastMock: { success: vi.fn(), error: vi.fn() },
  protectedProps: { requiredAccess: '' as string | undefined },
}))

type GqlDoc = { loc?: { source?: { body?: string } } }

vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: GqlDoc, options: { variables?: unknown }) => {
    const body = doc?.loc?.source?.body || ''
    state.vars.push({ doc: body.includes('statementCertifications') ? 'certs' : 'sessions', variables: options?.variables })
    if (body.includes('statementCertifications')) {
      return { data: { statementCertifications: state.certifications }, loading: false, refetch: vi.fn() }
    }
    return { data: { collectionSessions: state.sessions }, loading: false, error: undefined, refetch: refetchMock }
  },
  useMutation: () => [confirmMock, { loading: false }],
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => state.role }))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children, requiredAccess }: { children: React.ReactNode; requiredAccess?: string }) => {
    protectedProps.requiredAccess = requiredAccess
    return <div>{children}</div>
  },
}))

import CollectionSessionsPage from '@/app/(dashboard)/admin/collection-sessions/page'

function session(overrides: Record<string, unknown>) {
  return {
    id: '1',
    date: '2026-09-12',
    name: 'Divine Service',
    status: 'closed',
    openedByName: 'Rita Recorder',
    countedCash: '1500.00',
    countedBreakdown: [],
    varianceReason: '',
    recordedTotal: '1500.00',
    variance: '0.00',
    receiptCount: 12,
    closedByName: 'Rita Recorder',
    closedAt: '2026-09-12T11:00:00Z',
    confirmedByName: null,
    confirmedAt: null,
    createdAt: '2026-09-12T06:00:00Z',
    ...overrides,
  }
}

describe('CollectionSessionsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-17T09:00:00Z')) // Thu 17 Sep 2026, Nairobi
    state.role = { canManageBooks: true }
    state.sessions = []
    state.certifications = []
    state.vars = []
    confirmMock.mockReset()
    refetchMock.mockClear()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('is gated as staff and defaults to this church week', () => {
    render(<CollectionSessionsPage />)
    expect(protectedProps.requiredAccess).toBe('staff')
    expect(screen.getByRole('heading', { name: 'Collection sessions' })).toBeInTheDocument()
    expect(screen.getByLabelText('From')).toHaveValue('2026-09-13')
    expect(screen.getByLabelText('To')).toHaveValue('2026-09-19')
    expect(state.vars).toContainEqual({ doc: 'sessions', variables: { dateFrom: '2026-09-13', dateTo: '2026-09-19' } })
    expect(state.vars).toContainEqual({ doc: 'certs', variables: { dateFrom: '2026-09-13', dateTo: '2026-09-19' } })
    expect(screen.getByText('No collection sessions')).toBeInTheDocument()
  })

  it('moves to the previous week', () => {
    render(<CollectionSessionsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(screen.getByLabelText('From')).toHaveValue('2026-09-06')
    expect(screen.getByLabelText('To')).toHaveValue('2026-09-12')
  })

  it('lists sessions with highlighted variances and per-date certification', () => {
    state.sessions = [
      session({ id: '1', name: 'Divine Service', status: 'confirmed', confirmedByName: 'Tom Treasurer' }),
      session({ id: '2', name: 'Sabbath School', countedCash: '800.00', recordedTotal: '1000.00', variance: '-200.00', varianceReason: 'Change given to a visitor' }),
      session({ id: '3', date: '2026-09-13', name: 'Youth', status: 'open', countedCash: null, variance: null, recordedTotal: '300.00', receiptCount: 2 }),
      session({ id: '4', date: '2026-09-13', name: 'Evening', countedCash: '350.00', recordedTotal: '300.00', variance: '50.00', varianceReason: 'Late envelope not yet entered' }),
    ]
    state.certifications = [
      { id: '9', date: '2026-09-12', certifiedByName: 'Tom Treasurer', certifiedAt: '2026-09-12T15:30:00Z', isActive: true, unlockedAt: null, unlockedByName: null, unlockReason: '' },
    ]
    render(<CollectionSessionsPage />)

    expect(within(screen.getByTestId('date-row-2026-09-12')).getByTestId('certification-status')).toHaveTextContent(/Certified by Tom Treasurer/)
    expect(within(screen.getByTestId('date-row-2026-09-13')).getByTestId('certification-status')).toHaveTextContent('Not certified')
    // Newest date first
    const rows = screen.getAllByTestId(/^date-row-/)
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual(['date-row-2026-09-13', 'date-row-2026-09-12'])

    const short = screen.getByTestId('session-row-2')
    expect(within(short).getByText('−KES 200.00')).toHaveAttribute('data-variance', 'short')
    expect(short).toHaveTextContent('Change given to a visitor')
    expect(short).toHaveTextContent('KES 800.00')
    expect(within(screen.getByTestId('session-row-4')).getByText('+KES 50.00')).toHaveAttribute('data-variance', 'over')
    expect(screen.getByTestId('session-row-1')).toHaveTextContent('Confirmed')
    expect(screen.getByTestId('session-row-1')).toHaveTextContent('by Tom Treasurer')
    expect(screen.getByTestId('session-row-3')).toHaveTextContent('Open')
    expect(screen.getByTestId('session-row-3')).toHaveTextContent('Rita Recorder')

    // Confirm handover only for closed sessions
    expect(within(screen.getByTestId('session-row-1')).queryByRole('button')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('session-row-3')).queryByRole('button')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('session-row-2')).getByRole('button', { name: /Confirm handover/ })).toBeInTheDocument()
  })

  it('confirms the handover of a closed session', async () => {
    state.sessions = [session({ id: '2', name: 'Sabbath School' })]
    confirmMock.mockResolvedValue({ data: { confirmCollectionSession: { success: true, message: 'Collection session confirmed', session: null } } })
    render(<CollectionSessionsPage />)
    fireEvent.click(screen.getByRole('button', { name: /Confirm handover for Sabbath School/ }))
    await waitFor(() => expect(confirmMock).toHaveBeenCalledWith({ variables: { id: '2' } }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Collection session confirmed'))
    expect(refetchMock).toHaveBeenCalled()
  })

  it('shows a refusal from the backend', async () => {
    state.sessions = [session({ id: '2' })]
    confirmMock.mockResolvedValue({ data: { confirmCollectionSession: { success: false, message: 'Permission denied', session: null } } })
    render(<CollectionSessionsPage />)
    fireEvent.click(screen.getByRole('button', { name: /Confirm handover/ }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Permission denied'))
  })

  it('hides Confirm handover from staff who cannot manage the books', () => {
    state.role = { canManageBooks: false }
    state.sessions = [session({ id: '2' })]
    render(<CollectionSessionsPage />)
    expect(screen.queryByRole('button', { name: /Confirm handover/ })).not.toBeInTheDocument()
  })

  it('rejects an end date before the start date', () => {
    render(<CollectionSessionsPage />)
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } })
    expect(screen.getByRole('alert')).toHaveTextContent('The end date must not be before the start date')
  })
})
