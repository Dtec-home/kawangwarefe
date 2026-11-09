/** DT-2: the campaign form's daily-total switches (ADR-0015 D3, US-D4). */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/components/campaigns/admin/form/use-campaign-departments', () => ({
  useCampaignDepartments: () => ({ departments: [{ id: '3', name: 'Land Purchase', code: 'LAND' }] }),
  useDepartmentPurposes: () => [],
}))

import { CampaignForm } from '@/components/campaigns/admin/form/campaign-form'
import { EMPTY_CAMPAIGN_FORM, type CampaignFormValues } from '@/components/campaigns/admin/form/campaign-form-schema'

const valid: CampaignFormValues = {
  ...EMPTY_CAMPAIGN_FORM, title: 'Shamba', categoryId: '3', targetAmount: '1000000', paybillCode: 'SHAMBA',
}

describe('CampaignForm daily total', () => {
  it('is on by default, quiet days off; an admin can turn it off', async () => {
    const onSubmit = vi.fn()
    render(<CampaignForm defaultValues={valid} submitLabel="Save" onSubmit={onSubmit} />)
    const daily = screen.getByRole('switch', { name: 'Daily total to the WhatsApp group' })
    expect(daily).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Post the daily total on days with no gifts' })).not.toBeChecked()
    fireEvent.click(daily)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ dailyTotalEnabled: false, dailyTotalPostWhenZero: false })
  })
})
