/**
 * Public confirmation page.
 *
 * The backend redacts the giver for anyone who is not the giver (nor staff nor
 * a scoped department admin): phone / member # / M-Pesa code come back null or
 * "", and the full name is cut to the first name. These tests pin that the page
 * renders no empty rows in that case, still shows the system receipt number
 * (the giver's proof of the gift), and shows everything for the giver.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

let mockSearchParams = new URLSearchParams('id=123')
let mockQueryData: Record<string, unknown> | null = null
let mockAuthenticated = false

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}))
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: mockQueryData, loading: false, error: null, refetch: vi.fn() }),
  useMutation: () => [vi.fn(), { loading: false }],
}))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthenticated, isLoading: false }),
}))
vi.mock('@/components/auth/login-button', () => ({
  LoginButton: () => <button>Login</button>,
}))
vi.mock('@/components/layouts/member-layout', () => ({
  MemberLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import ConfirmationPage from '@/app/(public)/confirmation/page'

const redactedContribution = {
  id: '123',
  amount: '1500',
  status: 'completed',
  transactionDate: '2026-09-01T10:00:00Z',
  notes: '',
  isCompleted: true,
  // Blanked by the backend for a viewer who is not the giver:
  departmentMemberIdentifier: '',
  receiptNumber: '20260901-0007',
  member: { id: '1', fullName: 'John', phoneNumber: null, memberNumber: null },
  category: { id: '1', name: 'Welfare', code: 'WELFARE', description: '' },
  mpesaTransaction: {
    id: '1',
    mpesaReceiptNumber: null,
    phoneNumber: '',
    status: 'completed',
    resultDesc: null,
  },
}

const fullContribution = {
  ...redactedContribution,
  departmentMemberIdentifier: 'W-0099',
  member: {
    id: '1',
    fullName: 'John Doe',
    phoneNumber: '254712345678',
    memberNumber: 'M-0001',
  },
  mpesaTransaction: {
    id: '1',
    mpesaReceiptNumber: 'QGH7ABC123',
    phoneNumber: '254712345678',
    status: 'completed',
    resultDesc: null,
  },
}

beforeEach(() => {
  mockSearchParams = new URLSearchParams('id=123')
  mockQueryData = null
  mockAuthenticated = false
})

describe('ConfirmationPage — single contribution, giver redacted', () => {
  beforeEach(() => {
    mockQueryData = { contribution: redactedContribution }
    render(<ConfirmationPage />)
  })

  it('shows the system receipt number prominently as proof of the gift', () => {
    expect(screen.getByText('Receipt No.')).toBeInTheDocument()
    expect(screen.getByText('20260901-0007')).toBeInTheDocument()
  })

  it('shows the giver first name with no phone line', () => {
    expect(screen.getByText('Giver')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('254')
  })

  it('renders no M-Pesa receipt row when the code is withheld', () => {
    expect(screen.queryByText('M-Pesa Receipt')).not.toBeInTheDocument()
    expect(screen.queryByText('QGH7ABC123')).not.toBeInTheDocument()
  })

  it('renders no department member # row when it is blanked', () => {
    expect(screen.queryByText(/member #/i)).not.toBeInTheDocument()
  })

  it('still shows the amount, department and status', () => {
    expect(screen.getByText('KES 1,500')).toBeInTheDocument()
    expect(screen.getByText('Welfare')).toBeInTheDocument()
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument()
  })
})

describe('ConfirmationPage — single contribution, viewed by the giver', () => {
  beforeEach(() => {
    mockAuthenticated = true
    mockQueryData = { contribution: fullContribution }
    render(<ConfirmationPage />)
  })

  it('shows the full name and phone number', () => {
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('254712345678')).toBeInTheDocument()
  })

  it('shows the M-Pesa receipt code', () => {
    expect(screen.getByText('M-Pesa Receipt')).toBeInTheDocument()
    expect(screen.getByText('QGH7ABC123')).toBeInTheDocument()
  })

  it('shows the department member number', () => {
    expect(screen.getByText('Welfare member #')).toBeInTheDocument()
    expect(screen.getByText('W-0099')).toBeInTheDocument()
  })

  it('still shows the system receipt number', () => {
    expect(screen.getByText('20260901-0007')).toBeInTheDocument()
  })
})

describe('ConfirmationPage — single contribution with no receipt yet', () => {
  it('omits the receipt panel entirely', () => {
    mockQueryData = {
      contribution: { ...redactedContribution, status: 'pending', receiptNumber: null },
    }
    render(<ConfirmationPage />)
    expect(screen.queryByText('Receipt No.')).not.toBeInTheDocument()
    expect(screen.getByText('Payment Pending')).toBeInTheDocument()
  })
})

describe('ConfirmationPage — checkout-id mode with several contributions', () => {
  const line = (
    id: string,
    amount: string,
    category: { id: string; name: string },
  ) => ({
    id,
    amount,
    status: 'completed',
    transactionDate: '2026-09-01T10:00:00Z',
    purposeName: null,
    departmentMemberIdentifier: '',
    contributionGroupId: 'grp-1',
    receiptNumber: '20260901-0009',
    member: { id: '1', fullName: 'Mary', phoneNumber: null },
    category,
    mpesaTransaction: { id: '1', mpesaReceiptNumber: null, status: 'completed', resultDesc: null },
  })

  beforeEach(() => {
    mockSearchParams = new URLSearchParams('checkoutRequestId=ws_CO_123')
    mockQueryData = {
      contributionsByCheckoutId: [
        line('1', '500', { id: '1', name: 'Tithe' }),
        line('2', '300', { id: '2', name: 'Offering' }),
        line('3', '200', { id: '3', name: 'Welfare' }),
      ],
    }
    render(<ConfirmationPage />)
  })

  it('totals the lines and lists each in the breakdown', () => {
    expect(screen.getByText('KES 1,000')).toBeInTheDocument()
    expect(screen.getByText('Breakdown')).toBeInTheDocument()
    expect(screen.getByText('KES 500')).toBeInTheDocument()
    expect(screen.getByText('KES 300')).toBeInTheDocument()
    expect(screen.getByText('KES 200')).toBeInTheDocument()
  })

  it('shows the shared receipt number once', () => {
    expect(screen.getByText('Receipt No.')).toBeInTheDocument()
    expect(screen.getByText('20260901-0009')).toBeInTheDocument()
  })

  it('redacts the giver to a first name and hides the M-Pesa code', () => {
    expect(screen.getByText('Mary')).toBeInTheDocument()
    expect(screen.queryByText('M-Pesa Receipt')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('254')
  })

  it('keeps the checkout reference visible', () => {
    expect(screen.getByText('ws_CO_123')).toBeInTheDocument()
  })
})

describe('ConfirmationPage — checkout-id mode with per-line receipts', () => {
  it('lists every distinct receipt number', () => {
    const autoSplitLine = (id: string, receiptNumber: string, purposeName: string) => ({
      id,
      amount: '500',
      status: 'completed',
      transactionDate: '2026-09-01T10:00:00Z',
      purposeName,
      departmentMemberIdentifier: '',
      contributionGroupId: 'grp-2',
      receiptNumber,
      member: { id: '1', fullName: 'Mary', phoneNumber: null },
      category: { id: '1', name: 'Youth' },
      mpesaTransaction: { id: '1', mpesaReceiptNumber: null, status: 'completed', resultDesc: null },
    })
    mockSearchParams = new URLSearchParams('checkoutRequestId=ws_CO_9')
    mockQueryData = {
      contributionsByCheckoutId: [
        autoSplitLine('1', '20260901-0010', 'Camp meeting'),
        autoSplitLine('2', '20260901-0011', 'Building fund'),
      ],
    }
    render(<ConfirmationPage />)
    expect(screen.getByText('Receipt Nos.')).toBeInTheDocument()
    expect(screen.getByText('20260901-0010 · 20260901-0011')).toBeInTheDocument()
    // One category, two lines => the auto-split view keyed on purpose names
    expect(screen.getByText('Auto-split breakdown')).toBeInTheDocument()
    expect(screen.getByText('Camp meeting')).toBeInTheDocument()
    expect(screen.getByText('Building fund')).toBeInTheDocument()
  })
})

describe('ConfirmationPage — no parameters', () => {
  it('shows the invalid-request card', () => {
    mockSearchParams = new URLSearchParams('')
    render(<ConfirmationPage />)
    expect(screen.getByText('Invalid Request')).toBeInTheDocument()
  })
})
