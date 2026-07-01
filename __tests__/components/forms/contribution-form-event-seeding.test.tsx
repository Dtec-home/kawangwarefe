/**
 * ContributionForm — payable-event query-param seeding (regression coverage).
 *
 * Covers the existing (already-shipped) deep-link from a payable event's
 * "Give to this event" link: /contribute?categoryId=X&purposeId=Y&amount=500&eventId=Z
 * should seed the first contribution row on mount, and eventId should be
 * threaded through to the initiateMultiCategoryContribution mutation call
 * when the user submits.
 *
 * This lives in its own file (rather than alongside contribution-form.test.tsx)
 * because `vi.mock('next/navigation', ...)` is hoisted and applies to every
 * test in the module — it can't coexist with the other file's "no query
 * params" assumptions.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { ContributionForm } from '@/components/forms/contribution-form'
import { GET_CONTRIBUTION_CATEGORIES } from '@/lib/graphql/queries'
import { GET_PAYMENT_STATUS } from '@/lib/graphql/payment-status-query'
import { INITIATE_MULTI_CONTRIBUTION } from '@/lib/graphql/multi-contribution-mutations'

vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('next/navigation', () => ({
  useSearchParams: () =>
    new URLSearchParams({
      categoryId: 'cat-X',
      purposeId: 'purp-Y',
      amount: '500',
      eventId: 'evt-Z',
    }),
}))

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

// Expose the seeded first row's values so the seeding assertions don't need
// to reach into react-hook-form internals.
vi.mock('@/components/forms/multi-category-selector', () => ({
  MultiCategorySelector: ({ contributions }: any) => {
    const React = require('react')
    const first = (contributions && contributions[0]) || {}
    return React.createElement('div', { 'data-testid': 'multi-category-selector' },
      React.createElement('span', { 'data-testid': 'row0-categoryId' }, first.categoryId || ''),
      React.createElement('span', { 'data-testid': 'row0-purposeId' }, first.purposeId || ''),
      React.createElement('span', { 'data-testid': 'row0-amount' }, first.amount || '')
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

const baseMocks = [
  {
    request: { query: GET_CONTRIBUTION_CATEGORIES },
    result: { data: { contributionCategories: [] } },
  },
  {
    request: { query: GET_PAYMENT_STATUS, variables: {} },
    result: { data: { paymentStatus: 'pending' } },
  },
]

describe('ContributionForm — payable-event query-param seeding', () => {
  it('seeds the first contribution row from categoryId/purposeId/amount in the URL on mount', async () => {
    render(
      <MockedProvider mocks={baseMocks} addTypename={false}>
        <ContributionForm />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('row0-categoryId').textContent).toBe('cat-X')
      expect(screen.getByTestId('row0-purposeId').textContent).toBe('purp-Y')
      expect(screen.getByTestId('row0-amount').textContent).toBe('500')
    })
  })

  it('passes eventId through to the initiateMultiCategoryContribution mutation call on submit', async () => {
    let capturedVariables: any = undefined
    const mutationMocks = [
      ...baseMocks,
      {
        request: {
          query: INITIATE_MULTI_CONTRIBUTION,
          variables: {
            phoneNumber: '254797030300',
            contributions: [
              { categoryId: 'cat-X', amount: '500', purposeId: 'purp-Y', memberIdentifier: undefined },
            ],
            eventId: 'evt-Z',
          },
        },
        result: (variables: any) => {
          capturedVariables = variables
          return {
            data: {
              initiateMultiCategoryContribution: {
                success: true,
                message: 'OK',
                totalAmount: '500.00',
                contributionGroupId: 'grp-1',
                contributions: [],
                checkoutRequestId: 'ckrq-1',
                transactionId: 'txn-1',
              },
            },
          }
        },
      },
    ]

    render(
      <MockedProvider mocks={mutationMocks} addTypename={false}>
        <ContributionForm />
      </MockedProvider>
    )

    // Seeded row already has categoryId + amount; only the phone is missing.
    await waitFor(() => {
      expect(screen.getByTestId('row0-categoryId').textContent).toBe('cat-X')
    })

    const phoneInput = screen.getByPlaceholderText('797030300')
    fireEvent.change(phoneInput, { target: { value: '797030300' } })

    fireEvent.click(screen.getByRole('button', { name: /review contribution/i }))

    // Summary step is mocked — click "Confirm" to trigger handleConfirmSubmit.
    await waitFor(() => {
      expect(screen.getByTestId('contribution-summary')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(capturedVariables).toBeDefined()
    })
    expect(capturedVariables.eventId).toBe('evt-Z')
    expect(capturedVariables.phoneNumber).toBe('254797030300')
    expect(capturedVariables.contributions[0]).toMatchObject({
      categoryId: 'cat-X',
      purposeId: 'purp-Y',
      amount: '500',
    })
  })
})
