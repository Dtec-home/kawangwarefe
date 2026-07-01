import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children) }))
vi.mock('next/image', () => ({ default: ({ src, alt }: any) => React.createElement('img', { src, alt }) }))
vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: null, loading: false, error: null }),
  useMutation: () => [vi.fn(), { loading: false }],
}))
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: false, logout: vi.fn(), user: null }),
}))
vi.mock('@/components/layouts/bottom-nav', () => ({ BottomNav: () => React.createElement('div') }))
vi.mock('@/components/landing/navigation', () => ({ Navigation: () => React.createElement('nav') }))
vi.mock('@/components/forms/contribution-form', () => ({
  ContributionForm: ({ onSuccess }: any) => <div data-testid="contribution-form">Form</div>,
}))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

import ContributePage from '@/app/(public)/contribute/page'

describe('ContributePage', () => {
  it('renders the page with contribution form', () => {
    const { container } = render(<ContributePage />)
    expect(screen.getByTestId('contribution-form')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="contribution-form"]')).toBeInTheDocument()
  })

  it('renders page features', () => {
    render(<ContributePage />)
    expect(screen.getByText('M-Pesa gateway')).toBeInTheDocument()
  })
})
