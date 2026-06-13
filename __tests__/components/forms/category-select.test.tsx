/**
 * CategorySelect tests.
 *
 * The component's logic is the loading/error/options wiring around a Radix
 * Select. We mock useQuery directly (per the use-user-role pattern) so we can
 * drive each branch deterministically without a portal-mounted dropdown.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const useQuery = vi.fn()
vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}))

import { CategorySelect } from '@/components/forms/category-select'

const baseProps = {
  name: 'category',
  value: '',
  onChange: vi.fn(),
}

beforeEach(() => {
  useQuery.mockReturnValue({ data: undefined, loading: false, error: undefined })
})

describe('CategorySelect', () => {
  it('renders the default "Department" label with a required asterisk', () => {
    render(<CategorySelect {...baseProps} />)
    expect(screen.getByText('Department')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('accepts a custom label and hides the asterisk when not required', () => {
    render(<CategorySelect {...baseProps} label="Fund" required={false} />)
    expect(screen.getByText('Fund')).toBeInTheDocument()
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows the loading placeholder while the query is in flight', () => {
    useQuery.mockReturnValue({ data: undefined, loading: true, error: undefined })
    render(<CategorySelect {...baseProps} />)
    expect(screen.getByText('Loading departments...')).toBeInTheDocument()
  })

  it('shows the default placeholder once loaded', () => {
    render(<CategorySelect {...baseProps} />)
    expect(screen.getByText('Select a department')).toBeInTheDocument()
  })

  it('renders a field validation error when provided', () => {
    render(
      <CategorySelect
        {...baseProps}
        error={{ type: 'required', message: 'Pick a department' } as never}
      />
    )
    expect(screen.getByText('Pick a department')).toBeInTheDocument()
  })

  it('renders a query error message when the categories fail to load', () => {
    useQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('network'),
    })
    render(<CategorySelect {...baseProps} />)
    expect(
      screen.getByText(/Error loading departments/i)
    ).toBeInTheDocument()
  })
})
