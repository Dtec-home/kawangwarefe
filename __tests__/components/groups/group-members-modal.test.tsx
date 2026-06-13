/**
 * GroupMembersModal tests.
 *
 * Covers the loading / error / empty / populated states and the remove-member
 * flow (confirm gate, success refetch, failure messages). useQuery/useMutation
 * are mocked directly; the Radix Dialog renders its content when open.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useQuery = vi.fn()
const removeMember = vi.fn()
const refetch = vi.fn().mockResolvedValue({})

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  useMutation: () => [removeMember, { loading: false }],
}))

import { GroupMembersModal } from '@/components/groups/group-members-modal'

const MEMBERS = [
  { id: 'm1', fullName: 'John Doe', phoneNumber: '0711111111', email: 'john@x.com' },
  { id: 'm2', fullName: 'Jane Smith', phoneNumber: '0722222222', email: '' },
]

const props = {
  open: true,
  onOpenChange: vi.fn(),
  groupId: 'g1',
  groupName: 'Choir',
}

beforeEach(() => {
  vi.clearAllMocks()
  refetch.mockResolvedValue({})
  useQuery.mockReturnValue({
    data: { group: { id: 'g1', name: 'Choir', members: MEMBERS } },
    loading: false,
    error: undefined,
    refetch,
  })
})

describe('GroupMembersModal', () => {
  it('lists members with name and contact details', () => {
    render(<GroupMembersModal {...props} />)
    expect(screen.getByText('Members in Choir')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/0711111111 \| john@x.com/)).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('renders the loading state', () => {
    useQuery.mockReturnValue({ data: undefined, loading: true, error: undefined, refetch })
    render(<GroupMembersModal {...props} />)
    expect(screen.getByText(/Loading members/i)).toBeInTheDocument()
  })

  it('renders the error state', () => {
    useQuery.mockReturnValue({ data: undefined, loading: false, error: new Error('x'), refetch })
    render(<GroupMembersModal {...props} />)
    expect(screen.getByText(/Failed to load members/i)).toBeInTheDocument()
  })

  it('renders the empty state', () => {
    useQuery.mockReturnValue({
      data: { group: { id: 'g1', name: 'Choir', members: [] } },
      loading: false,
      error: undefined,
      refetch,
    })
    render(<GroupMembersModal {...props} />)
    expect(screen.getByText(/No members in this group/i)).toBeInTheDocument()
  })

  it('removes a member after confirmation and refetches on success', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    removeMember.mockResolvedValue({
      data: { removeMemberFromGroup: { success: true, message: 'Removed' } },
    })
    render(<GroupMembersModal {...props} />)

    fireEvent.click(screen.getAllByText('Remove')[0])
    await waitFor(() => expect(removeMember).toHaveBeenCalled())
    expect(removeMember.mock.calls[0][0].variables).toEqual({ memberId: 'm1', groupId: 'g1' })
    expect(await screen.findByText('Removed')).toBeInTheDocument()
    expect(refetch).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('does nothing when the confirm dialog is cancelled', () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(false)
    render(<GroupMembersModal {...props} />)
    fireEvent.click(screen.getAllByText('Remove')[0])
    expect(removeMember).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('shows the server failure message when removal is rejected', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    removeMember.mockResolvedValue({
      data: { removeMemberFromGroup: { success: false, message: 'Not allowed' } },
    })
    render(<GroupMembersModal {...props} />)
    fireEvent.click(screen.getAllByText('Remove')[0])
    expect(await screen.findByText('Not allowed')).toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it('shows a generic error when the mutation throws', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    removeMember.mockRejectedValue(new Error('boom'))
    render(<GroupMembersModal {...props} />)
    fireEvent.click(screen.getAllByText('Remove')[0])
    expect(await screen.findByText(/Failed to remove member/i)).toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it('closes via the Close button', () => {
    const onOpenChange = vi.fn()
    render(<GroupMembersModal {...props} onOpenChange={onOpenChange} />)
    // Radix DialogContent renders an sr-only "Close" icon button as well as our
    // explicit outline button; pick the one rendered with visible text content.
    const closeButtons = screen.getAllByRole('button', { name: 'Close' })
    const explicit = closeButtons.find((b) => b.textContent === 'Close')!
    fireEvent.click(explicit)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
