/**
 * Lane S3-UI-F: pure helpers of the admin pledge register.
 */

import { render, screen } from '@testing-library/react'

import {
  PledgeStatusBadge,
  isCancellable,
  pledgeSourceLabel,
  pledgeTarget,
} from '@/components/pledges/admin/pledge-labels'
import { pledgeScope } from '@/components/pledges/admin/pledge-register'
import { NO_FILTERS } from '@/components/pledges/admin/pledge-filters'
import { toRecordPledgeVars } from '@/components/pledges/admin/record-pledge-dialog'
import { PledgeSummaryCards } from '@/components/pledges/admin/pledge-summary-cards'
import { summary } from './fixtures'

describe('pledge labels', () => {
  it('names each source in plain words and keeps an unknown one', () => {
    expect(pledgeSourceLabel('admin')).toBe('Pledge card')
    expect(pledgeSourceLabel('PUBLIC_PAGE')).toBe('Public page')
    expect(pledgeSourceLabel('ussd')).toBe('USSD')
    expect(pledgeSourceLabel('kiosk')).toBe('kiosk')
  })

  it('shows the campaign, else the department', () => {
    expect(pledgeTarget({ campaignTitle: 'Church Building', categoryName: 'Building Fund' })).toBe('Church Building')
    expect(pledgeTarget({ campaignTitle: null, categoryName: 'Youth' })).toBe('Youth')
    expect(pledgeTarget({ campaignTitle: null, categoryName: null })).toBe('—')
  })

  it('lets only pledges still owed be cancelled', () => {
    expect(isCancellable('OPEN')).toBe(true)
    expect(isCancellable('OVERDUE')).toBe(true)
    expect(isCancellable('PENDING_OTP')).toBe(true)
    expect(isCancellable('FULFILLED')).toBe(false)
    expect(isCancellable('CANCELLED')).toBe(false)
  })

  it('labels the status pill', () => {
    render(<PledgeStatusBadge status="OVERDUE" />)
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })
})

describe('pledgeScope', () => {
  it('is everything with no filters', () => {
    expect(pledgeScope(NO_FILTERS)).toEqual({ campaignId: null, categoryId: null })
  })

  it('follows the campaign and department filters', () => {
    expect(pledgeScope({ ...NO_FILTERS, campaign: '9', department: '3' })).toEqual({ campaignId: '9', categoryId: '3' })
  })

  it('is the fixed campaign on a campaign tab, whatever the filters say', () => {
    expect(pledgeScope({ ...NO_FILTERS, department: '3' }, '9')).toEqual({ campaignId: '9', categoryId: null })
  })
})

describe('toRecordPledgeVars', () => {
  const base = {
    phoneNumber: '712345678',
    memberName: '  ',
    kind: 'campaign' as const,
    campaignId: '9',
    categoryId: '4',
    amount: '5000',
    dueDate: '',
  }

  it('sends the campaign only, an international number and no empty name or date', () => {
    expect(toRecordPledgeVars(base)).toEqual({
      phoneNumber: '254712345678',
      memberName: null,
      input: { amount: '5000', campaignId: '9', categoryId: null, dueDate: null },
    })
  })

  it('sends the department only for a department pledge', () => {
    expect(toRecordPledgeVars({ ...base, kind: 'department', memberName: ' Mary ', dueDate: '2027-01-31' })).toEqual({
      phoneNumber: '254712345678',
      memberName: 'Mary',
      input: { amount: '5000', campaignId: null, categoryId: '4', dueDate: '2027-01-31' },
    })
  })
})

describe('PledgeSummaryCards', () => {
  it('shows skeletons while loading and nothing when there is no summary', () => {
    const { rerender, container } = render(<PledgeSummaryCards summary={undefined} loading />)
    expect(screen.getByTestId('pledge-summary-loading')).toBeInTheDocument()
    rerender(<PledgeSummaryCards summary={undefined} loading={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('formats the totals as KES', () => {
    render(<PledgeSummaryCards summary={summary('1000.00', '250.00', '750.00', 3)} loading={false} />)
    expect(screen.getByTestId('pledge-total-outstanding')).toHaveTextContent('KES 750.00')
    expect(screen.getByTestId('pledge-total-count')).toHaveTextContent('3')
  })
})
