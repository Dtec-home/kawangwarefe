/**
 * Web binding for the canonical `contributions/history.feature`.
 *
 * Drives the web app's real `GET_MY_CONTRIBUTIONS` query through Apollo's
 * MockedProvider.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useQuery } from '@apollo/client/react'
import React from 'react'

import { GET_MY_CONTRIBUTIONS } from '@/lib/graphql/queries'

const feature = loadFeature('./history.feature', { loadRelativePath: true })

function makeContribution(i: number) {
  return {
    id: `c${i}`,
    amount: '1000.00',
    status: 'completed',
    transactionDate: '2026-06-01T10:00:00Z',
    notes: '',
    isCompleted: true,
    contributionGroupId: `grp${i}`,
    purposeName: null,
    routedGroupName: null,
    member: { id: 'm1', fullName: 'Test Member', phoneNumber: '254712345678' },
    category: { id: '1', name: 'Tithe', code: 'TITHE' },
    mpesaTransaction: null,
  }
}

function HistoryViewer({ phone, onResult }: { phone: string; onResult: (r: any[]) => void }) {
  const { data, loading } = useQuery(GET_MY_CONTRIBUTIONS, { variables: { phoneNumber: phone } })
  React.useEffect(() => {
    if (!loading) onResult((data as any)?.myContributions ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data])
  return null
}

function runViewer(ctx: any) {
  const mocks = [
    {
      request: { query: GET_MY_CONTRIBUTIONS, variables: { phoneNumber: ctx.phone } },
      result: { data: { myContributions: ctx.seeded } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <HistoryViewer phone={ctx.phone} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('A member with contributions sees them listed', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given(/^a member with phone "(.*)" has (\d+) completed contributions$/, (phone: string, n: string) => {
      ctx.phone = phone
      ctx.seeded = Array.from({ length: Number(n) }, (_, i) => makeContribution(i))
    })

    when('the member views their contribution history', async () => {
      runViewer(ctx)
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then(/^(\d+) contributions are shown$/, (count: string) => {
      expect(ctx.result).toHaveLength(Number(count))
    })
  })

  test('A member with no contributions sees an empty history', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given(/^a member with phone "(.*)" has no contributions$/, (phone: string) => {
      ctx.phone = phone
      ctx.seeded = []
    })

    when('the member views their contribution history', async () => {
      runViewer(ctx)
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('no contributions are shown', () => {
      expect(ctx.result).toHaveLength(0)
    })
  })
})
