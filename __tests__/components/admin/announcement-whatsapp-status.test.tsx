import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AnnouncementWhatsAppStatus, whatsappStatusLabel } from '@/components/admin/announcement-whatsapp-status'

describe('whatsappStatusLabel (AN-1)', () => {
  it.each([
    [{ postToWhatsapp: false, whatsappStatus: '' }, 'Web only'],
    [{ postToWhatsapp: true, whatsappStatus: '' }, 'WhatsApp: waiting to post'],
    [{ postToWhatsapp: true, whatsappStatus: 'pending' }, 'WhatsApp: waiting to post'],
    [{ postToWhatsapp: true, whatsappStatus: 'sent' }, 'Posted to WhatsApp'],
    [{ postToWhatsapp: true, whatsappStatus: 'failed' }, 'WhatsApp post failed'],
    [{ postToWhatsapp: true, whatsappStatus: 'skipped' }, 'Not posted to WhatsApp'],
  ])('%o -> %s', (announcement, label) => {
    expect(whatsappStatusLabel(announcement)).toBe(label)
  })
})

describe('AnnouncementWhatsAppStatus', () => {
  it('renders the label with a test id', () => {
    render(<AnnouncementWhatsAppStatus announcement={{ postToWhatsapp: true, whatsappStatus: 'sent' }} />)
    expect(screen.getByTestId('announcement-whatsapp-status')).toHaveTextContent('Posted to WhatsApp')
  })

  it('renders nothing when the backend sent no WhatsApp fields', () => {
    const { container } = render(<AnnouncementWhatsAppStatus announcement={{}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
