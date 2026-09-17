/**
 * Statement certification control (T5.3): status chip, Certify (treasurer /
 * admin) and Unlock (admin) dialogs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { state, certifyMock, unlockMock, refetchMock, toastMock, queryVars } = vi.hoisted(() => ({
  state: {
    role: { canManageBooks: true, isAdmin: false },
    certifications: [] as unknown[],
  },
  certifyMock: vi.fn(),
  unlockMock: vi.fn(),
  refetchMock: vi.fn().mockResolvedValue({}),
  toastMock: { success: vi.fn(), error: vi.fn() },
  queryVars: [] as unknown[],
}))

type GqlDoc = { loc?: { source?: { body?: string } } }

vi.mock('@apollo/client/react', () => ({
  useQuery: (_doc: GqlDoc, options: { variables?: unknown }) => {
    queryVars.push(options?.variables)
    return { data: { statementCertifications: state.certifications }, loading: false, error: undefined, refetch: refetchMock }
  },
  useMutation: (doc: GqlDoc) => {
    const body = doc?.loc?.source?.body || ''
    return [body.includes('unlockStatement') ? unlockMock : certifyMock, { loading: false }]
  },
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => state.role }))

import { StatementCertificationControl } from '@/components/treasury/statement-certification'

const certified = {
  id: '3',
  date: '2026-09-12',
  certifiedByName: 'Tom Treasurer',
  certifiedAt: '2026-09-12T15:30:00Z',
  isActive: true,
  unlockedAt: null,
  unlockedByName: null,
  unlockReason: '',
}

describe('StatementCertificationControl', () => {
  beforeEach(() => {
    state.role = { canManageBooks: true, isAdmin: false }
    state.certifications = []
    queryVars.length = 0
    for (const m of [certifyMock, unlockMock, toastMock.success, toastMock.error]) m.mockReset()
    refetchMock.mockClear()
  })

  it('shows "Not certified" and queries the single date', () => {
    render(<StatementCertificationControl date="2026-09-12" />)
    expect(screen.getByTestId('certification-status')).toHaveTextContent('Not certified')
    expect(queryVars).toContainEqual({ dateFrom: '2026-09-12', dateTo: '2026-09-12' })
  })

  it('shows who certified the date and when', () => {
    state.certifications = [certified]
    render(<StatementCertificationControl date="2026-09-12" />)
    expect(screen.getByTestId('certification-status')).toHaveTextContent(
      /Certified by Tom Treasurer on 12 Sept? 2026, 18:30/
    )
    expect(screen.queryByRole('button', { name: /Certify statement/ })).not.toBeInTheDocument()
  })

  it('treats an unlocked certification as not certified', () => {
    state.certifications = [{ ...certified, isActive: false, unlockedAt: '2026-09-13T08:00:00Z', unlockedByName: 'Ann Admin', unlockReason: 'Missed envelope found' }]
    render(<StatementCertificationControl date="2026-09-12" />)
    expect(screen.getByTestId('certification-status')).toHaveTextContent('Not certified (unlocked)')
    expect(screen.getByRole('button', { name: /Certify statement/ })).toBeInTheDocument()
  })

  it('certifies after a confirmation explaining the lock', async () => {
    certifyMock.mockResolvedValue({ data: { certifyStatement: { success: true, message: 'Statement certified', certification: certified } } })
    render(<StatementCertificationControl date="2026-09-12" />)
    fireEvent.click(screen.getByRole('button', { name: /Certify statement/ }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent(/Certify the statement for Sat,? 12 Sept? 2026\?/)
    expect(dialog).toHaveTextContent('no more manual entries can be recorded and no receipts can be voided')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Certify and lock' }))
    await waitFor(() => expect(certifyMock).toHaveBeenCalledWith({ variables: { date: '2026-09-12' } }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Statement certified'))
    expect(refetchMock).toHaveBeenCalled()
  })

  it('shows the backend refusal (e.g. open sessions on the date)', async () => {
    certifyMock.mockResolvedValue({
      data: { certifyStatement: { success: false, message: '2026-09-12 still has open collection sessions (Divine Service); close them before certifying', certification: null } },
    })
    render(<StatementCertificationControl date="2026-09-12" />)
    fireEvent.click(screen.getByRole('button', { name: /Certify statement/ }))
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Certify and lock' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(expect.stringContaining('still has open collection sessions')))
  })

  it('hides Certify from staff who cannot manage the books (e.g. a pastor)', () => {
    state.role = { canManageBooks: false, isAdmin: false }
    render(<StatementCertificationControl date="2026-09-12" />)
    expect(screen.getByTestId('certification-status')).toHaveTextContent('Not certified')
    expect(screen.queryByRole('button', { name: /Certify statement/ })).not.toBeInTheDocument()
  })

  it('offers Unlock to admins only', () => {
    state.certifications = [certified]
    const { unmount } = render(<StatementCertificationControl date="2026-09-12" />)
    expect(screen.queryByRole('button', { name: 'Unlock' })).not.toBeInTheDocument()
    unmount()
    state.role = { canManageBooks: true, isAdmin: true }
    render(<StatementCertificationControl date="2026-09-12" />)
    expect(screen.getByRole('button', { name: 'Unlock' })).toBeInTheDocument()
  })

  it('unlocks with a reason of at least 10 characters', async () => {
    state.role = { canManageBooks: true, isAdmin: true }
    state.certifications = [certified]
    unlockMock.mockResolvedValue({ data: { unlockStatement: { success: true, message: 'Statement unlocked', certification: null } } })
    render(<StatementCertificationControl date="2026-09-12" />)
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'typo' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Unlock statement' }))
    expect(await within(dialog).findByText(/at least 10 characters/)).toBeInTheDocument()
    expect(unlockMock).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: ' Envelope found after certification ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Unlock statement' }))
    await waitFor(() =>
      expect(unlockMock).toHaveBeenCalledWith({ variables: { date: '2026-09-12', reason: 'Envelope found after certification' } })
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Statement unlocked'))
  })
})
