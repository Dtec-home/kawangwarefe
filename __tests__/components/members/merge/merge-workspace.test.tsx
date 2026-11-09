/** MergeWorkspace (MG-2): preview -> confirm -> merged, through the real documents. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/link', () => ({ default: ({ href, children, ...p }: any) => <a href={href} {...p}>{children}</a> }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from 'sonner'
import { MergeWorkspace } from '@/components/members/merge/merge-workspace'
import { MEMBER_MERGE_PREVIEW, MERGE_MEMBERS } from '@/lib/graphql/member-merge'

const member = (id: string, fullName: string) => ({ __typename: 'MemberType', id, fullName, phoneNumber: null, memberNumber: id, isGuest: false })
const preview = {
  __typename: 'MemberMergePreviewType', survivor: member('1', 'Jane Wanjiku'), duplicate: member('2', 'JANE'),
  moves: [{ __typename: 'MergeMoveType', key: 'contributions', label: 'Gifts', count: 2 }], conflicts: [], blockers: [],
  totals: { __typename: 'MergeTotalsType', givenAmount: '5500.00', giftCount: 3, receiptCount: 3, pledgedAmount: '0.00', pledgePaidAmount: '0.00' },
  previewHash: 'h1',
}
const previewMock = { request: { query: MEMBER_MERGE_PREVIEW, variables: { survivorId: '1', duplicateId: '2' } }, result: { data: { memberMergePreview: preview } } }

function mergeMock(result: Record<string, unknown>) {
  return {
    request: { query: MERGE_MEMBERS, variables: { survivorId: '1', duplicateId: '2', reason: 'Same person', confirmName: 'Jane Wanjiku', previewHash: 'h1' } },
    result: { data: { mergeMembers: { __typename: 'MemberMergeResponse', merge: null, code: null, ...result } } },
  }
}

function confirm() {
  fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Same person' } })
  fireEvent.change(screen.getByLabelText('Type Jane Wanjiku to confirm'), { target: { value: 'Jane Wanjiku' } })
  fireEvent.click(screen.getByRole('button', { name: 'Merge' }))
}

describe('MergeWorkspace (MG-2)', () => {
  it('merges with the preview hash and goes to the recent merges', async () => {
    render(<MockedProvider mocks={[previewMock, mergeMock({ success: true, message: 'JANE was merged into Jane Wanjiku' })]}>
      <MergeWorkspace survivorId="1" duplicateId="2" /></MockedProvider>)

    expect(await screen.findByText('2 gifts')).toBeInTheDocument()
    confirm()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/members/merges'))
    expect(toast.success).toHaveBeenCalledWith('JANE was merged into Jane Wanjiku')
  })

  it('a stale preview is shown again instead of merging', async () => {
    render(<MockedProvider mocks={[previewMock, mergeMock({ success: false, code: 'PREVIEW_STALE', message: 'These records changed since the preview; preview again' }), previewMock]}>
      <MergeWorkspace survivorId="1" duplicateId="2" /></MockedProvider>)

    await screen.findByText('2 gifts')
    confirm()

    expect(await screen.findByText('These records changed since the preview; preview again')).toBeInTheDocument()
  })

  it('swaps which record keeps', async () => {
    render(<MockedProvider mocks={[previewMock]}><MergeWorkspace survivorId="1" duplicateId="2" /></MockedProvider>)
    await screen.findByText('2 gifts')
    fireEvent.click(screen.getByRole('button', { name: 'Keep the other record instead' }))
    expect(push).toHaveBeenCalledWith('/admin/members/merge?survivor=2&duplicate=1')
  })
})
