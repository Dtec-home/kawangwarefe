/**
 * Binding for `fundraising/admin_campaigns.feature` (Fundraising S1, lane S1-UI-A).
 *
 * Drives the real campaign list, create form and overview through Apollo's
 * MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Native <select> so a choice can be made in jsdom; `name` becomes the label.
interface SelectMockProps {
  name?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}
vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: SelectMockProps) => (
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

import { GET_CAMPAIGNS } from '@/lib/graphql/fundraising/campaigns'
import { CampaignList } from '@/components/campaigns/admin/list/campaign-list'
import { listItem } from '../../components/campaigns/s1_ui_a/fixtures'

const feature = loadFeature('./admin_campaigns.feature', { loadRelativePath: true })

interface World {
  campaigns: ReturnType<typeof listItem>[]
}

function campaignsMock(status: string | null, search: string | null, items: unknown[]): MockedResponse {
  return {
    request: { query: GET_CAMPAIGNS, variables: { status, search } },
    result: { data: { campaigns: items } },
  }
}

function openList(world: World) {
  const drafts = world.campaigns.filter((c) => c.status === 'DRAFT')
  const mocks: MockedResponse[] = [
    campaignsMock(null, null, world.campaigns),
    campaignsMock('DRAFT', null, drafts),
    campaignsMock(
      'DRAFT',
      'camp',
      drafts.filter((c) => c.title.toLowerCase().includes('camp'))
    ),
  ]
  render(
    <MockedProvider mocks={mocks}>
      <CampaignList />
    </MockedProvider>
  )
}

async function rowFor(title: string) {
  const table = await screen.findByRole('table')
  const cell = await within(table).findByText(title)
  return cell.closest('tr') as HTMLElement
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    world = { campaigns: [] }
  })

  const givenRaised = (given: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    given(
      /^campaign "(.*)" with code "(.*)" in "(.*)" has raised "(.*)" of "(.*)"$/,
      (title, code, department, raised, target) => {
        world.campaigns.push(
          listItem({
            id: String(world.campaigns.length + 1),
            title,
            paybillCode: code,
            categoryName: department,
            raised,
            target,
          })
        )
      }
    )

  const thenListShows = (then: (m: RegExp, fn: (...args: string[]) => Promise<void>) => void) =>
    then(/^the list shows "(.*)" with code "(.*)" in "(.*)"$/, async (title, code, department) => {
      const row = await rowFor(title)
      expect(within(row).getByText(code)).toBeInTheDocument()
      expect(within(row).getByText(department)).toBeInTheDocument()
    })

  test('Staff see every campaign with its progress', ({ given, when, then, and }) => {
    givenRaised(given)
    when('they open the campaign list', () => openList(world))
    thenListShows(then)
    and(/^"(.*)" shows "(.*)" raised of "(.*)"$/, async (title, raised, target) => {
      const row = await rowFor(title)
      expect(within(row).getByText(raised)).toBeInTheDocument()
      expect(within(row).getByText(`of ${target}`)).toBeInTheDocument()
      expect(within(row).getByRole('progressbar')).toBeInTheDocument()
    })
    and(/^"(.*)" links to its campaign page$/, async (title) => {
      const row = await rowFor(title)
      expect(within(row).getByRole('link', { name: title })).toHaveAttribute('href', '/admin/campaigns/1')
    })
  })

  test('Staff filter the campaign list by status and search', ({ given, when, then, and }) => {
    givenRaised(given)
    and(/^a draft campaign "(.*)" with code "(.*)" in "(.*)"$/, (title, code, department) => {
      world.campaigns.push(
        listItem({ id: '2', title, paybillCode: code, categoryName: department, status: 'DRAFT' })
      )
    })
    when('they open the campaign list', () => openList(world))
    and(/^they show only "(.*)" campaigns$/, async (label) => {
      await rowFor('Church Building')
      const select = screen.getByLabelText('status') as HTMLSelectElement
      const option = Array.from(select.options).find((o) => o.textContent === label)
      fireEvent.change(select, { target: { value: option?.value } })
    })
    and(/^they search for "(.*)"$/, async (term) => {
      await screen.findAllByText('Youth Camp')
      fireEvent.change(screen.getByLabelText('Search'), { target: { value: term } })
      fireEvent.click(screen.getByRole('button', { name: /^Search$/ }))
    })
    thenListShows(then)
    and(/^the list does not show "(.*)"$/, async (title) => {
      await rowFor('Youth Camp')
      expect(screen.queryByText(title)).not.toBeInTheDocument()
    })
  })

  test('An empty list invites staff to start a campaign', ({ given, when, then, and }) => {
    given('there are no campaigns', () => {
      world.campaigns = []
    })
    when('they open the campaign list', () => openList(world))
    then('they are told there are no campaigns yet', async () => {
      expect(await screen.findByText('No campaigns yet')).toBeInTheDocument()
    })
    and('they can start a new campaign', () => {
      expect(screen.getByRole('link', { name: /New campaign/ })).toHaveAttribute('href', '/admin/campaigns/new')
    })
  })
})
