import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { toast } from 'sonner'
import { ShareBar } from '@/components/campaigns/shared/share-bar'

const URL = 'https://church.example/campaigns/building-fund'

afterEach(() => {
  vi.restoreAllMocks()
  // @ts-expect-error — test cleanup of the optional Web Share API
  delete navigator.share
})

describe('ShareBar', () => {
  it('links to WhatsApp, Facebook, X and SMS', () => {
    render(<ShareBar url={URL} text="Help us build" />)
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href', expect.stringContaining('https://wa.me/?text='),
    )
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute(
      'href', expect.stringContaining('facebook.com/sharer'),
    )
    expect(screen.getByRole('link', { name: /^x$/i })).toHaveAttribute(
      'href', expect.stringContaining('x.com/intent/post'),
    )
    expect(screen.getByRole('link', { name: /sms/i })).toHaveAttribute(
      'href', expect.stringMatching(/^sms:/),
    )
  })

  it('copies the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ShareBar url={URL} text="Help us build" />)
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(URL))
    expect(toast.success).toHaveBeenCalled()
  })

  it('offers the native share sheet only where the browser has one', async () => {
    const { unmount } = render(<ShareBar url={URL} text="Help us build" />)
    expect(screen.queryByRole('button', { name: /^share$/i })).not.toBeInTheDocument()
    unmount()

    const share = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share })
    render(<ShareBar url={URL} text="Help us build" title="Building Fund" />)
    fireEvent.click(await screen.findByRole('button', { name: /^share$/i }))
    expect(share).toHaveBeenCalledWith({ title: 'Building Fund', text: 'Help us build', url: URL })
  })
})
