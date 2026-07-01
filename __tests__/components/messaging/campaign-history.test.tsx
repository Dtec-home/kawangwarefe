/**
 * CampaignHistory tests.
 *
 * Drives the empty / populated / active-polling branches and the per-row
 * formatting (sent ratio, failed suffix, status badge, deep link) by mocking
 * useQuery directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const useQuery = vi.fn()
vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}))

import { CampaignHistory } from '@/components/messaging/CampaignHistory'

const makeCampaign = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'c1',
  status: 'completed',
  recipientCount: 10,
  sentCount: 10,
  failedCount: 0,
  createdAt: '2026-01-15T10:00:00Z',
  template: { id: 't1', name: 'Weekly Update' },
  ...over,
})

beforeEach(() => {
  useQuery.mockReturnValue({ data: { messageCampaigns: [] } })
})

describe('CampaignHistory', () => {
  it('polls every 5 seconds', () => {
    render(<CampaignHistory />)
    const [, opts] = useQuery.mock.calls.at(-1)!
    expect(opts.pollInterval).toBe(5000)
  })

  it('shows the empty state when there are no campaigns', () => {
    render(<CampaignHistory />)
    expect(screen.getByText(/No campaigns yet/i)).toBeInTheDocument()
  })

  it('renders a row per campaign with template name, sent ratio, and status', () => {
    useQuery.mockReturnValue({
      data: { messageCampaigns: [makeCampaign({ sentCount: 7, recipientCount: 10 })] },
    })
    render(<CampaignHistory />)
    expect(screen.getByText('Weekly Update')).toBeInTheDocument()
    expect(screen.getByText(/7\/10 sent/)).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('links each row to the campaign detail page', () => {
    useQuery.mockReturnValue({
      data: { messageCampaigns: [makeCampaign({ id: 'abc' })] },
    })
    render(<CampaignHistory />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/admin/messaging/abc')
  })

  it('shows the failed-count suffix only when failures exist', () => {
    useQuery.mockReturnValue({
      data: { messageCampaigns: [makeCampaign({ failedCount: 3 })] },
    })
    render(<CampaignHistory />)
    expect(screen.getByText(/3 failed/)).toBeInTheDocument()
  })

  it('shows the live-refresh banner when a campaign is queued or sending', () => {
    useQuery.mockReturnValue({
      data: { messageCampaigns: [makeCampaign({ status: 'sending' })] },
    })
    render(<CampaignHistory />)
    expect(screen.getByText(/Live — refreshing every 5/i)).toBeInTheDocument()
  })

  it('hides the live banner when all campaigns are terminal', () => {
    useQuery.mockReturnValue({
      data: { messageCampaigns: [makeCampaign({ status: 'completed' })] },
    })
    render(<CampaignHistory />)
    expect(screen.queryByText(/Live — refreshing/i)).not.toBeInTheDocument()
  })
})
