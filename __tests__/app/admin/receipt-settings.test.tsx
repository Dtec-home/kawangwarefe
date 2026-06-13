import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const setSequenceMock = vi.fn().mockResolvedValue({
  data: {
    setReceiptSequence: {
      success: true,
      message: 'Receipt sequence updated',
      sequence: { prefix: 'MB-', nextNumber: 2000, padding: 4, nextReceiptNumber: 'MB-2000' },
    },
  },
})

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn().mockImplementation(() => ({
    data: {
      nextReceiptNumber: {
        prefix: 'MB-',
        nextNumber: 1500,
        padding: 4,
        nextReceiptNumber: 'MB-1500',
      },
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn().mockImplementation(() => [setSequenceMock, { loading: false }]),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { memberId: 1 }, logout: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    isStaff: true,
    canAccessAdmin: true,
    canAccessFeature: () => true,
    isAuthenticated: true,
    loading: false,
    adminCategories: [],
  }),
}))

vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => <div data-testid="admin-layout">{children}</div>,
}))

vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

import ReceiptSettingsPage from '@/app/(dashboard)/admin/receipt-settings/page'

describe('ReceiptSettingsPage', () => {
  it('renders the heading and current next number', () => {
    render(<ReceiptSettingsPage />)
    expect(screen.getByText('Receipt Book Settings')).toBeInTheDocument()
    expect(screen.getByText('MB-1500')).toBeInTheDocument()
  })

  it('seeds the inputs from the current sequence', () => {
    render(<ReceiptSettingsPage />)
    expect(screen.getByLabelText('Prefix')).toHaveValue('MB-')
    expect(screen.getByLabelText('Next number')).toHaveValue(1500)
    expect(screen.getByLabelText('Padding (digits)')).toHaveValue(4)
  })

  it('submits updated sequence values', async () => {
    render(<ReceiptSettingsPage />)
    fireEvent.change(screen.getByLabelText('Next number'), { target: { value: '2000' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

    expect(await screen.findByText(/MB-2000/)).toBeInTheDocument()
    expect(setSequenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ nextNumber: 2000, prefix: 'MB-', padding: 4 }),
      })
    )
  })

  it('sends null prefix/padding when fields are cleared', async () => {
    render(<ReceiptSettingsPage />)
    fireEvent.change(screen.getByLabelText('Prefix'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Padding (digits)'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

    await screen.findByText(/MB-2000/)
    expect(setSequenceMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ prefix: null, padding: null }),
      })
    )
  })
})
