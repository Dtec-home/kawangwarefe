import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import { GraphQLError } from 'graphql'

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

import { ACTIVE_CAMPAIGNS_FOR_LINES } from '@/lib/graphql/fundraising/give'
import { LineCampaignFields, staleCampaignLines } from '@/components/campaigns/give/line-campaign-fields'

const CAMPAIGNS = [
  { __typename: 'CampaignType', id: '42', title: 'New Church Roof', categoryId: '4', categoryName: 'Building Fund' },
  { __typename: 'CampaignType', id: '43', title: 'Chairs', categoryId: '4', categoryName: 'Building Fund' },
]

const ok: MockedResponse = {
  request: { query: ACTIVE_CAMPAIGNS_FOR_LINES },
  result: { data: { campaigns: CAMPAIGNS } },
  maxUsageCount: 5,
}

describe('staleCampaignLines', () => {
  it('clears a campaign that is not one of the line department campaigns', () => {
    const lines = [
      { categoryId: '1', amount: '10', campaignId: '42' },
      { categoryId: '4', amount: '10', campaignId: '43' },
    ]
    expect(staleCampaignLines(lines, CAMPAIGNS)).toEqual([
      { categoryId: '1', amount: '10', campaignId: undefined },
      { categoryId: '4', amount: '10', campaignId: '43' },
    ])
  })

  it('returns null when nothing needs clearing', () => {
    expect(staleCampaignLines([{ categoryId: '4', amount: '1', campaignId: '42' }], CAMPAIGNS)).toBeNull()
    expect(staleCampaignLines([{ categoryId: '1', amount: '1' }], CAMPAIGNS)).toBeNull()
  })
})

describe('LineCampaignFields', () => {
  it('offers the campaigns of the line department, with "No campaign" first', async () => {
    const onChange = vi.fn()
    render(
      <MockedProvider mocks={[ok]}>
        <LineCampaignFields lines={[{ categoryId: '1', amount: '' }, { categoryId: '4', amount: '' }]} onChange={onChange} />
      </MockedProvider>
    )
    const row = await screen.findByTestId('line-campaign-1')
    expect(row).toHaveTextContent('Line 2 · Building Fund')
    expect(screen.queryByTestId('line-campaign-0')).not.toBeInTheDocument()
    const options = Array.from(row.querySelectorAll('option')).map((o) => o.textContent)
    expect(options).toEqual(['No campaign', 'New Church Roof', 'Chairs'])

    fireEvent.change(row.querySelector('select')!, { target: { value: '43' } })
    expect(onChange).toHaveBeenCalledWith([{ categoryId: '1', amount: '' }, { categoryId: '4', amount: '', campaignId: '43' }])
  })

  it('choosing "No campaign" clears the tag', async () => {
    const onChange = vi.fn()
    render(
      <MockedProvider mocks={[ok]}>
        <LineCampaignFields lines={[{ categoryId: '4', amount: '', campaignId: '42' }]} onChange={onChange} />
      </MockedProvider>
    )
    const row = await screen.findByTestId('line-campaign-0')
    fireEvent.change(row.querySelector('select')!, { target: { value: 'none' } })
    expect(onChange).toHaveBeenCalledWith([{ categoryId: '4', amount: '', campaignId: undefined }])
  })

  it('clears a stale campaign once campaigns load', async () => {
    const onChange = vi.fn()
    render(
      <MockedProvider mocks={[ok]}>
        <LineCampaignFields lines={[{ categoryId: '1', amount: '5', campaignId: '42' }]} onChange={onChange} />
      </MockedProvider>
    )
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([{ categoryId: '1', amount: '5', campaignId: undefined }]))
  })

  it('renders nothing when listing campaigns is refused', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <MockedProvider
        mocks={[{ request: { query: ACTIVE_CAMPAIGNS_FOR_LINES }, result: { errors: [new GraphQLError('Not allowed')] } }]}
      >
        <LineCampaignFields lines={[{ categoryId: '4', amount: '' }]} onChange={onChange} />
      </MockedProvider>
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(container).toBeEmptyDOMElement()
    expect(onChange).not.toHaveBeenCalled()
  })
})
