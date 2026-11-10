/** The "⋯" menu on a member row: Merge… (admin/treasurer), activate/deactivate, delete. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemberRowMenu } from '@/components/members/member-row-menu'

const mary = { id: '7', fullName: 'Mary Wanjiku', phoneNumber: '254712345678', isActive: true }

describe('MemberRowMenu', () => {
  it('offers Merge… that opens the merge page with this member to keep', async () => {
    render(<MemberRowMenu member={mary} canMerge onToggleStatus={vi.fn()} onDelete={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'More actions for Mary Wanjiku' }))

    const merge = await screen.findByRole('menuitem', { name: /Merge/ })
    expect(merge.closest('a')).toHaveAttribute('href', '/admin/members/merge?keep=254712345678')
  })

  it('has no Merge… without the admin or treasurer role', async () => {
    render(<MemberRowMenu member={mary} canMerge={false} onToggleStatus={vi.fn()} onDelete={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'More actions for Mary Wanjiku' }))

    expect(await screen.findByRole('menuitem', { name: 'Deactivate' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Merge/ })).toBeNull()
  })

  it('runs deactivate and delete for this member', async () => {
    const onToggleStatus = vi.fn()
    const onDelete = vi.fn()
    render(<MemberRowMenu member={mary} canMerge onToggleStatus={onToggleStatus} onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: 'More actions for Mary Wanjiku' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Deactivate' }))
    expect(onToggleStatus).toHaveBeenCalledWith(mary)

    await userEvent.click(screen.getByRole('button', { name: 'More actions for Mary Wanjiku' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(mary)
  })

  it('offers Activate for an inactive member', async () => {
    render(<MemberRowMenu member={{ ...mary, isActive: false }} canMerge onToggleStatus={vi.fn()} onDelete={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'More actions for Mary Wanjiku' }))

    expect(await screen.findByRole('menuitem', { name: 'Activate' })).toBeInTheDocument()
  })
})
