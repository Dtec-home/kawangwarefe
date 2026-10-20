/**
 * Binding for `fundraising/campaign_sharing.feature` (Fundraising S0).
 *
 * Drives the shared `CampaignProgress` and `ShareBar` components.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, cleanup } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { CampaignProgress } from '@/components/campaigns/shared/campaign-progress'
import { ShareBar } from '@/components/campaigns/shared/share-bar'

const feature = loadFeature('./campaign_sharing.feature', { loadRelativePath: true })

defineFeature(feature, (test) => {
  afterEach(cleanup)

  test("A visitor sees the campaign's progress without donor names", ({ given, when, then, and }) => {
    let progress: Parameters<typeof CampaignProgress>[0]['progress']

    given(/^a campaign that has raised "(.*)" of "(.*)" from (\d+) donors$/, (raised, target, donors) => {
      progress = {
        target, raised, remaining: '0', percent: 24.8,
        donorCount: Number(donors), giftCount: Number(donors), pledged: '0',
      }
    })
    when('the progress is shown', () => {
      render(<CampaignProgress progress={progress} />)
    })
    then(/^the visitor sees "(.*)" raised of "(.*)"$/, (raised, target) => {
      expect(screen.getByText(raised)).toBeInTheDocument()
      expect(screen.getByText(`of ${target}`)).toBeInTheDocument()
    })
    and(/^the visitor sees "(.*)"$/, (text) => {
      expect(screen.getByText(text)).toBeInTheDocument()
    })
  })

  test('A visitor shares the campaign on WhatsApp', ({ given, when, then }) => {
    let url = ''
    given(/^the campaign page "(.*)"$/, (pageUrl) => {
      url = pageUrl
    })
    when(/^the share options are shown with the message "(.*)"$/, (message) => {
      render(<ShareBar url={url} text={message} />)
    })
    then('the WhatsApp link carries the message and the page link', () => {
      const href = screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href') ?? ''
      const text = decodeURIComponent(href.replace('https://wa.me/?text=', ''))
      expect(text).toBe(`Help us finish the roof ${url}`)
    })
  })
})
