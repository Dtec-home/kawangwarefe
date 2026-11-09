import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MergePreview } from '@/components/members/merge/merge-preview'

const preview = {
  survivor: { id: '1', fullName: 'Jane Wanjiku', phoneNumber: '254711000001', memberNumber: '000001', isGuest: false },
  duplicate: { id: '2', fullName: 'JANE ', phoneNumber: null, memberNumber: '000002', isGuest: true },
  moves: [{ key: 'contributions', label: 'Gifts', count: 2 }, { key: 'receipts', label: 'Receipts', count: 2 }],
  conflicts: [{ key: 'champion', description: 'Both are champions of Shamba (JANE and JW)', resolution: 'JANE continues' }],
  blockers: [],
  totals: { givenAmount: '5500.00', giftCount: 3, receiptCount: 3, pledgedAmount: '10000.00', pledgePaidAmount: '0.00' },
  previewHash: 'abc',
}

describe('MergePreview (MG-2)', () => {
  it('shows who stays, who goes, what moves and how clashes resolve', () => {
    render(<MergePreview preview={preview} />)
    expect(screen.getByText('Jane Wanjiku')).toBeInTheDocument()
    expect(screen.getByText('Keeps')).toBeInTheDocument()
    expect(screen.getByText('Merged in')).toBeInTheDocument()
    expect(screen.getByText('2 gifts')).toBeInTheDocument()
    expect(screen.getByText('2 receipts')).toBeInTheDocument()
    expect(screen.getByText('Both are champions of Shamba (JANE and JW)')).toBeInTheDocument()
    expect(screen.getByText('JANE continues')).toBeInTheDocument()
  })

  it('shows the money that must be the same afterwards', () => {
    render(<MergePreview preview={preview} />)
    expect(screen.getByText('KES 5,500')).toBeInTheDocument()
    expect(screen.getByText(/must be the same after the merge/)).toBeInTheDocument()
  })

  it('shows why a merge cannot run', () => {
    render(<MergePreview preview={{ ...preview, blockers: ['JANE is a dependent; dependents are not merged'] }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('JANE is a dependent; dependents are not merged')
  })
})
