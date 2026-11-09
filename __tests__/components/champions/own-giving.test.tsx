/** CH-2 (ADR-0016): a champion's own giving on the share message, page, preview and dashboard. */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

import { championWhatsappMessage, ownGivingShown } from '@/components/champions/dashboard/champion-display'
import { OwnGivingCard } from '@/components/champions/dashboard/own-giving-card'
import { ChampionTotals } from '@/components/champions/public/champion-totals'
import { championMetadata, type ChampionMeta } from '@/components/champions/public/server/champion-meta'
import { ChampionOgCard } from '@/components/champions/public/server/champion-og-card'
import { DISMISS_OWN_GIVING_NOTICE, SET_CHAMPION_SHOW_OWN_GIVING } from '@/lib/graphql/fundraising/champions'

const base = {
  id: '7', campaignTitle: 'Shamba', publicUrl: 'https://church.example/campaigns/shamba/c/JANE?v=abc',
  paymentInstructions: { paybillNumber: '4012345', accountReference: 'SHAMBA JANE', text: 'x' },
}

describe('championWhatsappMessage', () => {
  it('starts with the own giving when shown and above zero', () => {
    const text = championWhatsappMessage({ ...base, showOwnGiving: true, ownGiven: '5000.00' })
    expect(text.split('\n')[0]).toBe("I've given KES 5,000 to Shamba. Join me:")
    expect(text).toContain(base.publicUrl)
    expect(text).toContain('Pay Bill 4012345, Account SHAMBA JANE')
  })

  it.each([
    ['switched off', { showOwnGiving: false, ownGiven: '5000.00' }],
    ['nothing given', { showOwnGiving: true, ownGiven: '0.00' }],
    ['an older server', {}],
  ])('is unchanged when %s', (_, own) => {
    const text = championWhatsappMessage({ ...base, ...own })
    expect(text.split('\n')[0]).toBe("I'm raising money for Shamba at our church. Please support me!")
    expect(ownGivingShown({ ...base, ...own })).toBe(false)
  })
})

describe('public page and preview', () => {
  const meta: ChampionMeta = {
    championName: 'Jane W.', code: 'JANE', raised: '9000.00', donorCount: 3, personalTarget: null, ownGiven: '5000.00',
    campaign: { slug: 'shamba', title: 'Shamba', summary: '', progress: { target: '100000.00', raised: '14000.00', percent: 14 } },
  }

  it('the page says what the champion gave', () => {
    render(<ChampionTotals championName="Jane W." raised="9000.00" donorCount={3} personalTarget={null} ownGiven="5000.00" />)
    expect(screen.getByTestId('champion-own-giving')).toHaveTextContent('Jane has given KES 5,000 to this campaign')
  })

  it('the page says nothing when the server sends no amount', () => {
    render(<ChampionTotals championName="Jane W." raised="9000.00" donorCount={3} personalTarget={null} ownGiven={null} />)
    expect(screen.queryByTestId('champion-own-giving')).not.toBeInTheDocument()
  })

  it('the preview text mentions it', () => {
    expect(championMetadata('shamba', 'JANE', meta).description)
      .toBe('Jane W. has raised KES 9,000 for Shamba and has given KES 5,000 personally.')
    expect(championMetadata('shamba', 'JANE', { ...meta, ownGiven: null }).description)
      .toBe('Jane W. has raised KES 9,000 for Shamba.')
  })

  it('the preview card mentions it', () => {
    render(<ChampionOgCard meta={meta} />)
    expect(screen.getByText('and has given KES 5,000 personally')).toBeInTheDocument()
  })
})

describe('OwnGivingCard (dashboard)', () => {
  const set = (show: boolean) => ({
    request: { query: SET_CHAMPION_SHOW_OWN_GIVING, variables: { championId: '7', show } },
    result: { data: { setChampionShowOwnGiving: { __typename: 'MutationResult', success: true, message: 'ok' } } },
  })
  const dismiss = {
    request: { query: DISMISS_OWN_GIVING_NOTICE, variables: { championId: '7' } },
    result: { data: { dismissOwnGivingNotice: { __typename: 'MutationResult', success: true, message: 'OK' } } },
  }

  it('shows the figure and switches it off', async () => {
    const onChanged = vi.fn()
    render(<MockedProvider mocks={[set(false)]}>
      <OwnGivingCard champion={{ id: '7', showOwnGiving: true, ownGiven: '5000.00', ownGivingNoticePending: false }} onChanged={onChanged} />
    </MockedProvider>)
    expect(screen.getByText("You've given KES 5,000 to this campaign")).toBeInTheDocument()
    const toggle = screen.getByRole('switch', { name: "Show how much I've given on my page and share message" })
    expect(toggle).toBeChecked()
    fireEvent.click(toggle)
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
  })

  it('shows the one-time notice until dismissed', async () => {
    render(<MockedProvider mocks={[dismiss]}>
      <OwnGivingCard champion={{ id: '7', showOwnGiving: true, ownGiven: '5000.00', ownGivingNoticePending: true }} />
    </MockedProvider>)
    expect(screen.getByRole('status')).toHaveTextContent('Your page now shows how much you have given')
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })
})
