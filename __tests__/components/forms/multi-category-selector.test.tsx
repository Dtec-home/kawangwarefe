/**
 * MultiCategorySelector Component Tests
 *
 * Uses Apollo MockedProvider (SOLID-DIP: depends on interface, not real Apollo)
 * ISTQB: Defect-clustering — this component had the array-index key bug
 * FIRST: Independent (MockedProvider per test), Repeatable
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { MultiCategorySelector } from '@/components/forms/multi-category-selector'
import { GET_CONTRIBUTION_CATEGORIES } from '@/lib/graphql/queries'
import { makeCategory, makeCategoryAmount } from '../../fixtures'

// CategoryAmountRow uses Radix Select which doesn't work in jsdom — mock it
vi.mock('@/components/forms/category-amount-row', () => ({
  CategoryAmountRow: ({ index, onRemove, canRemove }: any) => (
    <div data-testid={`category-row-${index}`}>
      <span>Category Row {index}</span>
      {canRemove && <button onClick={() => onRemove(index)}>Remove</button>}
    </div>
  ),
}))

const cat1 = makeCategory({ id: 'cat-1', name: 'Tithe', code: 'TITHE' })
const cat2 = makeCategory({ id: 'cat-2', name: 'Offering', code: 'OFFERING' })
const cat3 = makeCategory({ id: 'cat-3', name: 'Building Fund', code: 'BUILD' })

const categoriesMock = {
  request: { query: GET_CONTRIBUTION_CATEGORIES },
  result: { data: { contributionCategories: [cat1, cat2, cat3] } },
}

const loadingMock = {
  request: { query: GET_CONTRIBUTION_CATEGORIES },
  // Never resolves — simulates loading state
  result: new Promise(() => { }),
}

function renderSelector(
  {
    contributions = [makeCategoryAmount()],
    onChange = vi.fn(),
    maxCategories = 10,
    mocks = [categoriesMock],
  }: {
    contributions?: { categoryId: string; amount: string }[]
    onChange?: ReturnType<typeof vi.fn>
    maxCategories?: number
    mocks?: typeof categoriesMock[]
  } = {}
) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <MultiCategorySelector
        contributions={contributions}
        onChange={onChange}
        maxCategories={maxCategories}
      />
    </MockedProvider>
  )
}

describe('MultiCategorySelector', () => {
  describe('loading state', () => {
    it('renders a skeleton/pulse placeholder while the query is loading', () => {
      const { container } = renderSelector({ mocks: [loadingMock] })
      // Loading: shows a pulse skeleton (animate-pulse class)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe('after data loads', () => {
    it('renders one department row per contribution entry', async () => {
      const contribs = [makeCategoryAmount(), makeCategoryAmount()]
      renderSelector({ contributions: contribs })
      await waitFor(() => {
        expect(screen.getByTestId('category-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('category-row-1')).toBeInTheDocument()
      })
    })

    it('shows "Add Another Department" button when below maxCategories', async () => {
      renderSelector({ contributions: [makeCategoryAmount()], maxCategories: 3 })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add another department/i })).toBeInTheDocument()
      })
    })

    it('hides "Add Another Department" button when at maxCategories limit', async () => {
      const contribs = [makeCategoryAmount(), makeCategoryAmount(), makeCategoryAmount()]
      renderSelector({ contributions: contribs, maxCategories: 3 })
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /add another department/i })).not.toBeInTheDocument()
      })
    })

    it('shows "Maximum X categories reached" message when at limit', async () => {
      const contribs = [makeCategoryAmount(), makeCategoryAmount()]
      renderSelector({ contributions: contribs, maxCategories: 2 })
      await waitFor(() => {
        expect(screen.getByText(/maximum 2 departments reached/i)).toBeInTheDocument()
      })
    })

    it('calls onChange with a new empty row appended when "Add Another Department" clicked', async () => {
      const onChange = vi.fn()
      const initial = [makeCategoryAmount({ categoryId: 'cat-1', amount: '100' })]
      renderSelector({ contributions: initial, onChange, maxCategories: 5 })

      await waitFor(() =>
        screen.getByRole('button', { name: /add another department/i })
      )

      fireEvent.click(screen.getByRole('button', { name: /add another department/i }))

      expect(onChange).toHaveBeenCalledOnce()
      const [newContribs] = onChange.mock.calls[0]
      expect(newContribs).toHaveLength(2)
      expect(newContribs[1]).toEqual({ categoryId: '', amount: '', purposeId: '' })
      // First row unchanged
      expect(newContribs[0]).toEqual({ categoryId: 'cat-1', amount: '100' })
    })
  })
})
