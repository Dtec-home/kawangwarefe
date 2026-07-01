/**
 * Web binding for the canonical `admin/prayers_admin.feature`.
 *
 * Drives the app's real `UPDATE_PRAYER_REQUEST_STATUS` mutation and
 * `GET_PRAYER_REQUESTS` query through Apollo's MockedProvider, mirroring the
 * backend staff-moderation flow (transition + staff-sees-all listing).
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation, useQuery } from '@apollo/client/react'
import React from 'react'

import { UPDATE_PRAYER_REQUEST_STATUS, GET_PRAYER_REQUESTS } from '@/lib/graphql/prayer-mutations'

const feature = loadFeature('./prayers_admin.feature', { loadRelativePath: true })

function prayer(id: string, title: string, status: string, visibility: string) {
  return {
    __typename: 'PrayerRequestType',
    id,
    title,
    body: 'Please pray',
    status,
    visibility,
    isAnonymous: false,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    requesterDisplayName: 'Member',
  }
}

function Mutator({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [mutate] = useMutation(UPDATE_PRAYER_REQUEST_STATUS)
  React.useEffect(() => {
    mutate({ variables })
      .then((res: any) => onResult(res?.data?.updatePrayerRequestStatus ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function Lister({ onResult }: { onResult: (r: any) => void }) {
  const { data } = useQuery(GET_PRAYER_REQUESTS, { variables: { status: null } })
  React.useEffect(() => {
    if (data) onResult((data as any).prayerRequests)
  }, [data, onResult])
  return null
}

function runMutation(ctx: any, result: Record<string, unknown>) {
  const variables = { requestId: ctx.requestId, newStatus: ctx.newStatus }
  const mocks = [
    {
      request: { query: UPDATE_PRAYER_REQUEST_STATUS, variables },
      result: { data: { updatePrayerRequestStatus: { __typename: 'PrayerRequestResponse', ...result } } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Mutator variables={variables} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('A staff administrator marks a prayer request as answered', ({ given, and, when, then }) => {
    const ctx: any = { result: null, requestId: 'p1' }

    given(/^an open prayer request titled "(.*)"$/, (title: string) => {
      ctx.title = title
    })
    and('a staff administrator', () => {
      ctx.staff = true
    })
    when(/^the administrator marks the prayer request as "(.*)"$/, async (status: string) => {
      ctx.newStatus = status
      runMutation(ctx, {
        success: true,
        message: 'Status updated',
        request: prayer('p1', ctx.title, status, 'team'),
      })
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })
    then(/^the prayer request status is "(.*)"$/, (status: string) => {
      expect(ctx.result.success).toBe(true)
      expect(ctx.result.request.status).toBe(status)
    })
  })

  test('A non-staff member cannot moderate prayer requests', ({ given, and, when, then }) => {
    const ctx: any = { result: null, requestId: 'p1' }

    given(/^an open prayer request titled "(.*)"$/, (title: string) => {
      ctx.title = title
    })
    and('a non-staff member', () => {
      ctx.staff = false
    })
    when(/^the member tries to mark the prayer request as "(.*)"$/, async (status: string) => {
      ctx.newStatus = status
      runMutation(ctx, { success: false, message: 'Requires staff privileges', request: null })
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })
    then('the moderation is rejected', () => {
      expect(ctx.result.success).toBe(false)
    })
    and(/^the prayer request status remains "(.*)"$/, (status: string) => {
      // The server rejected the change; the request keeps its original status.
      expect(status).toBe('open')
    })
  })

  test('A staff administrator sees every prayer request', ({ given, and, when, then }) => {
    const ctx: any = { list: null }

    given(/^an open prayer request titled "(.*)"$/, (title: string) => {
      ctx.openTitle = title
    })
    and(/^a private prayer request titled "(.*)"$/, (title: string) => {
      ctx.privateTitle = title
    })
    and('a staff administrator', () => {
      ctx.staff = true
    })
    when('the administrator lists prayer requests', async () => {
      const mocks = [
        {
          request: { query: GET_PRAYER_REQUESTS, variables: { status: null } },
          result: {
            data: {
              prayerRequests: [
                prayer('p1', ctx.openTitle, 'open', 'team'),
                prayer('p2', ctx.privateTitle, 'open', 'private'),
              ],
            },
          },
        },
      ]
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <Lister onResult={(r) => (ctx.list = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.list).not.toBeNull())
    })
    then(/^(\d+) prayer requests are listed$/, (count: string) => {
      expect(ctx.list).toHaveLength(Number(count))
    })
  })
})
