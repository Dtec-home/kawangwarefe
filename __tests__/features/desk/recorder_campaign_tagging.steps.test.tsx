/**
 * Binding for `desk/recorder_campaign_tagging.feature` (Fundraising S6-T, lane BDD-G).
 *
 * Drives the real `RecorderWorkspace` (its line form and `LineCampaignFields`)
 * through MockedProvider; the campaign list is the recorder-safe `givingCampaigns`.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { screen, cleanup } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({ isPureRecorder: true, isRecorder: true, isStaff: false, loading: false }),
}))
vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({ unlocks: [], unlockDates: [], hasActiveUnlocks: false, loading: false, refetch: vi.fn() }),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

import { chooseDepartment, deskLineSteps, newWorld, sentLine, type DeskWorld, type Step } from './desk-fixtures'

const feature = loadFeature('./recorder_campaign_tagging.feature', { loadRelativePath: true })

/** Let the campaign list answer before asserting that no picker shows. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

defineFeature(feature, (test) => {
  let world: DeskWorld
  const steps = deskLineSteps(() => world)

  beforeEach(() => {
    cleanup()
    world = newWorld()
  })

  const background = (given: Step, and: Step) => {
    steps.memberPhone(given)
    steps.recorderFor(and)
  }

  const activeCampaign = (given: Step) =>
    given(/^the "(.*)" department has the active campaign "(.*)"$/, (department: string, title: string) => {
      world.campaigns.push({ id: '42', title, department })
    })

  const noPicker = (then: Step) =>
    then('no campaign picker is shown', async () => {
      await settle()
      expect(document.querySelector('[data-slot="line-campaign-fields"]')).toBeNull()
    })

  const changeLine = (and: Step) =>
    and(/^they change line (\d+) to "(.*)"$/, async (n: string, department: string) => {
      await chooseDepartment(Number(n) - 1, department)
    })

  test('The campaign picker appears for a department with an active campaign', ({ given, and, when, then }) => {
    background(given, and)
    activeCampaign(given)
    steps.giveOne(when)
    noPicker(then)
    changeLine(when)
    steps.offers(then)
    and(/^the picker for line (\d+) is labelled "(.*)"$/, (n: string, label: string) => {
      expect(screen.getByTestId(`line-campaign-${Number(n) - 1}`)).toHaveTextContent(label)
    })
  })

  test("Only the line of the campaign's department gets a picker", ({ given, and, when, then }) => {
    background(given, and)
    activeCampaign(given)
    steps.giveTwo(when)
    then(/^line (\d+) has no campaign picker$/, async (n: string) => {
      await screen.findByTestId('line-campaign-1')
      expect(screen.queryByTestId(`line-campaign-${Number(n) - 1}`)).not.toBeInTheDocument()
    })
    steps.offers(and)
  })

  test('The campaign is sent with its line only', ({ given, and, when, then }) => {
    background(given, and)
    activeCampaign(given)
    steps.giveTwo(when)
    steps.chooseCampaign(and)
    steps.reviewAndConfirm(and)
    then(
      /^the gift is sent with line 1 to "(.*)" untagged and line 2 to "(.*)" for "(.*)"$/,
      async (d1: string, d2: string) => {
        expect(await steps.sentLines()).toEqual([sentLine(d1, '1000'), sentLine(d2, '500', { campaignId: '42' })])
      }
    )
  })

  const sentUntagged = (then: Step, amount: string) =>
    then(/^the gift is sent with line 1 to "(.*)" untagged$/, async (department: string) => {
      expect(await steps.sentLines()).toEqual([sentLine(department, amount)])
    })

  test('Moving a tagged line to another department drops its campaign', ({ given, and, when, then }) => {
    background(given, and)
    activeCampaign(given)
    steps.giveOne(when)
    steps.chooseCampaign(and)
    changeLine(and)
    steps.reviewAndConfirm(and)
    sentUntagged(then, '500')
  })

  test('No campaigns take gifts, so no picker is shown', ({ given, and, when, then }) => {
    background(given, and)
    given('no campaign takes gifts', () => {
      world.campaigns = []
    })
    steps.giveOne(when)
    noPicker(then)
  })

  test('A refused campaign list leaves the form working without a picker', ({ given, and, when, then }) => {
    background(given, and)
    given('the campaign list is refused to this recorder', () => {
      world.campaignsRefused = true
    })
    steps.giveOne(when)
    noPicker(then)
    steps.reviewAndConfirm(when)
    sentUntagged(then, '500')
  })
})
