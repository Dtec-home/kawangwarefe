import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BulkAddMembersModal } from '@/components/groups/bulk-add-members-modal'

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Search: () => <div data-testid="icon-search" />,
    Users: () => <div data-testid="icon-users" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    Loader2: () => <div data-testid="icon-loader" />,
  }
})

// We need to mock Apollo Client hooks
const mockMembersData = {
  membersList: {
    items: [
      { id: 'm1', fullName: 'John Doe', phoneNumber: '0711111111', groups: [] },
      { id: 'm2', fullName: 'Jane Smith', phoneNumber: '0722222222', groups: [] },
    ],
    total: 2,
    hasMore: false,
  }
}

const mockRefetch = vi.fn().mockResolvedValue({})
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
}))

describe('BulkAddMembersModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    groupId: 'g1',
    groupName: 'Test Group',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({ data: mockMembersData, loading: false, refetch: mockRefetch })
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }])
  })

  it('renders the modal with group name', () => {
    render(<BulkAddMembersModal {...defaultProps} />)
    expect(screen.getByText('Add Members to Test Group')).toBeInTheDocument()
  })

  it('renders a list of members', () => {
    render(<BulkAddMembersModal {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('handles member selection', async () => {
    render(<BulkAddMembersModal {...defaultProps} />)
    const johnCheckbox = screen.getByLabelText('John Doe')
    
    fireEvent.click(johnCheckbox)
    expect(johnCheckbox).toBeChecked()
    
    // Add button should now show (1) selected
    expect(screen.getByRole('button', { name: /Add \(1\)/i })).toBeInTheDocument()
  })

  it('handles select all', () => {
    render(<BulkAddMembersModal {...defaultProps} />)
    const selectAllCheckbox = screen.getByLabelText('Select All')
    
    fireEvent.click(selectAllCheckbox)
    expect(screen.getByLabelText('John Doe')).toBeChecked()
    expect(screen.getByLabelText('Jane Smith')).toBeChecked()
    
    expect(screen.getByRole('button', { name: /Add \(2\)/i })).toBeInTheDocument()
  })

  it('calls mutation on submit and auto closes', async () => {
    const mockMutate = vi.fn().mockResolvedValue({
      data: {
        bulkAddMembersToGroup: {
          success: true,
          message: 'ignored',
          addedCount: 1,
          alreadyMemberCount: 0,
          skippedCount: 0,
          skippedMembers: [],
        }
      }
    })
    mockUseMutation.mockReturnValue([mockMutate, { loading: false }])

    const onOpenChange = vi.fn()
    render(<BulkAddMembersModal {...defaultProps} onOpenChange={onOpenChange} />)

    // Select one
    fireEvent.click(screen.getByLabelText('John Doe'))

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Add \(1\)/i }))

    expect(mockMutate).toHaveBeenCalledWith({
      variables: {
        memberIds: ['m1'],
        groupId: 'g1'
      }
    })

    // Should render the breakdown and refetch the list
    await waitFor(() => {
      expect(screen.getByText(/Added 1 · 0 already members · 0 skipped/)).toBeInTheDocument()
    })
    expect(mockRefetch).toHaveBeenCalled()

    // Advance timers to trigger auto-close
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    }, { timeout: 3000 })
  })

  it('disables and labels members already in this group', () => {
    mockUseQuery.mockReturnValue({
      data: {
        membersList: {
          items: [
            { id: 'm1', fullName: 'John Doe', phoneNumber: '0711111111', groups: [{ id: 'g1', name: 'Test Group' }] },
            { id: 'm2', fullName: 'Jane Smith', phoneNumber: '0722222222', groups: [] },
          ],
          total: 2,
          hasMore: false,
        }
      },
      loading: false,
      refetch: mockRefetch,
    })

    render(<BulkAddMembersModal {...defaultProps} />)

    // John is already in g1 → disabled + labelled; Jane is selectable.
    expect(screen.getByLabelText('John Doe')).toBeDisabled()
    expect(screen.getByLabelText('Jane Smith')).not.toBeDisabled()
    expect(screen.getByText('Already a member')).toBeInTheDocument()
  })

  it('shows Load more and grows the page limit when there are more members', () => {
    mockUseQuery.mockReturnValue({
      data: {
        membersList: {
          items: [{ id: 'm1', fullName: 'John Doe', phoneNumber: '0711111111', groups: [] }],
          total: 120,
          hasMore: true,
        }
      },
      loading: false,
      refetch: mockRefetch,
    })

    render(<BulkAddMembersModal {...defaultProps} />)

    const loadMore = screen.getByRole('button', { name: /Load more/i })
    expect(loadMore).toBeInTheDocument()

    fireEvent.click(loadMore)

    // Re-query fires with a larger limit (initial 50 -> 100).
    const lastCall = mockUseQuery.mock.calls.at(-1)
    expect(lastCall?.[1]?.variables?.limit).toBe(100)
  })

  it('does not show Load more when there are no more members', () => {
    render(<BulkAddMembersModal {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /Load more/i })).not.toBeInTheDocument()
  })

  it('select-all only selects members not already in the group', () => {
    mockUseQuery.mockReturnValue({
      data: {
        membersList: {
          items: [
            { id: 'm1', fullName: 'John Doe', phoneNumber: '0711111111', groups: [{ id: 'g1', name: 'Test Group' }] },
            { id: 'm2', fullName: 'Jane Smith', phoneNumber: '0722222222', groups: [] },
          ],
          total: 2,
          hasMore: false,
        }
      },
      loading: false,
      refetch: mockRefetch,
    })

    render(<BulkAddMembersModal {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Select All'))

    // Only Jane (m2) is selectable.
    expect(screen.getByLabelText('Jane Smith')).toBeChecked()
    expect(screen.getByRole('button', { name: /Add \(1\)/i })).toBeInTheDocument()
  })
})
