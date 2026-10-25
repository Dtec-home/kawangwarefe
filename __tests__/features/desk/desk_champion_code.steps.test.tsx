/**
 * Binding for `desk/desk_champion_code.feature` (Fundraising S6-T, lane BDD-G).
 *
 * Drives the real `RecorderWorkspace` (its line form and `LineCampaignFields`)
 * through MockedProvider with the recorder-safe `givingCampaigns` document.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
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

import { championField, deskLineSteps, newWorld, sentLine, type DeskWorld, type Step } from './desk-fixtures'

const feature = loadFeature('./desk_champion_code.feature', { loadRelativePath: true })

const CAMPAIGN_IDS: Record<string, string> = { 'Roof Appeal': '42', 'New Chairs': '43' }

defineFeature(feature, (test) => {
  let world: DeskWorld
  const steps = deskLineSteps(() => world)

  beforeEach(() => {
    cleanup()
    world = newWorld()
    toastMock.error.mockClear()
  })

  const background = (given: Step, and: Step) => {
    given(/^the "(.*)" department has the active campaigns "(.*)" and "(.*)"$/, (department: string, a: string, b: string) => {
      world.campaigns.push({ id: CAMPAIGN_IDS[a], title: a, department }, { id: CAMPAIGN_IDS[b], title: b, department })
    })
    steps.memberPhone(and)
    steps.recorderFor(and)
  }

  const noChampionField = (then: Step) =>
    then(/^line (\d+) has no champion code field$/, (n: string) => {
      expect(championField(Number(n) - 1)).not.toBeInTheDocument()
    })

  const typeCode = (and: Step) =>
    and(/^they type the champion code "(.*)" for line (\d+)$/, (code: string, n: string) => {
      fireEvent.change(championField(Number(n) - 1)!, { target: { value: code } })
    })

  const codeReads = (then: Step) =>
    then(/^the champion code for line (\d+) reads "(.*)"$/, async (n: string, code: string) => {
      await waitFor(() => expect(championField(Number(n) - 1)).toHaveValue(code))
    })

  test('The champion field appears only after a campaign is chosen', ({ given, and, when, then }) => {
    background(given, and)
    steps.giveOne(when)
    steps.offers(then)
    noChampionField(and)
    steps.chooseCampaign(when)
    then(/^line (\d+) has an empty champion code field$/, async (n: string) => {
      await waitFor(() => expect(championField(Number(n) - 1)).toHaveValue(''))
      expect(championField(Number(n) - 1)).toHaveAttribute('placeholder', 'Champion code (optional)')
    })
  })

  test('The champion code is upper-cased and cleaned as it is typed', ({ given, and, when, then }) => {
    background(given, and)
    steps.giveOne(when)
    steps.chooseCampaign(and)
    typeCode(and)
    codeReads(then)
  })

  test('Choosing another campaign clears the champion code', ({ given, and, when, then }) => {
    background(given, and)
    steps.giveOne(when)
    steps.chooseCampaign(and)
    typeCode(and)
    steps.chooseCampaign(and)
    codeReads(then)
  })

  test('Choosing "No campaign" removes the champion code field', ({ given, and, when, then }) => {
    background(given, and)
    steps.giveOne(when)
    steps.chooseCampaign(and)
    typeCode(and)
    steps.chooseCampaign(and)
    noChampionField(then)
  })

  test('The champion code is sent with the campaign line', ({ given, and, when, then }) => {
    background(given, and)
    steps.giveOne(when)
    steps.chooseCampaign(and)
    typeCode(and)
    steps.reviewAndConfirm(and)
    then(
      /^the gift is sent with line 1 to "(.*)" for "(.*)" through champion "(.*)"$/,
      async (department: string, title: string, code: string) => {
        expect(await steps.sentLines()).toEqual([
          sentLine(department, '700', { campaignId: CAMPAIGN_IDS[title], championCode: code }),
        ])
        expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent(world.receiptNumber)
      }
    )
  })

  test('A refused champion code is shown and no receipt is issued', ({ given, and, when, then }) => {
    background(given, and)
    given(/^the server refuses the gift with "(.*)"$/, (message: string) => {
      world.refusal = message
    })
    steps.giveOne(when)
    steps.chooseCampaign(and)
    typeCode(and)
    steps.reviewAndConfirm(and)
    then(/^they are told "(.*)"$/, async (message: string) => {
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(message))
      expect(world.submissions[0].contributions).toEqual([
        sentLine('Building', '700', { campaignId: '42', championCode: 'PETER' }),
      ])
    })
    and('no receipt is shown', () => {
      expect(screen.queryByTestId('issued-receipt-number')).not.toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
