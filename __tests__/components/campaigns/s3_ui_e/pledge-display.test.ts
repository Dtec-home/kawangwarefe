import { describe, expect, it } from 'vitest'

import {
  canCancelPledge,
  isPledgeOverdue,
  paidPercent,
  payBalanceHref,
  pledgeStatusLabel,
  pledgeTargetKind,
  pledgeTargetName,
  pledgeTotals,
} from '@/components/pledges/member/pledge-display'
import { emptyPledgeForm, toPledgeInput, validatePledgeForm } from '@/components/pledges/member/pledge-form'

const base = {
  campaignTitle: 'New Church Roof',
  campaignSlug: 'new-church-roof',
  categoryName: 'Building Fund',
  amount: '10000.00',
  paid: '4000.00',
  balance: '6000.00',
  dueDate: '2026-12-31',
  status: 'OPEN' as const,
}

describe('pledge display rules', () => {
  it('names the campaign, else the department', () => {
    expect(pledgeTargetName(base)).toBe('New Church Roof')
    expect(pledgeTargetName({ campaignTitle: null, categoryName: 'Welfare' })).toBe('Welfare')
    expect(pledgeTargetName({ campaignTitle: null, categoryName: null })).toBe('General pledge')
    expect(pledgeTargetKind({ campaignTitle: null })).toBe('Department')
  })

  it('labels every status', () => {
    expect(pledgeStatusLabel('PENDING_OTP')).toBe('Awaiting confirmation')
    expect(pledgeStatusLabel('CANCELLED')).toBe('Cancelled')
  })

  it('is overdue by status or by a past due date with a balance', () => {
    expect(isPledgeOverdue({ ...base, status: 'OVERDUE' }, '2026-10-21')).toBe(true)
    expect(isPledgeOverdue({ ...base, dueDate: '2026-10-20' }, '2026-10-21')).toBe(true)
    expect(isPledgeOverdue({ ...base, dueDate: '2026-10-21' }, '2026-10-21')).toBe(false)
    expect(isPledgeOverdue({ ...base, dueDate: null }, '2026-10-21')).toBe(false)
    expect(isPledgeOverdue({ ...base, dueDate: '2026-01-01', status: 'FULFILLED', balance: '0.00' }, '2026-10-21')).toBe(false)
  })

  it('pays a campaign pledge on the campaign give page', () => {
    expect(payBalanceHref(base)).toBe('/contribute?campaign=new-church-roof')
    expect(payBalanceHref({ campaignSlug: null })).toBe('/contribute')
  })

  it('only cancels pledges with a balance still open', () => {
    expect(canCancelPledge(base)).toBe(true)
    expect(canCancelPledge({ ...base, status: 'OVERDUE' })).toBe(true)
    expect(canCancelPledge({ ...base, status: 'CANCELLED' })).toBe(false)
    expect(canCancelPledge({ ...base, balance: '0.00' })).toBe(false)
  })

  it('caps the paid percentage', () => {
    expect(paidPercent(base)).toBe(40)
    expect(paidPercent({ amount: '100', paid: '250' })).toBe(100)
    expect(paidPercent({ amount: '0', paid: '10' })).toBe(0)
  })

  it('totals pledges that are not cancelled', () => {
    expect(pledgeTotals([base, { ...base, status: 'CANCELLED' }])).toEqual({ pledged: 10000, paid: 4000, balance: 6000 })
  })
})

describe('make a pledge form', () => {
  it('needs a target and an amount of at least KES 1', () => {
    expect(validatePledgeForm(emptyPledgeForm(), '2026-10-21')).toEqual({
      target: 'Choose a campaign',
      amount: 'Amount must be at least KES 1',
    })
    expect(validatePledgeForm({ ...emptyPledgeForm('department'), amount: '50' }, '2026-10-21')).toEqual({
      target: 'Choose a department',
    })
  })

  it('refuses a due date in the past', () => {
    const values = { ...emptyPledgeForm(), campaignId: '42', amount: '100', dueDate: '2026-10-20' }
    expect(validatePledgeForm(values, '2026-10-21')).toEqual({ dueDate: 'The due date cannot be in the past' })
    expect(validatePledgeForm({ ...values, dueDate: '2026-10-21' }, '2026-10-21')).toEqual({})
  })

  it('sends exactly one of campaign or department', () => {
    const values = { ...emptyPledgeForm(), campaignId: '42', categoryId: '7', amount: ' 500 ', dueDate: '' }
    expect(toPledgeInput(values)).toEqual({ amount: '500', campaignId: '42', dueDate: null })
    expect(toPledgeInput({ ...values, kind: 'department', dueDate: '2026-12-31' })).toEqual({
      amount: '500',
      categoryId: '7',
      dueDate: '2026-12-31',
    })
  })
})
