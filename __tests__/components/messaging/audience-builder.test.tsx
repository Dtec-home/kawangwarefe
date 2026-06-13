/**
 * AudienceBuilder tests.
 *
 * Exercises the structured audience picker: department/group/role checklists,
 * the include-guests/minors toggles, the external-numbers parser stats, and the
 * debounced member typeahead. useQuery/useLazyQuery are mocked directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useQuery = vi.fn()
const lazySearch = vi.fn()
const useLazyQuery = vi.fn(() => [lazySearch, { data: undefined, loading: false }])

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  useLazyQuery: (...args: unknown[]) => useLazyQuery(...args),
}))

import { AudienceBuilder } from '@/components/messaging/AudienceBuilder'
import type { AudienceFilter } from '@/lib/hooks/use-audience-filter'

const EMPTY: AudienceFilter = {
  departmentIds: [],
  groupIds: [],
  roles: [],
  memberIds: [],
  includeGuests: false,
  includeMinors: true,
  extraPhoneNumbers: [],
}

function renderBuilder(overrides: Partial<Record<string, unknown>> = {}, filter = EMPTY) {
  const handlers = {
    onDepartmentIdsChange: vi.fn(),
    onGroupIdsChange: vi.fn(),
    onRolesChange: vi.fn(),
    onMemberIdsChange: vi.fn(),
    onIncludeGuestsChange: vi.fn(),
    onIncludeMinorsChange: vi.fn(),
    onExtraPhoneNumbersChange: vi.fn(),
    ...overrides,
  }
  render(<AudienceBuilder filter={filter} {...(handlers as never)} />)
  return handlers
}

beforeEach(() => {
  vi.clearAllMocks()
  // Departments first useQuery call, Groups second.
  useQuery
    .mockReturnValueOnce({ data: { availableDepartments: [{ id: 'd1', name: 'Youth' }] } })
    .mockReturnValueOnce({ data: { availableGroups: [{ id: 'g1', name: 'Choir' }] } })
    .mockReturnValue({ data: undefined })
  useLazyQuery.mockReturnValue([lazySearch, { data: undefined, loading: false }])
})

describe('AudienceBuilder', () => {
  it('renders department, group, and role checklists', () => {
    renderBuilder()
    expect(screen.getByText('Departments')).toBeInTheDocument()
    expect(screen.getByText('Youth')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('Choir')).toBeInTheDocument()
    expect(screen.getByText('By Role')).toBeInTheDocument()
    // ROLES list is always shown
    expect(screen.getByText('Treasurer')).toBeInTheDocument()
  })

  it('toggles a department on via the checklist', () => {
    const handlers = renderBuilder()
    fireEvent.click(screen.getByText('Youth'))
    expect(handlers.onDepartmentIdsChange).toHaveBeenCalledWith(['d1'])
  })

  it('toggles a role selection on', () => {
    const handlers = renderBuilder()
    fireEvent.click(screen.getByText('Pastor'))
    expect(handlers.onRolesChange).toHaveBeenCalledWith(['pastor'])
  })

  it('removes an already-selected role when clicked again', () => {
    const handlers = renderBuilder({}, { ...EMPTY, roles: ['pastor'] })
    fireEvent.click(screen.getByText('Pastor'))
    expect(handlers.onRolesChange).toHaveBeenCalledWith([])
  })

  it('shows the active-filter count badge when a selection exists', () => {
    renderBuilder({}, { ...EMPTY, departmentIds: ['d1'], roles: ['pastor'] })
    expect(screen.getByText('2 filter(s) active')).toBeInTheDocument()
  })

  it('forwards the include-guests toggle', () => {
    const handlers = renderBuilder()
    fireEvent.click(screen.getByText('Include guests'))
    expect(handlers.onIncludeGuestsChange).toHaveBeenCalledWith(true)
  })

  it('parses external phone numbers and reports valid/invalid counts', () => {
    const handlers = renderBuilder()
    const textarea = screen.getByPlaceholderText(/Paste phone numbers/i)
    fireEvent.change(textarea, {
      target: { value: '0712345678, 0712345678\nnot-a-phone\n0723456789' },
    })

    // Deduped valid numbers passed up.
    expect(handlers.onExtraPhoneNumbersChange).toHaveBeenLastCalledWith([
      '0712345678',
      '0723456789',
    ])
    expect(screen.getByText(/2 valid numbers/)).toBeInTheDocument()
    expect(screen.getByText(/1 unrecognised/)).toBeInTheDocument()
  })

  it('debounces the member typeahead search and shows results', async () => {
    vi.useFakeTimers()
    useLazyQuery.mockReturnValue([
      lazySearch,
      {
        data: {
          memberSearch: [
            { id: 'm1', fullName: 'Jane Member', phoneNumber: '254700111222', memberNumber: 'M001' },
          ],
        },
        loading: false,
      },
    ])
    renderBuilder()

    const input = screen.getByPlaceholderText(/Search by name or phone/i)
    fireEvent.change(input, { target: { value: 'Jane' } })
    // Search should not fire before the debounce window elapses.
    expect(lazySearch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(lazySearch).toHaveBeenCalledWith({ variables: { query: 'Jane', limit: 10 } })

    vi.useRealTimers()
    await waitFor(() => expect(screen.getByText('Jane Member')).toBeInTheDocument())
  })

  it('does not search for queries shorter than two characters', () => {
    vi.useFakeTimers()
    renderBuilder()
    const input = screen.getByPlaceholderText(/Search by name or phone/i)
    fireEvent.change(input, { target: { value: 'J' } })
    vi.advanceTimersByTime(500)
    expect(lazySearch).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
