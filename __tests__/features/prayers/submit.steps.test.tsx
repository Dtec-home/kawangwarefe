/**
 * Web binding for the canonical `prayers/submit.feature`.
 *
 * Drives the web app's real `SUBMIT_PRAYER_REQUEST` mutation through Apollo's
 * MockedProvider, mirroring the backend BDD prayer-submission flow.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { SUBMIT_PRAYER_REQUEST } from '@/lib/graphql/prayer-mutations'

const feature = loadFeature('./submit.feature', { loadRelativePath: true })

function Submitter({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [submit] = useMutation(SUBMIT_PRAYER_REQUEST)
  React.useEffect(() => {
    submit({ variables })
      .then((res: any) => onResult(res?.data?.submitPrayerRequest ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function runSubmit(ctx: any, result: Record<string, unknown>) {
  const variables = { title: ctx.title, body: ctx.body }
  const mocks = [
    {
      request: { query: SUBMIT_PRAYER_REQUEST, variables },
      result: { data: { submitPrayerRequest: { __typename: 'PrayerRequestResponse', ...result } } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Submitter variables={variables} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('A member submits a prayer request', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given(/^a prayer request titled "(.*)" with body "(.*)"$/, (title: string, body: string) => {
      ctx.title = title
      ctx.body = body
    })

    when('the prayer request is submitted', async () => {
      runSubmit(ctx, {
        success: true,
        message: 'Prayer request submitted',
        request: {
          __typename: 'PrayerRequestType',
          id: 'p1', title: ctx.title, body: ctx.body, status: 'pending',
          visibility: 'team', isAnonymous: false,
          createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z',
          requesterDisplayName: 'Test Member',
        },
      })
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('the prayer request is accepted', () => {
      expect(ctx.result.success).toBe(true)
      expect(ctx.result.request).toBeTruthy()
    })
  })

  test('A prayer request without a title is rejected', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given(/^a prayer request with a blank title and body "(.*)"$/, (body: string) => {
      ctx.title = ''
      ctx.body = body
    })

    when('the prayer request is submitted', async () => {
      runSubmit(ctx, { success: false, message: 'Title is required', request: null })
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('the prayer request is rejected', () => {
      expect(ctx.result.success).toBe(false)
    })
  })
})
