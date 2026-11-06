import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { MergeConfirmForm } from '@/components/members/merge/merge-confirm-form'

describe('MergeConfirmForm (MG-2, M1 safeguards)', () => {
  it('needs a reason and the survivor\'s full name typed before merging', () => {
    const onConfirm = vi.fn()
    render(<MergeConfirmForm survivorName="Jane Wanjiku" onConfirm={onConfirm} />)
    const merge = screen.getByRole('button', { name: 'Merge' })

    expect(merge).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Same person, second line' } })
    fireEvent.change(screen.getByLabelText('Type Jane Wanjiku to confirm'), { target: { value: 'Jane W' } })
    expect(merge).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Type Jane Wanjiku to confirm'), { target: { value: ' jane  wanjiku ' } })
    expect(merge).toBeEnabled()

    fireEvent.click(merge)
    expect(onConfirm).toHaveBeenCalledWith('Same person, second line', ' jane  wanjiku ')
  })

  it('stays disabled when the merge is blocked or busy', () => {
    render(<MergeConfirmForm survivorName="Jane Wanjiku" onConfirm={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'Merge' })).toBeDisabled()
  })
})
