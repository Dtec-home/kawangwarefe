/**
 * Campaign detail page tests (Sprint 8 / Epic E6).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/messaging/42',
}))

// Local next/link mock that supports children (global mock returns a
// raw DOMElement which React 19 rejects when children are present).
vi.mock('next/link', () => ({
  default: ({ href, children }: any) =>
    React.createElement('a', { href }, children),
}))

const campaign = {
  id: '42', status: 'sending', recipientCount: 10, sentCount: 7, failedCount: 2,
  startedAt: '2026-04-24T10:00:00Z', completedAt: null, createdAt: '2026-04-24T09:00:00Z',
  recipientFilterJson: '{}',
  template: { id: '1', name: 'Welcome', body: 'Hi {{first_name}}' },
}

const recipients = [
  { id: 'a', phoneNumber: '254700000001', status: 'sent', renderedBody: 'Hi X', providerMessageId: 'P1', error: '', sentAt: '2026-04-24T10:05:00Z' },
  { id: 'b', phoneNumber: '254700000002', status: 'failed', renderedBody: 'Hi Y', providerMessageId: '', error: 'provider rejected', sentAt: null },
  { id: 'c', phoneNumber: '254700000003', status: 'pending', renderedBody: 'Hi Z', providerMessageId: '', error: '', sentAt: null },
]

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: { messageCampaign: campaign, messageCampaignRecipients: recipients },
    loading: false, error: null,
  }),
}))

vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => React.createElement('div', null, children),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => React.createElement('div', null, children),
}))

import CampaignDetailPage, { buildFailuresCsv } from '@/app/(dashboard)/admin/messaging/[id]/page'

describe('buildFailuresCsv', () => {
  it('includes only failed rows', () => {
    const csv = buildFailuresCsv(recipients as any)
    expect(csv.split('\n')).toHaveLength(2)  // header + one failed row
    expect(csv).toContain('provider rejected')
    expect(csv).not.toContain('Hi X')
  })

  it('escapes embedded quotes', () => {
    const csv = buildFailuresCsv([
      { id: '1', phoneNumber: '254', status: 'failed', renderedBody: '', providerMessageId: '', error: 'he said "no"', sentAt: null } as any,
    ])
    expect(csv).toContain('"he said ""no"""')
  })
})

describe('CampaignDetailPage', () => {
  it('renders the campaign and recipient table', () => {
    render(<CampaignDetailPage />)
    expect(screen.getByText(/Campaign #42/)).toBeInTheDocument()
    expect(screen.getByText('254700000001')).toBeInTheDocument()
    expect(screen.getByText('provider rejected')).toBeInTheDocument()
  })
})
