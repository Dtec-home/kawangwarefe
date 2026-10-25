/**
 * CategoryAmountRow — whose member number is being asked for.
 *
 * A recorder (or staff on manual entry) enters someone else's gift, so the
 * department-identifier copy must address the giver, not the person typing.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { CategoryAmountRow } from '@/components/forms/category-amount-row'
import { makeCategory } from '../../fixtures'

const welfare = makeCategory({
  id: 'cat-welfare',
  name: 'Welfare',
  code: 'WELFARE',
  tracksMemberIdentifier: true,
  identifierLabel: 'Welfare no.',
})

const renderRow = (giver?: 'self' | 'other') =>
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      <CategoryAmountRow
        index={0}
        value={{ categoryId: 'cat-welfare', amount: '100' }}
        onChange={vi.fn()}
        onRemove={vi.fn()}
        availableCategories={[welfare]}
        selectedCategory={welfare}
        canRemove={false}
        giver={giver}
      />
    </MockedProvider>,
  )

describe('CategoryAmountRow — identifier copy', () => {
  it('asks the signed-in giver for their own number by default', () => {
    renderRow()
    expect(screen.getByPlaceholderText('Your welfare no.')).toBeInTheDocument()
    expect(screen.getByText(/Enter your welfare no\. for Welfare/)).toBeInTheDocument()
  })

  it('asks the recorder for the giver’s number when entering someone else’s gift', () => {
    renderRow('other')
    expect(screen.getByPlaceholderText('Giver’s welfare no.')).toBeInTheDocument()
    expect(screen.getByText(/Ask the giver for their welfare no\. for Welfare/)).toBeInTheDocument()
    expect(screen.queryByText(/Enter your welfare no\./)).not.toBeInTheDocument()
  })
})
