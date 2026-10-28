/** DC-4.3: staff see where the WhatsApp leaderboard goes and how the newest post went. */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

import { LeaderboardDeliveryCard, shortGroupId } from '@/components/campaigns/admin/leaderboard/leaderboard-delivery-card'

const GROUP = '120363278722742692@g.us'
const post = (o: Record<string, unknown> = {}) => ({
  status: 'sent',
  attempts: 1,
  lastError: '',
  sentAt: '2026-10-28T07:05:00Z',
  createdAt: '2026-10-28T07:04:00Z',
  ...o,
})

afterEach(cleanup)

describe('LeaderboardDeliveryCard', () => {
  it('says how to switch it on when no group is set', () => {
    render(<LeaderboardDeliveryCard campaign={{ whatsappGroupId: '', lastLeaderboardPost: null }} />)
    expect(screen.getByText(/No WhatsApp group set/)).toBeInTheDocument()
  })

  it('names the group and waits for the first gift', () => {
    render(<LeaderboardDeliveryCard campaign={{ whatsappGroupId: GROUP, lastLeaderboardPost: null }} />)
    expect(screen.getByText(/…742692@g.us/)).toBeInTheDocument()
    expect(screen.getByText(/Nothing posted yet/)).toBeInTheDocument()
  })

  it('shows a sent post in Nairobi time without an error line', () => {
    render(<LeaderboardDeliveryCard campaign={{ whatsappGroupId: GROUP, lastLeaderboardPost: post() }} />)
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText(/10:05/)).toBeInTheDocument()
    expect(screen.queryByTestId('leaderboard-error')).not.toBeInTheDocument()
  })

  it('shows why a post failed and how many tries it took', () => {
    render(
      <LeaderboardDeliveryCard
        campaign={{
          whatsappGroupId: GROUP,
          lastLeaderboardPost: post({ status: 'failed', attempts: 8, sentAt: null, lastError: 'gave up after 8 attempts: down' }),
        }}
      />,
    )
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('after 8 tries')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-error')).toHaveTextContent('gave up after 8 attempts: down')
  })

  it('shortens group ids', () => {
    expect(shortGroupId(GROUP)).toBe('…742692@g.us')
    expect(shortGroupId('123@g.us')).toBe('123@g.us')
  })
})
