/**
 * Admin messaging page tests (Sprint 6 / Epic E4.2).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const createTemplateFn = vi.fn().mockResolvedValue({
  data: {
    createMessageTemplate: {
      success: true,
      message: 'Template created',
      template: { id: '1', name: 'Welcome', body: 'Hi', isActive: true },
    },
  },
})

const previewFn = vi.fn().mockResolvedValue({
  data: {
    previewCampaign: {
      recipientCount: 12,
      skippedCount: 1,
      sampleRendered: ['Hi Amina', 'Hi Baraka'],
    },
  },
})

const launchFn = vi.fn().mockResolvedValue({
  data: {
    launchCampaign: {
      success: true,
      message: 'Campaign launched',
      campaign: { id: '9', status: 'queued', recipientCount: 12 },
    },
  },
})

vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: any) => {
    const name = doc?.definitions?.[0]?.name?.value ?? ''
    if (name === 'GetMessageTemplates') {
      return {
        data: {
          messageTemplates: [
            { id: '1', name: 'Welcome', body: 'Hi {{first_name}}', isActive: true, createdAt: '', updatedAt: '' },
          ],
        },
        loading: false, error: null, refetch: vi.fn(),
      }
    }
    if (name === 'GetMessageCampaigns') {
      return {
        data: {
          messageCampaigns: [
            {
              id: '9', status: 'completed', recipientCount: 12, sentCount: 10,
              failedCount: 2, startedAt: '', completedAt: '', createdAt: '',
              template: { id: '1', name: 'Welcome' },
            },
          ],
        },
        loading: false, error: null, refetch: vi.fn(),
      }
    }
    return { loading: false, error: null, data: null }
  },
  useMutation: (doc: any) => {
    const name = doc?.definitions?.[0]?.name?.value ?? ''
    if (name === 'CreateMessageTemplate') return [createTemplateFn, { loading: false }]
    if (name === 'PreviewCampaign') return [previewFn, { loading: false }]
    if (name === 'LaunchCampaign') return [launchFn, { loading: false }]
    return [vi.fn(), { loading: false }]
  },
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false, error: null }],
}))

vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => React.createElement('div', null, children),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => React.createElement('div', null, children),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import MessagingPage from '@/app/(dashboard)/admin/messaging/page'
import { TemplateManager } from '@/components/messaging/TemplateManager'

describe('MessagingPage', () => {
  it('renders the messaging shell heading', () => {
    render(<MessagingPage />)
    expect(screen.getByText('Messaging')).toBeInTheDocument()
  })
})

describe('TemplateManager', () => {
  it('lists templates from the server', () => {
    render(<TemplateManager />)
    expect(screen.getAllByText('Welcome').length).toBeGreaterThan(0)
  })

  it('creates a template when the form is submitted', async () => {
    render(<TemplateManager />)
    // The create form is revealed by the "New Template" toggle.
    fireEvent.click(screen.getByRole('button', { name: /new template/i }))
    const textboxes = screen.getAllByRole('textbox')
    fireEvent.change(textboxes[0], { target: { value: 'NewT' } }) // Name (input)
    fireEvent.change(textboxes[1], { target: { value: 'Hi' } })   // Body (textarea)
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await Promise.resolve()
    expect(createTemplateFn).toHaveBeenCalled()
    const call = createTemplateFn.mock.calls[createTemplateFn.mock.calls.length - 1][0]
    expect(call.variables).toEqual({ name: 'NewT', body: 'Hi' })
  })
})
