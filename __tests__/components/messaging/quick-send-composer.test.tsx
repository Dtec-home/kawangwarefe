/**
 * QuickSendComposer tests.
 *
 * Covers the single-screen send flow: message char counter / over-limit guard,
 * phone-number parsing + valid/invalid hints, recipient summary, the send-enabled
 * gate, and the launch mutation's onCompleted / onError toast branches.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

const launch = vi.fn()
let mutationOpts: { onCompleted?: (d: unknown) => void; onError?: (e: Error) => void } = {}

vi.mock('@apollo/client/react', () => ({
  useMutation: (_doc: unknown, opts: typeof mutationOpts) => {
    mutationOpts = opts
    return [launch, { loading: false }]
  },
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import { QuickSendComposer } from '@/components/messaging/QuickSendComposer'

const phoneBox = () =>
  screen.getByPlaceholderText(/One per line or comma-separated/i)
const messageBox = () => screen.getByLabelText('Message')

beforeEach(() => {
  vi.clearAllMocks()
  mutationOpts = {}
})

describe('QuickSendComposer', () => {
  it('tracks the character count and flags over-limit messages', () => {
    render(<QuickSendComposer />)
    fireEvent.change(messageBox(), { target: { value: 'hello' } })
    expect(screen.getByText('5 / 480')).toBeInTheDocument()

    const tooLong = 'a'.repeat(481)
    fireEvent.change(messageBox(), { target: { value: tooLong } })
    expect(screen.getByText(/Message is too long by 1 character/)).toBeInTheDocument()
  })

  it('counts valid phone numbers and warns when none parse', () => {
    render(<QuickSendComposer />)
    fireEvent.change(phoneBox(), { target: { value: '0712345678, 0723456789' } })
    expect(screen.getByText('2 valid numbers')).toBeInTheDocument()

    fireEvent.change(phoneBox(), { target: { value: 'nonsense' } })
    expect(screen.getByText(/No valid numbers found/)).toBeInTheDocument()
  })

  it('shows the recipient summary and keeps Send disabled until ready', () => {
    render(<QuickSendComposer />)
    expect(screen.getByText(/Add at least one recipient/i)).toBeInTheDocument()

    const sendBtn = screen.getByRole('button', { name: /Send/i })
    expect(sendBtn).toBeDisabled()

    fireEvent.change(messageBox(), { target: { value: 'Hi there' } })
    fireEvent.change(phoneBox(), { target: { value: '0712345678' } })

    expect(screen.getByText(/Ready to send to/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Send \(1\)/ })).not.toBeDisabled()
  })

  it('launches with the trimmed body and phone-number filter JSON', () => {
    render(<QuickSendComposer />)
    fireEvent.change(messageBox(), { target: { value: '  Pay up  ' } })
    fireEvent.change(phoneBox(), { target: { value: '0712345678' } })
    fireEvent.click(screen.getByRole('button', { name: /Send \(1\)/ }))

    expect(launch).toHaveBeenCalledTimes(1)
    const { variables } = launch.mock.calls[0][0]
    expect(variables.body).toBe('Pay up')
    expect(JSON.parse(variables.recipientFilterJson)).toEqual({
      extra_phone_numbers: ['0712345678'],
    })
  })

  it('toasts success and resets the form via onCompleted', () => {
    render(<QuickSendComposer />)
    fireEvent.change(messageBox(), { target: { value: 'Hi' } })
    fireEvent.change(phoneBox(), { target: { value: '0712345678' } })

    // Simulate Apollo invoking onCompleted after a successful mutation.
    act(() => {
      mutationOpts.onCompleted?.({
        launchQuickCampaign: {
          success: true,
          message: 'Sent to 1 recipient(s)',
          campaign: { id: 'c1', status: 'queued', recipientCount: 1 },
        },
      })
    })

    expect(toastSuccess).toHaveBeenCalledWith('Sent to 1 recipient(s)')
    // Form reset: message textarea cleared.
    expect((messageBox() as HTMLTextAreaElement).value).toBe('')
  })

  it('toasts the server message on an unsuccessful result', () => {
    render(<QuickSendComposer />)
    mutationOpts.onCompleted?.({
      launchQuickCampaign: { success: false, message: 'Quota exceeded', campaign: null },
    })
    expect(toastError).toHaveBeenCalledWith('Quota exceeded')
  })

  it('toasts the error message on a network failure', () => {
    render(<QuickSendComposer />)
    mutationOpts.onError?.(new Error('connection lost'))
    expect(toastError).toHaveBeenCalledWith('connection lost')
  })
})
