/**
 * CategoryAmountRow Component Tests
 *
 * FIRST: Independent — all callbacks are vi.fn(), no Apollo needed
 * ISTQB: Tests conditional UI (remove button), error display, and callback contracts
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryAmountRow } from '@/components/forms/category-amount-row'
import { makeCategory } from '../../fixtures'

const defaultProps = {
  index: 0,
  value: { categoryId: '', amount: '' },
  onChange: vi.fn(),
  onRemove: vi.fn(),
  availableCategories: [
    makeCategory({ id: 'cat-1', name: 'Tithe', code: 'TITHE' }),
    makeCategory({ id: 'cat-2', name: 'Offering', code: 'OFFERING' }),
  ],
  canRemove: true,
}

describe('CategoryAmountRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the Category label', () => {
      render(<CategoryAmountRow {...defaultProps} />)
      expect(screen.getByText(/^category/i)).toBeInTheDocument()
    })

    it('renders the Amount (KES) label', () => {
      render(<CategoryAmountRow {...defaultProps} />)
      expect(screen.getByText(/amount \(kes\)/i)).toBeInTheDocument()
    })

    it('renders the KES prefix inside the amount field', () => {
      render(<CategoryAmountRow {...defaultProps} />)
      expect(screen.getByText('KES')).toBeInTheDocument()
    })

    it('renders category options in the select', () => {
      render(<CategoryAmountRow {...defaultProps} />)
      // SelectTrigger shows a placeholder or selected value
      expect(screen.getByText(/select category/i)).toBeInTheDocument()
    })
  })

  describe('remove button visibility (canRemove)', () => {
    it('renders the remove button when canRemove=true', () => {
      render(<CategoryAmountRow {...defaultProps} canRemove={true} />)
      expect(screen.getByRole('button', { name: /remove category/i })).toBeInTheDocument()
    })

    it('does NOT render the remove button when canRemove=false', () => {
      render(<CategoryAmountRow {...defaultProps} canRemove={false} />)
      expect(screen.queryByRole('button', { name: /remove category/i })).not.toBeInTheDocument()
    })
  })

  describe('callbacks', () => {
    it('calls onRemove with the correct index when remove button clicked', () => {
      const onRemove = vi.fn()
      render(<CategoryAmountRow {...defaultProps} index={2} onRemove={onRemove} canRemove={true} />)
      fireEvent.click(screen.getByRole('button', { name: /remove category/i }))
      expect(onRemove).toHaveBeenCalledOnce()
      expect(onRemove).toHaveBeenCalledWith(2)
    })

    it('calls onChange with field="amount" when amount input changes', () => {
      const onChange = vi.fn()
      render(<CategoryAmountRow {...defaultProps} index={0} onChange={onChange} />)
      const input = screen.getByRole('spinbutton') // type="number"
      fireEvent.change(input, { target: { value: '500' } })
      expect(onChange).toHaveBeenCalledWith(0, 'amount', '500')
    })
  })

  describe('error display', () => {
    it('renders categoryId error message when provided', () => {
      render(
        <CategoryAmountRow
          {...defaultProps}
          errors={{ categoryId: 'Please select a category' }}
        />
      )
      expect(screen.getByText('Please select a category')).toBeInTheDocument()
    })

    it('renders amount error message when provided', () => {
      render(
        <CategoryAmountRow
          {...defaultProps}
          errors={{ amount: 'Amount must be at least KES 1' }}
        />
      )
      expect(screen.getByText('Amount must be at least KES 1')).toBeInTheDocument()
    })

    it('does NOT render any error text when no errors prop is given', () => {
      render(<CategoryAmountRow {...defaultProps} />)
      expect(screen.queryByText(/please select/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/must be at least/i)).not.toBeInTheDocument()
    })
  })
})
