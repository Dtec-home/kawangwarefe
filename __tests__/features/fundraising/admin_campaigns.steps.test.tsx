/**
 * Binding for `fundraising/admin_campaigns.feature` (Fundraising S1, lane S1-UI-A).
 *
 * Drives the real campaign list, create form and overview through Apollo's
 * MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

const { pushMock, toastMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/campaigns',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

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

import { CREATE_CAMPAIGN, GET_CAMPAIGNS } from '@/lib/graphql/fundraising/campaigns'
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from '@/lib/graphql/queries'
import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import type { CampaignInput } from '@/lib/types/fundraising'
import { CampaignList } from '@/components/campaigns/admin/list/campaign-list'
import { CreateCampaign } from '@/components/campaigns/admin/form/create-campaign'
import { campaign, category, listItem, role } from '../../components/campaigns/s1_ui_a/fixtures'

const feature = loadFeature('./admin_campaigns.feature', { loadRelativePath: true })

interface World {
  campaigns: ReturnType<typeof listItem>[]
  role: ReturnType<typeof role>
  categories: ReturnType<typeof category>[]
  createMessage: string | null
  created: CampaignInput | null
}

function formMocks(world: World): MockedResponse[] {
  return [
    { request: { query: GET_CURRENT_USER_ROLE }, result: { data: { currentUserRole: world.role } }, maxUsageCount: 10 },
    {
      request: { query: GET_CONTRIBUTION_CATEGORIES },
      result: { data: { contributionCategories: world.categories } },
      maxUsageCount: 10,
    },
    ...world.categories.map((c) => ({
      request: { query: GET_DEPARTMENT_PURPOSES, variables: { categoryId: c.id, isActive: true } },
      result: { data: { departmentPurposes: [] } },
      maxUsageCount: 10,
    })),
  ]
}

function openNewCampaign(world: World) {
  const create: MockedResponse = {
    request: {
      query: CREATE_CAMPAIGN,
      variables: (vars: { input: CampaignInput }) => {
        world.created = vars.input
        return true
      },
    },
    result: () => {
      const failed = world.createMessage !== null
      return {
        data: {
          createCampaign: {
            __typename: 'CampaignResponse',
            success: !failed,
            message: world.createMessage ?? 'Campaign saved as a draft',
            campaign: failed ? null : campaign({ id: '9', paybillCode: world.created?.paybillCode }),
          },
        },
      }
    },
  }
  render(
    <MockedProvider mocks={[...formMocks(world), create]}>
      <CreateCampaign />
    </MockedProvider>
  )
}

async function toldThat(message: string) {
  await waitFor(() => {
    const toasted = [...toastMock.success.mock.calls, ...toastMock.error.mock.calls].flat()
    expect(toasted.includes(message) || screen.queryAllByText(message).length > 0).toBe(true)
  })
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
    vi.clearAllMocks()
    world = { campaigns: [], role: role(), categories: [], createMessage: null, created: null }
  })

  const givenDepartments = (step: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    step(/^departments "(.*)" and "(.*)" are active$/, (first, second) => {
      world.categories = [category('3', first, 'BUILDING'), category('4', second, 'YOUTH')]
    })

  const whenStartNew = (when: (m: string, fn: () => void) => void) =>
    when('they start a new campaign', () => openNewCampaign(world))

  const fillIn = (step: (m: RegExp, fn: (...args: string[]) => Promise<void>) => void) =>
    step(
      /^they fill in title "(.*)", department "(.*)", target "(.*)" and code "(.*)"$/,
      async (title, department, target, code) => {
        const select = (await screen.findByLabelText('categoryId')) as HTMLSelectElement
        await waitFor(() => expect(select.options.length).toBeGreaterThan(1))
        const option = Array.from(select.options).find((o) => o.textContent === department)
        fireEvent.change(select, { target: { value: option?.value } })
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: title } })
        fireEvent.change(screen.getByLabelText('Target (KES)'), { target: { value: target } })
        fireEvent.change(screen.getByLabelText('Pay Bill account code'), { target: { value: code } })
      }
    )

  const save = (step: (m: string, fn: () => void) => void) =>
    step('they save the campaign', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save as draft' }))
    })

  const thenTold = (step: (m: RegExp, fn: (msg: string) => Promise<void>) => void) =>
    step(/^they are told "(.*)"$/, (msg) => toldThat(msg))

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

  test('Staff draft a new campaign', ({ given, when, then, and }) => {
    givenDepartments(given)
    whenStartNew(when)
    fillIn(and)
    save(and)
    then(/^the campaign is created as a draft with code "(.*)" and the default reminders$/, async (code) => {
      await waitFor(() => expect(world.created).not.toBeNull())
      expect(world.created).toMatchObject({
        title: 'Church Building',
        categoryId: '3',
        targetAmount: '1000000',
        paybillCode: code,
        purposeId: null,
        startDate: null,
        endDate: null,
        isPublic: true,
        allowPledges: true,
        allowChampions: false,
        reminderPolicy: { frequency: 'monthly', daysBeforeDue: 3, overdueNotices: 1 },
      })
    })
    thenTold(and)
    and('they are taken to the campaign page', async () => {
      await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/campaigns/9'))
    })
  })

  test('A department admin can only start campaigns for their own department', ({ given, when, then, and }) => {
    given(/^a department admin for "(.*)"$/, () => {
      world.role = role({ isStaff: false, isCategoryAdmin: true, adminCategoryIds: ['4'] })
    })
    givenDepartments(and)
    whenStartNew(when)
    then(/^the department choices are only "(.*)"$/, async (name) => {
      const select = (await screen.findByLabelText('categoryId')) as HTMLSelectElement
      await waitFor(() =>
        expect(Array.from(select.options).map((o) => o.textContent).filter(Boolean)).toEqual([name])
      )
    })
  })

  test('The Pay Bill code must be 2 to 10 capital letters or digits', ({ given, when, then, and }) => {
    givenDepartments(given)
    whenStartNew(when)
    fillIn(and)
    save(and)
    thenTold(then)
  })

  test('The end date cannot be before the start date', ({ given, when, then, and }) => {
    givenDepartments(given)
    whenStartNew(when)
    fillIn(and)
    and(/^they set the dates from "(.*)" to "(.*)"$/, (from, to) => {
      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: from } })
      fireEvent.change(screen.getByLabelText('End date'), { target: { value: to } })
    })
    save(and)
    thenTold(then)
  })

  test('The server refuses a code that is already in use', ({ given, when, then, and }) => {
    givenDepartments(given)
    and(/^the code "(.*)" is already used by a department$/, (code) => {
      world.createMessage = `Code ${code} is already used by a department`
    })
    whenStartNew(when)
    fillIn(and)
    save(and)
    thenTold(then)
    and('they stay on the new campaign form', () => {
      expect(pushMock).not.toHaveBeenCalled()
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
    })
  })
})
