/** Web binding for `fundraising/champion_own_giving.feature` (@web, CH-2). */
import { defineFeature, loadFeature } from 'jest-cucumber'
import { cleanup, render, screen } from '@testing-library/react'

import { ChampionShareKit } from '@/components/champions/dashboard/champion-share-kit'
import { ChampionTotals } from '@/components/champions/public/champion-totals'

const feature = loadFeature('./champion_own_giving.feature', { loadRelativePath: true })

const jane = (showOwnGiving: boolean) => ({
  campaignTitle: 'Shamba', publicUrl: 'https://church.example/campaigns/shamba/c/JANE?v=1',
  paymentInstructions: { paybillNumber: '4012345', accountReference: 'SHAMBA JANE', text: 'x' },
  showOwnGiving, ownGiven: '5000.00',
})

defineFeature(feature, (test) => {
  const messageStarts = (then: (m: RegExp, fn: (t: string) => void) => void) =>
    then(/^Jane's WhatsApp message starts "(.*)"$/, (start: string) => {
      expect(screen.getByTestId('champion-message').textContent?.startsWith(start)).toBe(true)
    })

  test('The share message includes it', ({ given, when, then }) => {
    let shows = false
    given('Jane has given KES 5,000 to Shamba and shows it', () => { shows = true })
    when('Jane opens her share kit', () => { render(<ChampionShareKit champion={jane(shows)} />) })
    messageStarts(then)
  })

  test('Switched off, the message no longer mentions it', ({ given, when, then }) => {
    let shows = true
    given('Jane has given KES 5,000 to Shamba and hides it', () => { shows = false })
    when('Jane opens her share kit', () => { render(<ChampionShareKit champion={jane(shows)} />) })
    messageStarts(then)
  })

  test('The public page shows it, and nothing at zero', ({ given, then }) => {
    given(/^the server sends Jane's own giving as "(.*)"$/, (amount: string) => {
      render(<ChampionTotals championName="Jane W." raised="9000.00" donorCount={3} personalTarget={null} ownGiven={amount} />)
    })
    then(/^the page shows "(.*)"$/, (text: string) => {
      expect(screen.getByTestId('champion-own-giving')).toHaveTextContent(text)
    })
    given('the server sends no own giving for Jane', () => {
      cleanup()
      render(<ChampionTotals championName="Jane W." raised="9000.00" donorCount={3} personalTarget={null} ownGiven={null} />)
    })
    then('the page shows no own-giving line', () => {
      expect(screen.queryByTestId('champion-own-giving')).not.toBeInTheDocument()
    })
  })
})
