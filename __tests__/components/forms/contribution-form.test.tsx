/**
 * ContributionForm Component Tests — input step rendering and validation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { ContributionForm } from '@/components/forms/contribution-form'
import { GET_CONTRIBUTION_CATEGORIES } from '@/lib/graphql/queries'
import { GET_PAYMENT_STATUS } from '@/lib/graphql/payment-status-query'

vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, disabled }: any) => {
    const React = require('react')
    return React.createElement('button', { onClick, type, disabled }, children)
  },
}))
vi.mock('@/components/ui/card', () => {
  const React = require('react')
  const div = ({ children }: any) => React.createElement('div', null, children)
  return { Card: div, CardContent: div, CardHeader: div, CardTitle: div, CardDescription: div }
})

// Mock child components that pull in Radix UI
vi.mock('@/components/forms/phone-input', () => ({
  PhoneInput: ({ register, error }: any) => {
    const React = require('react')
    return React.createElement('div', null,
      React.createElement('span', null, '+254'),
      React.createElement('input', { type: 'tel', placeholder: '797030300', ...(register ? register('phoneNumber') : {}) }),
      error ? React.createElement('p', null, error.message) : null
    )
  },
}))
vi.mock('@/components/forms/multi-category-selector', () => ({
  MultiCategorySelector: () => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'multi-category-selector' },
      React.createElement('label', null, 'Department')
    )
  },
}))
vi.mock('@/components/forms/contribution-summary', () => ({
  ContributionSummary: ({ onEdit, onConfirm }: any) => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'contribution-summary' },
      React.createElement('button', { onClick: onEdit }, 'Edit'),
      React.createElement('button', { onClick: onConfirm }, 'Confirm')
    )
  },
}))

const mocks = [
  {
    request: { query: GET_CONTRIBUTION_CATEGORIES },
    result: { data: { contributionCategories: [] } },
  },
  {
    request: { query: GET_PAYMENT_STATUS, variables: {} },
    result: { data: { paymentStatus: 'pending' } },
  },
]

function renderForm() {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ContributionForm />
    </MockedProvider>
  )
}

describe('ContributionForm — input step', () => {
  it('renders Make a Contribution heading', () => {
    renderForm()
    expect(screen.getByText(/make a contribution/i)).toBeInTheDocument()
  })

  it('renders phone number input with +254 prefix', () => {
    renderForm()
    expect(screen.getByText('+254')).toBeInTheDocument()
  })

  it('renders Review Contribution button', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /review contribution/i })).toBeInTheDocument()
  })

  it('renders at least one department label', () => {
    renderForm()
    // Check for the mocked MultiCategorySelector by its label
    expect(screen.getByText('Department')).toBeInTheDocument()
  })

  it('shows validation error when Review is clicked with empty phone', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /review contribution/i }))
    await waitFor(() => {
      expect(screen.queryAllByText(/valid.*9.digit|9.digit.*phone/i).length).toBeGreaterThan(0)
    })
  })

  it('stays on input step when phone is invalid', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /review contribution/i }))
    await waitFor(() => {
      expect(screen.getByText(/make a contribution/i)).toBeInTheDocument()
    })
  })
})
