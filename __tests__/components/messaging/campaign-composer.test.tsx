/**
 * CampaignComposer tests.
 *
 * Drives the 3-step Audience → Message → Preview & Send flow. The Radix Select
 * is replaced with a native <select> so the template can be chosen in jsdom,
 * and AudienceBuilder is stubbed (its own data wiring is tested separately).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useQuery = vi.fn()
const previewCampaign = vi.fn()
const launchCampaign = vi.fn()

// Two useMutation calls per render: preview (first), launch (second).
let mIdx = 0
const mFns = [previewCampaign, launchCampaign]
vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  useMutation: () => {
    const fn = mFns[mIdx % 2]
    mIdx += 1
    return [fn, { loading: false }]
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

// Stub AudienceBuilder — its internals are covered by its own test.
vi.mock('@/components/messaging/AudienceBuilder', () => ({
  AudienceBuilder: () => <div data-testid="audience-builder" />,
}))

// Replace the Radix Select with a native select so onValueChange is reachable.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: never) => (
    <select
      data-testid="template-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
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

import { CampaignComposer } from '@/components/messaging/CampaignComposer'

const TEMPLATES = [
  { id: 't1', name: 'Reminder', body: 'Pay your tithe {{first_name}}', isActive: true },
  { id: 't2', name: 'Inactive', body: 'x', isActive: false },
]

beforeEach(() => {
  vi.clearAllMocks()
  mIdx = 0
  useQuery.mockReturnValue({ data: { messageTemplates: TEMPLATES } })
})

describe('CampaignComposer', () => {
  it('starts on the Audience step', () => {
    render(<CampaignComposer />)
    expect(screen.getByTestId('audience-builder')).toBeInTheDocument()
  })

  it('advances to the Message step and lists only active templates', () => {
    render(<CampaignComposer />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Select Template')).toBeInTheDocument()
    // Active template present, inactive filtered out.
    expect(screen.getByRole('option', { name: 'Reminder' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Inactive' })).not.toBeInTheDocument()
  })

  it('shows the empty-templates hint when none are active', () => {
    useQuery.mockReturnValue({ data: { messageTemplates: [TEMPLATES[1]] } })
    render(<CampaignComposer />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText(/No active templates/i)).toBeInTheDocument()
  })

  it('keeps Next disabled until a template is chosen, then previews the campaign', async () => {
    previewCampaign.mockResolvedValue({
      data: {
        previewCampaign: {
          recipientCount: 12,
          skippedCount: 2,
          sampleRendered: ['Pay your tithe Jane'],
        },
      },
    })
    render(<CampaignComposer />)
    fireEvent.click(screen.getByText('Next')) // -> Message step

    const next = screen.getByText('Next')
    expect(next.closest('button')).toBeDisabled()

    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 't1' } })
    // Template body preview appears.
    expect(screen.getByText('Pay your tithe {{first_name}}')).toBeInTheDocument()
    expect(screen.getByText('Next').closest('button')).not.toBeDisabled()

    fireEvent.click(screen.getByText('Next')) // -> preview
    await waitFor(() => expect(previewCampaign).toHaveBeenCalled())
    expect(previewCampaign.mock.calls[0][0].variables).toMatchObject({
      templateId: 't1',
      sampleSize: 3,
    })

    expect(await screen.findByText('12 recipient(s)')).toBeInTheDocument()
    expect(screen.getByText(/2 skipped/)).toBeInTheDocument()
    expect(screen.getByText('Pay your tithe Jane')).toBeInTheDocument()
  })

  it('launches the campaign and toasts success', async () => {
    previewCampaign.mockResolvedValue({
      data: { previewCampaign: { recipientCount: 5, skippedCount: 0, sampleRendered: [] } },
    })
    launchCampaign.mockResolvedValue({
      data: { launchCampaign: { success: true, message: 'Queued', campaign: { id: 'c1' } } },
    })
    const onLaunched = vi.fn()
    render(<CampaignComposer onLaunched={onLaunched} />)

    fireEvent.click(screen.getByText('Next'))
    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 't1' } })
    fireEvent.click(screen.getByText('Next'))

    const sendBtn = await screen.findByText(/Send to 5/)
    fireEvent.click(sendBtn)

    await waitFor(() => expect(launchCampaign).toHaveBeenCalled())
    expect(toastSuccess).toHaveBeenCalledWith('Queued')
    expect(onLaunched).toHaveBeenCalled()
  })

  it('warns and disables Send when the preview matches zero recipients', async () => {
    previewCampaign.mockResolvedValue({
      data: { previewCampaign: { recipientCount: 0, skippedCount: 0, sampleRendered: [] } },
    })
    render(<CampaignComposer />)
    fireEvent.click(screen.getByText('Next'))
    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 't1' } })
    fireEvent.click(screen.getByText('Next'))

    expect(await screen.findByText(/No recipients match/i)).toBeInTheDocument()
    expect(screen.getByText(/Send to 0/).closest('button')).toBeDisabled()
  })

  it('surfaces a toast when the preview request fails', async () => {
    previewCampaign.mockRejectedValue(new Error('preview boom'))
    render(<CampaignComposer />)
    fireEvent.click(screen.getByText('Next'))
    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 't1' } })
    fireEvent.click(screen.getByText('Next'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('preview boom'))
    // Stays on the Message step.
    expect(screen.getByText('Select Template')).toBeInTheDocument()
  })

  it('navigates back to a previous step', () => {
    render(<CampaignComposer />)
    fireEvent.click(screen.getByText('Next')) // Message
    fireEvent.click(screen.getByText('Back')) // Audience
    expect(screen.getByTestId('audience-builder')).toBeInTheDocument()
  })
})
