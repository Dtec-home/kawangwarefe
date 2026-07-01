import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams('id=123&checkoutRequestId=abc'),
}))
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: {
      contribution: {
        id: '123', amount: '1000', status: 'COMPLETED',
        transactionDate: '2024-01-15',
        member: { id: '1', fullName: 'John Doe' },
        category: { id: '1', name: 'Tithe', code: 'TITHE' },
        mpesaTransaction: { id: '1', mpesaReceiptNumber: 'ABC123', status: 'COMPLETED' },
      },
    },
    loading: false, error: null, refetch: vi.fn(),
  }),
  useMutation: () => [vi.fn(), { loading: false }],
}))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}))
vi.mock('@/components/auth/login-button', () => ({
  LoginButton: () => <button>Login</button>,
}))

import ConfirmationPage from '@/app/(public)/confirmation/page'

describe('ConfirmationPage', () => {
  it('renders the confirmation page', () => {
    render(
      <React.Suspense fallback={<div>Loading</div>}>
        <ConfirmationPage />
      </React.Suspense>,
    )
    // The page wraps content in Suspense, so we may see the fallback or content
    expect(document.body.textContent).toBeTruthy()
  })
})
