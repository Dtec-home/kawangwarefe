/**
 * Lane S3-UI-F: failure paths of export, cancel and record.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { vi } from 'vitest'

const { toastMock, downloadMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
  downloadMock: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/download-base64-file', () => ({ downloadBase64File: downloadMock }))

import { CancelPledgeDialog } from '@/components/pledges/admin/cancel-pledge-dialog'
import { ExportPledgesButtons } from '@/components/pledges/admin/export-pledges-buttons'
import { RecordPledgeDialog } from '@/components/pledges/admin/record-pledge-dialog'
import { CANCEL_PLEDGE, EXPORT_PLEDGES, RECORD_PLEDGE } from '@/lib/graphql/fundraising/admin-pledges'
import { pledge, pledgeResponse } from './fixtures'

beforeEach(() => vi.clearAllMocks())

function withMocks(mocks: MockedResponse[], ui: React.ReactElement) {
  return render(<MockedProvider mocks={mocks}>{ui}</MockedProvider>)
}

describe('ExportPledgesButtons', () => {
  it('sends the scope and format, and reports a refusal without downloading', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: EXPORT_PLEDGES, variables: { format: 'pdf', campaignId: '9', categoryId: null } },
        result: {
          data: {
            exportPledges: {
              __typename: 'ReportResponse',
              success: false,
              message: 'Not allowed',
              fileData: null,
              filename: null,
              contentType: null,
            },
          },
        },
      },
    ]
    withMocks(mocks, <ExportPledgesButtons scope={{ campaignId: '9', categoryId: null }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Not allowed'))
    expect(downloadMock).not.toHaveBeenCalled()
  })

  it('reports a network error', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: EXPORT_PLEDGES, variables: { format: 'excel', campaignId: null, categoryId: null } },
        error: new Error('Network down'),
      },
    ]
    withMocks(mocks, <ExportPledgesButtons scope={{ campaignId: null, categoryId: null }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Export Excel' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Network down'))
  })
})

describe('CancelPledgeDialog', () => {
  it('asks for a reason before calling the server', async () => {
    withMocks([], <CancelPledgeDialog pledge={pledge()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'no' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel pledge' }))
    expect(await screen.findByText('Give a reason of at least 5 characters.')).toBeInTheDocument()
  })

  it('keeps the dialog open when the server refuses', async () => {
    const onClose = vi.fn()
    const mocks: MockedResponse[] = [
      {
        request: { query: CANCEL_PLEDGE, variables: { id: '1', reason: 'Duplicate card' } },
        result: { data: { cancelPledge: pledgeResponse(false, 'Pledge already fulfilled') } },
      },
    ]
    withMocks(mocks, <CancelPledgeDialog pledge={pledge()} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Duplicate card' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel pledge' }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('Pledge already fulfilled'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('RecordPledgeDialog for a fixed campaign', () => {
  it('records for that campaign without asking which, and shows a refusal', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: RECORD_PLEDGE,
          variables: {
            phoneNumber: '254712345678',
            memberName: null,
            input: { amount: '2000', campaignId: '9', categoryId: null, dueDate: null },
          },
        },
        result: { data: { recordPledge: pledgeResponse(false, 'This campaign does not take pledges') } },
      },
    ]
    withMocks(mocks, <RecordPledgeDialog open onOpenChange={vi.fn()} fixedCampaignId="9" />)
    expect(screen.queryByRole('group', { name: 'Pledge for' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: '712345678' } })
    fireEvent.change(screen.getByLabelText(/Amount \(KES\)/), { target: { value: '2000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save pledge' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This campaign does not take pledges')
  })
})
