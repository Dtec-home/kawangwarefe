/**
 * Catch-up windows admin page (T2.8)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { mockOpen, mockClose, mockRefetch, state, toastMock } = vi.hoisted(() => ({
  mockOpen: vi.fn(),
  mockClose: vi.fn(),
  mockRefetch: vi.fn(),
  state: { unlocks: [] as unknown[], loading: false },
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: { activeEntryDateUnlocks: state.unlocks },
    loading: state.loading,
    error: undefined,
    refetch: mockRefetch,
  }),
  useMutation: (doc: { loc?: { source?: { body?: string } } }) => {
    const body = doc?.loc?.source?.body || ''
    return [body.includes('closeEntryDateUnlock') ? mockClose : mockOpen, { loading: false }]
  },
}))

vi.mock('sonner', () => ({ toast: toastMock }))

vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}))

const { protectedProps } = vi.hoisted(() => ({ protectedProps: { requiredAccess: '' as string | undefined } }))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children, requiredAccess }: { children: React.ReactNode; requiredAccess?: string }) => {
    protectedProps.requiredAccess = requiredAccess
    return <div>{children}</div>
  },
}))

import CatchUpWindowsPage from '@/app/(dashboard)/admin/catch-up-windows/page'

// 12:00 in Nairobi on 17 Sep 2026
const NOW = new Date('2026-09-17T09:00:00Z')

const window29Aug = {
  id: '7',
  unlockDate: '2026-08-29',
  reason: 'Internet outage during service',
  openedByName: 'Jane Admin',
  expiresAt: '2026-09-18T05:30:00Z',
  closedAt: null,
  createdAt: '2026-09-17T05:30:00Z',
  isActive: true,
}

function fillForm({ date, reason, hours }: { date?: string; reason?: string; hours?: string }) {
  if (date !== undefined) fireEvent.change(screen.getByLabelText('Date to open'), { target: { value: date } })
  if (reason !== undefined) fireEvent.change(screen.getByLabelText('Reason'), { target: { value: reason } })
  if (hours !== undefined) fireEvent.change(screen.getByLabelText('Duration (hours)'), { target: { value: hours } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /open catch-up window/i }))
}

describe('CatchUpWindowsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    mockOpen.mockReset()
    mockClose.mockReset()
    mockRefetch.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    state.unlocks = []
    state.loading = false
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('explains the no-backdating rule and is gated as staff', () => {
    render(<CatchUpWindowsPage />)
    expect(screen.getByRole('heading', { name: 'Catch-up windows' })).toBeInTheDocument()
    expect(screen.getByText(/Entries can only be recorded for today\. Open a catch-up window/)).toBeInTheDocument()
    expect(protectedProps.requiredAccess).toBe('staff')
  })

  it('limits the date picker to past Nairobi dates and defaults duration to 24h', () => {
    render(<CatchUpWindowsPage />)
    expect(screen.getByLabelText('Date to open')).toHaveAttribute('max', '2026-09-16')
    expect(screen.getByLabelText('Duration (hours)')).toHaveValue(24)
  })

  it('shows the empty state when no windows are open', () => {
    render(<CatchUpWindowsPage />)
    expect(screen.getByText('No open catch-up windows')).toBeInTheDocument()
  })

  it('blocks a future date', () => {
    render(<CatchUpWindowsPage />)
    fillForm({ date: '2026-09-18', reason: 'Internet outage during service' })
    submit()
    expect(screen.getByText(/Choose a past date/)).toBeInTheDocument()
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('blocks today', () => {
    render(<CatchUpWindowsPage />)
    fillForm({ date: '2026-09-17', reason: 'Internet outage during service' })
    submit()
    expect(screen.getByText(/Choose a past date/)).toBeInTheDocument()
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('blocks a reason shorter than 10 characters', () => {
    render(<CatchUpWindowsPage />)
    fillForm({ date: '2026-08-29', reason: 'outage' })
    submit()
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument()
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('blocks a duration outside 1–72 hours', () => {
    render(<CatchUpWindowsPage />)
    fillForm({ date: '2026-08-29', reason: 'Internet outage during service', hours: '73' })
    submit()
    expect(screen.getByText(/between 1 and 72/)).toBeInTheDocument()
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('opens a window with the right variables', async () => {
    mockOpen.mockResolvedValue({
      data: { openEntryDateUnlock: { success: true, message: 'Catch-up window opened', unlock: window29Aug } },
    })
    render(<CatchUpWindowsPage />)
    fillForm({ date: '2026-08-29', reason: '  Internet outage during service ', hours: '12' })
    submit()
    await waitFor(() => expect(mockOpen).toHaveBeenCalledWith({
      variables: { date: '2026-08-29', reason: 'Internet outage during service', hours: 12 },
    }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Catch-up window opened'))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows the backend refusal as an error toast (e.g. non-admin staff)', async () => {
    mockOpen.mockResolvedValue({
      data: { openEntryDateUnlock: { success: false, message: 'Only admins can manage catch-up windows', unlock: null } },
    })
    render(<CatchUpWindowsPage />)
    fillForm({ date: '2026-08-29', reason: 'Internet outage during service' })
    submit()
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Only admins can manage catch-up windows'))
  })

  it('lists active windows with date, reason, opener and time left', () => {
    state.unlocks = [window29Aug]
    render(<CatchUpWindowsPage />)
    expect(screen.getByText('Sat, 29 Aug 2026')).toBeInTheDocument()
    expect(screen.getByText('Internet outage during service')).toBeInTheDocument()
    expect(screen.getByText('Opened by Jane Admin')).toBeInTheDocument()
    expect(screen.getByText('Expires in 20h 30m')).toBeInTheDocument()
    expect(screen.queryByText('No open catch-up windows')).not.toBeInTheDocument()
  })

  it('closes a window', async () => {
    state.unlocks = [window29Aug]
    mockClose.mockResolvedValue({
      data: { closeEntryDateUnlock: { success: true, message: 'Catch-up window closed', unlock: { ...window29Aug, isActive: false } } },
    })
    render(<CatchUpWindowsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Close window for Sat, 29 Aug 2026' }))
    await waitFor(() => expect(mockClose).toHaveBeenCalledWith({ variables: { id: '7' } }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Catch-up window closed'))
    expect(mockRefetch).toHaveBeenCalled()
  })
})
