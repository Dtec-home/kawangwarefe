import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContributionSummary } from '@/components/forms/contribution-summary'

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}))

const defaultProps = {
  phoneNumber: '254712345678',
  contributions: [
    { category: { id: '1', name: 'Tithe', code: 'TITHE' }, amount: '1000' },
    { category: { id: '2', name: 'Offering', code: 'OFFERING' }, amount: '2500' },
  ],
  totalAmount: '3500',
  onEdit: vi.fn(),
  onConfirm: vi.fn(),
}

describe('ContributionSummary', () => {
  it('renders title "Contribution Summary"', () => {
    render(<ContributionSummary {...defaultProps} />)
    expect(screen.getByText('Contribution Summary')).toBeDefined()
  })

  it('renders contribution items with category names', () => {
    render(<ContributionSummary {...defaultProps} />)
    expect(screen.getByText('Tithe')).toBeDefined()
    expect(screen.getByText('Offering')).toBeDefined()
  })

  it('formats amounts with comma separators', () => {
    render(<ContributionSummary {...defaultProps} />)
    expect(screen.getByText(/1,000/)).toBeDefined()
    expect(screen.getByText(/2,500/)).toBeDefined()
    expect(screen.getByText(/3,500/)).toBeDefined()
  })

  it('formats phone number from 254 format to 0 format', () => {
    render(<ContributionSummary {...defaultProps} />)
    expect(screen.getByText(/0712 345 678/)).toBeDefined()
  })

  it('Edit and Confirm buttons call handlers', () => {
    const onEdit = vi.fn()
    const onConfirm = vi.fn()
    render(<ContributionSummary {...defaultProps} onEdit={onEdit} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('buttons are disabled when isLoading', () => {
    render(<ContributionSummary {...defaultProps} isLoading={true} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('shows "Processing..." when loading', () => {
    render(<ContributionSummary {...defaultProps} isLoading={true} />)
    expect(screen.getByText(/Processing/i)).toBeDefined()
  })
})
