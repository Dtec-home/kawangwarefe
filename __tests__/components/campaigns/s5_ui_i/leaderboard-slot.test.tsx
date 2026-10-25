import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { LeaderboardSlot, LEADERBOARD_SIZE } from '@/components/champions/public/leaderboard-slot'
import { CAMPAIGN_LEADERBOARD } from '@/lib/graphql/fundraising/public-champions'

const campaign = { slug: 'roof', allowChampions: true }

describe('LeaderboardSlot', () => {
  it('asks for the top 10 and shows a placeholder while loading', async () => {
    expect(LEADERBOARD_SIZE).toBe(10)
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: CAMPAIGN_LEADERBOARD, variables: { slug: 'roof', limit: 10 } },
            result: {
              data: {
                campaignLeaderboard: [
                  { __typename: 'LeaderboardEntryType', rank: 1, championName: 'Mary W', code: 'MARY', raised: '100', donorCount: 1 },
                ],
              },
            },
            delay: 20,
          },
        ]}
      >
        <LeaderboardSlot campaign={campaign} />
      </MockedProvider>,
    )
    expect(screen.getByTestId('leaderboard-loading')).toBeInTheDocument()
    expect(await screen.findByText('1 donor')).toBeInTheDocument()
    expect(screen.getByLabelText('Rank 1')).toHaveTextContent('1')
  })

  it('stays out of the way when the leaderboard cannot be loaded', async () => {
    const { container } = render(
      <MockedProvider
        mocks={[
          { request: { query: CAMPAIGN_LEADERBOARD, variables: { slug: 'roof', limit: 10 } }, error: new Error('down') },
        ]}
      >
        <LeaderboardSlot campaign={campaign} />
      </MockedProvider>,
    )
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
