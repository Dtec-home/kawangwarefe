/**
 * Cash Statement columns preview (T3.1).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

const { state, useQueryMock } = vi.hoisted(() => {
  const state = {
    result: { data: undefined as unknown, loading: false, error: undefined as unknown },
  }
  return { state, useQueryMock: vi.fn(() => state.result) }
})

vi.mock('@apollo/client/react', () => ({ useQuery: useQueryMock }))

import {
  StatementColumnsPreview,
  StatementColumnsPreviewDialog,
  groupStatementColumns,
} from '@/components/treasury/statement-columns-preview'

const COLUMNS = [
  { key: 'category:1', label: 'TITHE', isTrust: true },
  { key: 'purpose:7', label: 'COMBINED – CKC', isTrust: true },
  { key: 'category:4', label: 'CHURCH BUDGET', isTrust: false },
  { key: 'category:5', label: 'WELFARE', isTrust: false },
]

describe('groupStatementColumns', () => {
  it('splits trust and local, preserving order', () => {
    const { trust, local } = groupStatementColumns(COLUMNS)
    expect(trust.map((c) => c.label)).toEqual(['TITHE', 'COMBINED – CKC'])
    expect(local.map((c) => c.label)).toEqual(['CHURCH BUDGET', 'WELFARE'])
  })
})

describe('StatementColumnsPreview', () => {
  beforeEach(() => {
    useQueryMock.mockClear()
    state.result = { data: { statementColumns: COLUMNS }, loading: false, error: undefined }
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('queries the most recent Nairobi Saturday by default', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-16T07:00:00Z')) // Wednesday
    render(<StatementColumnsPreview />)
    const options = (useQueryMock.mock.calls[0] as unknown[])[1] as { variables: unknown }
    expect(options.variables).toEqual({ dateFrom: '2026-09-12', dateTo: '2026-09-12' })
  })

  it('passes an explicit range through', () => {
    render(<StatementColumnsPreview dateFrom="2026-08-01" dateTo="2026-08-31" />)
    const options = (useQueryMock.mock.calls[0] as unknown[])[1] as { variables: unknown }
    expect(options.variables).toEqual({ dateFrom: '2026-08-01', dateTo: '2026-08-31' })
  })

  it('groups chips under Trust funds and Local funds with running order numbers', () => {
    render(<StatementColumnsPreview dateFrom="2026-08-29" />)
    const trust = screen.getByRole('region', { name: 'Trust funds' })
    const local = screen.getByRole('region', { name: 'Local funds' })
    expect(within(trust).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['1.TITHE', '2.COMBINED – CKC'])
    expect(within(local).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['3.CHURCH BUDGET', '4.WELFARE'])
    expect(screen.queryByText('No trust fund columns')).not.toBeInTheDocument()
  })

  it('warns when there are no trust columns', () => {
    state.result = { data: { statementColumns: COLUMNS.filter((c) => !c.isTrust) }, loading: false, error: undefined }
    render(<StatementColumnsPreview dateFrom="2026-08-29" />)
    expect(screen.getByText('No trust fund columns')).toBeInTheDocument()
  })

  it('shows an error from the server', () => {
    state.result = { data: undefined, loading: false, error: new Error('Requires staff privileges') }
    render(<StatementColumnsPreview dateFrom="2026-08-29" />)
    expect(screen.getByText('Requires staff privileges')).toBeInTheDocument()
  })

  it('dialog only queries while open', () => {
    const { rerender } = render(<StatementColumnsPreviewDialog open={false} onOpenChange={() => {}} />)
    expect(useQueryMock).not.toHaveBeenCalled()
    rerender(<StatementColumnsPreviewDialog open onOpenChange={() => {}} dateFrom="2026-08-29" />)
    expect(screen.getByText('Cash Statement columns')).toBeInTheDocument()
    expect(useQueryMock).toHaveBeenCalled()
  })
})
