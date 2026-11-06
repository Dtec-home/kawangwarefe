/** RecentMerges (MG-2, M5): the merges list with Undo, through the real documents. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from 'sonner'
import { RecentMerges } from '@/components/members/merge/recent-merges'
import { MEMBER_MERGES, MEMBER_MERGE_UNDO_PREVIEW, UNDO_MEMBER_MERGE } from '@/lib/graphql/member-merge'

const member = (id: string, fullName: string) => ({ __typename: 'MemberType', id, fullName, phoneNumber: null, memberNumber: id, isGuest: false })
const record = (status: string) => ({
  __typename: 'MemberMergeType', id: '9', status, reason: 'Same person', mergedBy: 'Alice Admin', executedAt: '2026-11-04T10:00:00Z',
  reversedBy: null, reversedAt: null, reverseReason: null, survivor: member('1', 'Jane Wanjiku'), duplicate: member('2', 'JANE'),
})
const move = (count: number) => [{ __typename: 'MergeMoveType', key: 'contributions', label: 'Gifts', count }]

describe('RecentMerges (MG-2)', () => {
  it('lists merges and undoes one after showing what goes back', async () => {
    const mocks = [
      { request: { query: MEMBER_MERGES }, result: { data: { memberMerges: [record('executed')] } } },
      { request: { query: MEMBER_MERGE_UNDO_PREVIEW, variables: { mergeId: '9' } },
        result: { data: { memberMergeUndoPreview: { __typename: 'MemberMergeUndoPreviewType', merge: { __typename: 'MemberMergeType', id: '9' },
          movesBack: move(2), sinceMergeGoingBack: move(1), sinceMergeStaying: [], blockers: [] } } } },
      { request: { query: UNDO_MEMBER_MERGE, variables: { mergeId: '9', reason: 'Different people' } },
        result: { data: { undoMemberMerge: { __typename: 'MemberMergeResponse', success: true, message: 'The merge was undone', code: null, merge: record('reversed') } } } },
      { request: { query: MEMBER_MERGES }, result: { data: { memberMerges: [record('reversed')] } } },
    ]
    render(<MockedProvider mocks={mocks}><RecentMerges /></MockedProvider>)

    const row = await screen.findByRole('listitem')
    expect(within(row).getByText(/JANE → Jane Wanjiku/)).toBeInTheDocument()
    fireEvent.click(within(row).getByRole('button', { name: 'Undo' }))

    expect(await screen.findByText('1 gift since the merge goes back with its number')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Why undo this merge?'), { target: { value: 'Different people' } })
    fireEvent.click(screen.getByRole('button', { name: 'Undo merge' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('The merge was undone'))
  })

  it('an undone merge has no Undo', async () => {
    render(<MockedProvider mocks={[{ request: { query: MEMBER_MERGES }, result: { data: { memberMerges: [record('reversed')] } } }]}><RecentMerges /></MockedProvider>)
    const row = await screen.findByRole('listitem')
    expect(within(row).getByText('Undone')).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })
})
