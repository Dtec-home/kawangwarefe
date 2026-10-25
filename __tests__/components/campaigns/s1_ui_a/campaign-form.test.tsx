import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'

vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: { name?: string; value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

import { CampaignForm } from '@/components/campaigns/admin/form/campaign-form'
import { EMPTY_CAMPAIGN_FORM } from '@/components/campaigns/admin/form/campaign-form-schema'
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from '@/lib/graphql/queries'
import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import { category, role } from './fixtures'

const purposes = [
  { __typename: 'DepartmentPurposeType', id: '7', name: 'Roofing', code: 'ROOF', description: '', isActive: true },
]

const mocks: MockedResponse[] = [
  { request: { query: GET_CURRENT_USER_ROLE }, result: { data: { currentUserRole: role() } }, maxUsageCount: 5 },
  {
    request: { query: GET_CONTRIBUTION_CATEGORIES },
    result: { data: { contributionCategories: [category('3', 'Building Fund', 'BUILDING')] } },
    maxUsageCount: 5,
  },
  {
    request: { query: GET_DEPARTMENT_PURPOSES, variables: { categoryId: '3', isActive: true } },
    result: { data: { departmentPurposes: purposes } },
    maxUsageCount: 5,
  },
]

function renderForm(onSubmit = vi.fn(), defaults = { ...EMPTY_CAMPAIGN_FORM, categoryId: '3' }) {
  render(
    <MockedProvider mocks={mocks}>
      <CampaignForm defaultValues={defaults} submitLabel="Save" onSubmit={onSubmit} serverError="Refused" />
    </MockedProvider>
  )
  return onSubmit
}

afterEach(cleanup)

describe('CampaignForm', () => {
  it('upper-cases the Pay Bill code as it is typed', () => {
    renderForm()
    const code = screen.getByLabelText('Pay Bill account code') as HTMLInputElement
    fireEvent.change(code, { target: { value: 'bu ild' } })
    expect(code.value).toBe('BUILD')
  })

  it('offers the purposes of the chosen department and sends the chosen one', async () => {
    const onSubmit = renderForm(vi.fn(), {
      ...EMPTY_CAMPAIGN_FORM,
      title: 'Roof',
      categoryId: '3',
      targetAmount: '5000',
      paybillCode: 'ROOF',
    })
    const purpose = (await screen.findByLabelText('purposeId')) as HTMLSelectElement
    fireEvent.change(purpose, { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ purposeId: '7', categoryId: '3' })
  })

  it('adds a YouTube gallery item and checks its link', async () => {
    const onSubmit = renderForm(vi.fn(), {
      ...EMPTY_CAMPAIGN_FORM,
      title: 'Roof',
      categoryId: '3',
      targetAmount: '5000',
      paybillCode: 'ROOF',
    })
    fireEvent.click(screen.getByRole('button', { name: /Add photo or video/ }))
    fireEvent.change(screen.getByLabelText('gallery.0.kind'), { target: { value: 'youtube' } })
    fireEvent.change(screen.getByLabelText('Item 1 link'), { target: { value: 'https://example.com/v' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Enter a YouTube link (youtube.com or youtu.be)')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Item 1 link'), { target: { value: 'https://youtu.be/abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].gallery).toEqual([{ kind: 'youtube', url: 'https://youtu.be/abc' }])
  })

  it('removes a gallery item and shows the server message', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /Add photo or video/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove item 1' }))
    expect(screen.queryByLabelText('Item 1 link')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Refused')
  })
})
