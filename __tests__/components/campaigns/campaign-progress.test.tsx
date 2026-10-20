import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CampaignProgress } from '@/components/campaigns/shared/campaign-progress'

const progress = {
  target: '100000.00',
  raised: '24800.00',
  remaining: '75200.00',
  percent: 24.8,
  donorCount: 37,
  giftCount: 41,
  pledged: '60000.00',
}

describe('CampaignProgress', () => {
  it('shows raised, target, percent and donors', () => {
    render(<CampaignProgress progress={progress} />)
    expect(screen.getByText('KES 24,800.00')).toBeInTheDocument()
    expect(screen.getByText(/of KES 100,000.00/)).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('37 donors')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '24.8')
  })

  it('caps the bar at 100% when the target is passed', () => {
    render(<CampaignProgress progress={{ ...progress, raised: '150000.00', percent: 150 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('shows pledges only when asked', () => {
    const { rerender } = render(<CampaignProgress progress={progress} />)
    expect(screen.queryByText(/pledged/i)).not.toBeInTheDocument()
    rerender(<CampaignProgress progress={progress} showPledged />)
    expect(screen.getByText('KES 60,000.00 pledged')).toBeInTheDocument()
  })

  it('uses the singular for one donor', () => {
    render(<CampaignProgress progress={{ ...progress, donorCount: 1 }} />)
    expect(screen.getByText('1 donor')).toBeInTheDocument()
  })
})
