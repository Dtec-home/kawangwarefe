/**
 * CategoryAmountRow Component Tests
 *
 * FIRST: Independent — all callbacks are vi.fn(), no Apollo needed
 * ISTQB: Tests conditional UI (remove button), error display, and callback contracts
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { CategoryAmountRow } from '@/components/forms/category-amount-row'
import {
  GET_DEPARTMENT_PURPOSES,
  GET_PAYBILL_INSTRUCTION_MESSAGE,
} from '@/lib/graphql/queries'
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

const purposeMocks = [
  {
    request: {
      query: GET_DEPARTMENT_PURPOSES,
      variables: { categoryId: 'cat-1', isActive: true },
    },
    result: {
      data: {
        departmentPurposes: [
          {
            id: 'purpose-1',
            name: 'Youth Camp',
            code: 'YCAMP',
            description: 'Support youth camp',
            isActive: true,
          },
        ],
      },
    },
  },
  {
    request: {
      query: GET_PAYBILL_INSTRUCTION_MESSAGE,
      variables: {
        categoryCode: 'YOUTH',
        purposeCode: null,
        amount: 'KES 500',
      },
    },
    result: {
      data: {
        paybillInstructionMessage:
          'To give KES 500 to Youth Tour Fund, send to paybill 14379, ref: YOUTH-TOUR.',
      },
    },
  },
]

function renderRow(
  props: Partial<React.ComponentProps<typeof CategoryAmountRow>> = {},
  mocks = purposeMocks
) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CategoryAmountRow {...defaultProps} {...props} />
    </MockedProvider>
  )
}

describe('CategoryAmountRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the Department label', () => {
      renderRow()
      expect(screen.getByText(/^department/i)).toBeInTheDocument()
    })

    it('renders the Amount (KES) label', () => {
      renderRow()
      expect(screen.getByText(/amount \(kes\)/i)).toBeInTheDocument()
    })

    it('renders the KES prefix inside the amount field', () => {
      renderRow()
      expect(screen.getByText('KES')).toBeInTheDocument()
    })

    it('renders department options in the select', () => {
      renderRow()
      // SelectTrigger shows a placeholder or selected value
      expect(screen.getByText(/select department/i)).toBeInTheDocument()
    })

    it('renders purpose selector when selected department requires purpose', () => {
      renderRow({
        value: { categoryId: 'cat-1', amount: '' },
        selectedCategory: {
          id: 'cat-1',
          name: 'Youth Ministry',
          code: 'YOUTH',
          description: 'Youth contributions',
          routingMode: 'REQUIRES_PURPOSE',
        },
      })

      expect(screen.getByText(/^purpose/i)).toBeInTheDocument()
      expect(screen.getByText(/select purpose/i)).toBeInTheDocument()
    })

    it('does not render purpose selector when department does not require purpose', () => {
      renderRow({
        value: { categoryId: 'cat-1', amount: '' },
        selectedCategory: {
          id: 'cat-1',
          name: 'Tithe',
          code: 'TITHE',
          description: 'Weekly tithe contribution',
          routingMode: 'TOP_LEVEL',
        },
      })

      expect(screen.queryByText(/^purpose/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/select purpose/i)).not.toBeInTheDocument()
    })

    it('renders direct paybill instruction message in-app when department and amount are selected', async () => {
      renderRow(
        {
          value: { categoryId: 'cat-1', amount: '500' },
          selectedCategory: {
            id: 'cat-1',
            name: 'Youth Ministry',
            code: 'YOUTH',
            description: 'Youth contributions',
            routingMode: 'REQUIRES_PURPOSE',
          },
        },
        purposeMocks
      )

      expect(await screen.findByText(/direct paybill instruction/i)).toBeInTheDocument()
      expect(
        await screen.findByText(/to give kes 500 to youth tour fund/i)
      ).toBeInTheDocument()
    })
  })

  describe('remove button visibility (canRemove)', () => {
    it('renders the remove button when canRemove=true', () => {
      renderRow({ canRemove: true })
      expect(screen.getByRole('button', { name: /remove department/i })).toBeInTheDocument()
    })

    it('does NOT render the remove button when canRemove=false', () => {
      renderRow({ canRemove: false })
      expect(screen.queryByRole('button', { name: /remove department/i })).not.toBeInTheDocument()
    })
  })

  describe('callbacks', () => {
    it('calls onRemove with the correct index when remove button clicked', () => {
      const onRemove = vi.fn()
      renderRow({ index: 2, onRemove, canRemove: true })
      fireEvent.click(screen.getByRole('button', { name: /remove department/i }))
      expect(onRemove).toHaveBeenCalledOnce()
      expect(onRemove).toHaveBeenCalledWith(2)
    })

    it('calls onChange with field="amount" when amount input changes', () => {
      const onChange = vi.fn()
      renderRow({ index: 0, onChange })
      const input = screen.getByRole('spinbutton') // type="number"
      fireEvent.change(input, { target: { value: '500' } })
      expect(onChange).toHaveBeenCalledWith(0, 'amount', '500')
    })
  })

  describe('error display', () => {
    it('renders categoryId error message when provided', () => {
      renderRow({ errors: { categoryId: 'Please select a department' } })
      expect(screen.getByText('Please select a department')).toBeInTheDocument()
    })

    it('renders amount error message when provided', () => {
      renderRow({ errors: { amount: 'Amount must be at least KES 1' } })
      expect(screen.getByText('Amount must be at least KES 1')).toBeInTheDocument()
    })

    it('does NOT render any error text when no errors prop is given', () => {
      renderRow()
      expect(screen.queryByText(/please select/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/must be at least/i)).not.toBeInTheDocument()
    })
  })
})
