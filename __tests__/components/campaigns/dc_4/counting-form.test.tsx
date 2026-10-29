/**
 * DC-4.1: the campaign form chooses what counts while the campaign is a draft
 * or awaiting approval, shows it read-only afterwards, and never resets it.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('@/components/campaigns/admin/form/use-campaign-departments', () => ({
  useCampaignDepartments: () => ({ departments: [{ id: '3', name: 'Land Purchase', code: 'LAND' }] }),
  useDepartmentPurposes: () => [],
}))

import { CampaignForm } from '@/components/campaigns/admin/form/campaign-form'
import {
  EMPTY_CAMPAIGN_FORM,
  WHATSAPP_GROUP_PATTERN,
  campaignFormSchema,
  toCampaignInput,
  type CampaignFormValues,
} from '@/components/campaigns/admin/form/campaign-form-schema'
import { countingIsOnForm } from '@/components/campaigns/admin/counting/counting-mode'

const valid: CampaignFormValues = {
  ...EMPTY_CAMPAIGN_FORM,
  title: 'Shamba',
  categoryId: '3',
  targetAmount: '1000000',
  paybillCode: 'SHAMBA',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('countingIsOnForm', () => {
  it.each([
    [null, true],
    ['DRAFT', true],
    ['PENDING_APPROVAL', true],
    ['ACTIVE', false],
    ['PAUSED', false],
    ['CLOSED', false],
  ] as const)('%s → %s', (status, expected) => {
    expect(countingIsOnForm(status)).toBe(expected)
  })
})

describe('toCampaignInput', () => {
  it('sends the counting mode while it is on the form', () => {
    expect(toCampaignInput({ ...valid, countingMode: 'DEPARTMENT' }).countingMode).toBe('DEPARTMENT')
  })

  it('leaves it out (null = keep) once the campaign is approved', () => {
    expect(toCampaignInput({ ...valid, countingMode: 'DEPARTMENT' }, { countingEditable: false }).countingMode).toBeNull()
  })
})

describe('WhatsApp group id', () => {
  const errors = (whatsappGroupId: string) => {
    const result = campaignFormSchema.safeParse({ ...valid, whatsappGroupId })
    return result.success ? [] : result.error.issues.map((i) => i.message)
  }

  it.each(['', '120363278722742692@g.us', '254700000000-1612345678@g.us', ' 120363278722742692@g.us '])(
    'accepts %j',
    (value) => expect(errors(value)).toEqual([]),
  )

  it.each(['254700000000@c.us', 'my group', 'https://chat.whatsapp.com/abc'])('rejects %j like the backend', (value) => {
    expect(errors(value)).toEqual(['Paste a group id ending in @g.us'])
    expect(WHATSAPP_GROUP_PATTERN.test(value)).toBe(false)
  })
})

describe('CampaignForm counting choice', () => {
  it('names the department and submits the chosen mode', async () => {
    const onSubmit = vi.fn()
    render(<CampaignForm defaultValues={valid} submitLabel="Save as draft" onSubmit={onSubmit} />)
    const department = screen.getByRole('radio', { name: /All Land Purchase giving/ })
    expect(screen.getByRole('radio', { name: /Gifts to this campaign only/ })).toBeChecked()
    fireEvent.click(department)
    fireEvent.click(screen.getByRole('button', { name: 'Save as draft' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].countingMode).toBe('DEPARTMENT')
  })

  it('shows it read-only after approval and sends nothing for it', async () => {
    const onSubmit = vi.fn()
    render(
      <CampaignForm
        defaultValues={{ ...valid, countingMode: 'DEPARTMENT' }}
        submitLabel="Save changes"
        onSubmit={onSubmit}
        countingEditable={false}
      />,
    )
    expect(screen.getByRole('radio', { name: /All Land Purchase giving/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /All Land Purchase giving/ })).toBeDisabled()
    expect(screen.getByText(/To change it, ask from the Overview/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].countingMode).toBeNull()
  })

  it('refuses a group id that is not a WhatsApp group', async () => {
    const onSubmit = vi.fn()
    render(<CampaignForm defaultValues={{ ...valid, whatsappGroupId: '254700000000@c.us' }} submitLabel="Save" onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Paste a group id ending in @g.us')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
