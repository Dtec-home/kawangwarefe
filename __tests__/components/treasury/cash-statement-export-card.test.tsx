/**
 * Treasurer's Cash Statement export card (T3.4 UI).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { mockGenerate, mockDownload, toastMock, useQueryMock, summaryProps } = vi.hoisted(() => ({
  summaryProps: [] as Array<{ dateFrom: string; dateTo: string; refreshKey?: number }>,
  mockGenerate: vi.fn(),
  mockDownload: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
  useQueryMock: vi.fn(() => ({ data: { statementColumns: [] }, loading: false, error: undefined })),
}))

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [mockGenerate, { loading: false }],
  useQuery: useQueryMock,
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/download-base64-file', () => ({ downloadBase64File: mockDownload }))
vi.mock('@/components/treasury/period-summary', () => ({
  PeriodSummary: (props: { dateFrom: string; dateTo: string; refreshKey?: number }) => {
    summaryProps.push(props)
    return <div data-testid="period-summary-stub">{`${props.dateFrom}..${props.dateTo}#${props.refreshKey}`}</div>
  },
}))

import { CashStatementExportCard } from '@/components/treasury/cash-statement-export-card'

const WEDNESDAY = new Date('2026-09-16T07:00:00Z') // Wed 16 Sep 2026, 10:00 Nairobi
const SATURDAY = new Date('2026-09-19T05:00:00Z') // Sat 19 Sep 2026, 08:00 Nairobi

function useClock(now: Date) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
}

const generateButton = () => screen.getByRole('button', { name: /Generate Cash Statement/i })
const pick = (group: string, option: string) =>
  fireEvent.click(within(screen.getByRole('group', { name: group })).getByRole('button', { name: option }))

describe('CashStatementExportCard', () => {
  beforeEach(() => {
    mockGenerate.mockReset()
    mockDownload.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    useQueryMock.mockClear()
    summaryProps.length = 0
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to the previous Saturday on a Wednesday', () => {
    useClock(WEDNESDAY)
    render(<CashStatementExportCard />)
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-09-12')
  })

  it('defaults to today on a Saturday', () => {
    useClock(SATURDAY)
    render(<CashStatementExportCard />)
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-09-19')
  })

  it('defaults to single date, PDF, Letter', () => {
    useClock(WEDNESDAY)
    render(<CashStatementExportCard />)
    expect(within(screen.getByRole('group', { name: 'Period' })).getByRole('button', { name: 'Single date' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('group', { name: 'Format' })).getByRole('button', { name: 'PDF' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('group', { name: 'Paper' })).getByRole('button', { name: 'Letter' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sends a single date as dateFrom = dateTo and downloads the file', async () => {
    useClock(WEDNESDAY)
    mockGenerate.mockResolvedValue({
      data: {
        generateCashStatement: {
          success: true,
          message: 'Cash statement generated successfully',
          fileData: 'JVBERi0=',
          filename: 'Cash_Statement_2026-09-12.pdf',
          contentType: 'application/pdf',
        },
      },
    })
    render(<CashStatementExportCard />)
    fireEvent.click(generateButton())

    await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(1))
    expect(mockGenerate.mock.calls[0][0].variables).toEqual({
      dateFrom: '2026-09-12',
      dateTo: '2026-09-12',
      format: 'pdf',
      paper: 'letter',
    })
    expect(mockDownload).toHaveBeenCalledWith('JVBERi0=', 'Cash_Statement_2026-09-12.pdf', 'application/pdf')
    expect(toastMock.success).toHaveBeenCalled()
  })

  it('sends a range with Excel and A4', async () => {
    useClock(WEDNESDAY)
    mockGenerate.mockResolvedValue({
      data: { generateCashStatement: { success: true, message: 'ok', fileData: 'UEs=', filename: 'Cash_Statement_2026-08-01_to_2026-08-31.xlsx', contentType: null } },
    })
    render(<CashStatementExportCard />)
    pick('Period', 'Date range')
    pick('Format', 'Excel')
    pick('Paper', 'A4')
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-08-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-08-31' } })
    fireEvent.click(generateButton())

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(1))
    expect(mockGenerate.mock.calls[0][0].variables).toEqual({
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      format: 'excel',
      paper: 'a4',
    })
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith('UEs=', 'Cash_Statement_2026-08-01_to_2026-08-31.xlsx', 'application/octet-stream'),
    )
  })

  it('shows an inline error and blocks a reversed range', () => {
    useClock(WEDNESDAY)
    render(<CashStatementExportCard />)
    pick('Period', 'Date range')
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-10' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } })

    expect(screen.getByRole('alert')).toHaveTextContent('The end date must not be before the start date')
    expect(generateButton()).toBeDisabled()
    fireEvent.click(generateButton())
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('shows an inline error for a range longer than 366 days', () => {
    useClock(WEDNESDAY)
    render(<CashStatementExportCard />)
    pick('Period', 'Date range')
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-02' } })

    expect(screen.getByRole('alert')).toHaveTextContent('at most 366 days')
    expect(generateButton()).toBeDisabled()
  })

  it('toasts a backend refusal without downloading', async () => {
    useClock(WEDNESDAY)
    mockGenerate.mockResolvedValue({
      data: { generateCashStatement: { success: false, message: 'Requires staff privileges to generate reports', fileData: null, filename: null, contentType: null } },
    })
    render(<CashStatementExportCard />)
    fireEvent.click(generateButton())

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Requires staff privileges to generate reports'))
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('opens the columns preview for the chosen dates', () => {
    useClock(WEDNESDAY)
    render(<CashStatementExportCard />)
    fireEvent.click(screen.getByRole('button', { name: /Preview columns/i }))
    expect(screen.getByText('Cash Statement columns')).toBeInTheDocument()
    const options = (useQueryMock.mock.calls.at(-1) as unknown[])[1] as { variables: unknown }
    expect(options.variables).toEqual({ dateFrom: '2026-09-12', dateTo: '2026-09-12' })
  })

  describe('period summary', () => {
    const toggle = () => screen.getByRole('button', { name: /Period summary/ })

    it('is collapsed by default and follows the chosen range when expanded', () => {
      useClock(WEDNESDAY)
      render(<CashStatementExportCard />)
      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByTestId('period-summary-stub')).not.toBeInTheDocument()

      fireEvent.click(toggle())
      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('period-summary-stub')).toHaveTextContent('2026-09-12..2026-09-12#0')

      pick('Period', 'Date range')
      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-08-01' } })
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-08-31' } })
      expect(screen.getByTestId('period-summary-stub')).toHaveTextContent('2026-08-01..2026-08-31#0')
    })

    it('asks for a valid period instead of loading a summary for a bad range', () => {
      useClock(WEDNESDAY)
      render(<CashStatementExportCard />)
      fireEvent.click(toggle())
      pick('Period', 'Date range')
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-01' } })
      expect(screen.queryByTestId('period-summary-stub')).not.toBeInTheDocument()
      expect(screen.getByText('Choose a valid period to see its summary.')).toBeInTheDocument()
    })

    it('asks the summary to refresh after a statement is generated', async () => {
      useClock(WEDNESDAY)
      mockGenerate.mockResolvedValue({
        data: { generateCashStatement: { success: true, message: 'ok', fileData: 'AAAA', filename: 'a.pdf', contentType: 'application/pdf' } },
      })
      render(<CashStatementExportCard />)
      fireEvent.click(toggle())
      fireEvent.click(generateButton())
      await waitFor(() => expect(screen.getByTestId('period-summary-stub')).toHaveTextContent('#1'))
    })
  })
})
