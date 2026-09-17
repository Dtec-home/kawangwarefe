/**
 * Purposes page — "Cash Statement column" select (T1.8 / spec 03 §2.2):
 * Inherit / Own column – Trust / Own column – Local → null / true / false.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import {
  overrideToStatementColumnChoice,
  statementColumnChoiceToOverride,
} from '@/lib/treasury/statement-columns'

const { mockCreate, mockUpdate, toastMock } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return { ...actual, useParams: () => ({ id: '1' }) }
})

vi.mock('@apollo/client/react', () => ({
  useQuery: (query: { loc?: { source?: { body?: string } } }) => {
    const body = query?.loc?.source?.body || ''
    if (body.includes('categoryAllocations')) return { data: { categoryAllocations: [] }, loading: false, refetch: vi.fn() }
    return {
      data: {
        departmentPurposes: [
          { id: 'p1', name: 'Camp Meeting', code: 'CAMP', description: '', isActive: true, trustFundOverride: null },
          { id: 'p2', name: 'CKC', code: 'CKC', description: '', isActive: true, trustFundOverride: true },
        ],
      },
      loading: false,
      refetch: vi.fn(),
    }
  },
  useMutation: (doc: { loc?: { source?: { body?: string } } }) => {
    const body = doc?.loc?.source?.body || ''
    if (body.includes('createDepartmentPurpose')) return [mockCreate, { loading: false }]
    if (body.includes('updateDepartmentPurpose')) return [mockUpdate, { loading: false }]
    return [vi.fn(), { loading: false }]
  },
}))

// Native <select> so the Radix Select can be operated in jsdom.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import PurposesPage from '@/app/(dashboard)/admin/categories/[id]/purposes/page'

const statementSelects = () =>
  (screen.getAllByRole('combobox') as HTMLSelectElement[]).filter((s) =>
    within(s).queryByRole('option', { name: 'Inherit from department' }),
  )

describe('statement column mapping', () => {
  it('maps choices to trustFundOverride and back', () => {
    expect(statementColumnChoiceToOverride('inherit')).toBeNull()
    expect(statementColumnChoiceToOverride('trust')).toBe(true)
    expect(statementColumnChoiceToOverride('local')).toBe(false)
    expect(overrideToStatementColumnChoice(null)).toBe('inherit')
    expect(overrideToStatementColumnChoice(undefined)).toBe('inherit')
    expect(overrideToStatementColumnChoice(true)).toBe('trust')
    expect(overrideToStatementColumnChoice(false)).toBe('local')
  })
})

describe('Purposes page — Cash Statement column', () => {
  beforeEach(() => {
    mockCreate.mockReset().mockResolvedValue({ data: { createDepartmentPurpose: { success: true, message: 'Created' } } })
    mockUpdate.mockReset().mockResolvedValue({ data: { updateDepartmentPurpose: { success: true, message: 'Updated' } } })
  })

  it('shows the select with helper text, defaulting to inherit, and an override badge', () => {
    render(<PurposesPage />)
    const [createSelect] = statementSelects()
    expect(createSelect.value).toBe('inherit')
    expect(screen.getByText(/gives this purpose a separate column on the Cash Statement/)).toBeInTheDocument()
    expect(screen.getByText('Own column – Trust', { selector: 'span' })).toBeInTheDocument()
  })

  it('create sends trustFundOverride false for "Own column – Local"', async () => {
    render(<PurposesPage />)
    fireEvent.change(screen.getByLabelText('Purpose Name'), { target: { value: 'Youth Camp' } })
    fireEvent.change(statementSelects()[0], { target: { value: 'local' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Purpose/i }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate.mock.calls[0][0].variables.trustFundOverride).toBe(false)
  })

  it('create omits trustFundOverride when inheriting', async () => {
    render(<PurposesPage />)
    fireEvent.change(screen.getByLabelText('Purpose Name'), { target: { value: 'Youth Camp' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Purpose/i }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate.mock.calls[0][0].variables.trustFundOverride).toBeUndefined()
  })

  it('edit sends true when switching an inheriting purpose to "Own column – Trust"', async () => {
    render(<PurposesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0])
    const editSelect = statementSelects()[1]
    expect(editSelect.value).toBe('inherit')
    fireEvent.change(editSelect, { target: { value: 'trust' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate.mock.calls[0][0].variables).toMatchObject({ purposeId: 'p1', trustFundOverride: true })
  })

  it('edit sends explicit null when clearing an override back to inherit', async () => {
    render(<PurposesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[1])
    const editSelect = statementSelects()[1]
    expect(editSelect.value).toBe('trust')
    fireEvent.change(editSelect, { target: { value: 'inherit' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    const { variables } = mockUpdate.mock.calls[0][0]
    expect(variables.purposeId).toBe('p2')
    expect('trustFundOverride' in variables).toBe(true)
    expect(variables.trustFundOverride).toBeNull()
  })

  it('edit omits trustFundOverride when unchanged', async () => {
    render(<PurposesPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[1])
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect('trustFundOverride' in mockUpdate.mock.calls[0][0].variables).toBe(false)
  })
})
