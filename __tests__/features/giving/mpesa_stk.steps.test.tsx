/**
 * Web binding for the canonical `giving/mpesa_stk.feature`.
 *
 * The web app does not process M-Pesa callbacks itself — it polls the server
 * for the payment status. This binding drives the app's real `GET_PAYMENT_STATUS`
 * query through Apollo's MockedProvider: the server-side outcome of a callback
 * (pending / completed / failed / not_found) is represented by the mocked
 * response, and the real `useQuery(GET_PAYMENT_STATUS)` reads it back.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useQuery } from '@apollo/client/react'
import React from 'react'

import { GET_PAYMENT_STATUS } from '@/lib/graphql/payment-status-query'

const feature = loadFeature('./mpesa_stk.feature', { loadRelativePath: true })

const CHECKOUT_ID = 'ws_CO_test_checkout_123'

function StatusPoller({ checkoutId, onResult }: { checkoutId: string; onResult: (s: string) => void }) {
  const { data, loading } = useQuery(GET_PAYMENT_STATUS, { variables: { checkoutRequestId: checkoutId } })
  React.useEffect(() => {
    if (!loading && data) onResult((data as any).paymentStatus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data])
  return null
}

function pollStatus(ctx: any, checkoutId: string, serverStatus: string) {
  const mocks = [
    {
      request: { query: GET_PAYMENT_STATUS, variables: { checkoutRequestId: checkoutId } },
      result: { data: { paymentStatus: serverStatus } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <StatusPoller checkoutId={checkoutId} onResult={(s) => (ctx.status = s)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('A submitted payment is pending until M-Pesa confirms it', ({ given, when, then }) => {
    const ctx: any = { status: null, serverStatus: 'pending' }

    given('an M-Pesa STK payment has been initiated', () => {
      ctx.checkoutId = CHECKOUT_ID
    })

    when('the payment status is checked before any callback', async () => {
      pollStatus(ctx, ctx.checkoutId, ctx.serverStatus)
      await waitFor(() => expect(ctx.status).not.toBeNull())
    })

    then(/^the payment status is "(.*)"$/, (status: string) => {
      expect(ctx.status).toBe(status)
    })
  })

  test('A successful M-Pesa callback completes the payment', ({ given, when, and, then }) => {
    const ctx: any = { status: null, serverStatus: 'pending' }

    given('an M-Pesa STK payment has been initiated', () => {
      ctx.checkoutId = CHECKOUT_ID
    })

    when('the M-Pesa payment is confirmed successful', () => {
      ctx.serverStatus = 'completed'
    })

    and('the payment status is checked', async () => {
      pollStatus(ctx, ctx.checkoutId, ctx.serverStatus)
      await waitFor(() => expect(ctx.status).not.toBeNull())
    })

    then(/^the payment status is "(.*)"$/, (status: string) => {
      expect(ctx.status).toBe(status)
    })
  })

  test('A cancelled M-Pesa payment is marked failed', ({ given, when, and, then }) => {
    const ctx: any = { status: null, serverStatus: 'pending' }

    given('an M-Pesa STK payment has been initiated', () => {
      ctx.checkoutId = CHECKOUT_ID
    })

    when('the M-Pesa payment is cancelled', () => {
      ctx.serverStatus = 'failed'
    })

    and('the payment status is checked', async () => {
      pollStatus(ctx, ctx.checkoutId, ctx.serverStatus)
      await waitFor(() => expect(ctx.status).not.toBeNull())
    })

    then(/^the payment status is "(.*)"$/, (status: string) => {
      expect(ctx.status).toBe(status)
    })
  })

  test('An unknown checkout request id is not found', ({ when, then }) => {
    const ctx: any = { status: null }

    when('the payment status is checked for an unknown checkout request id', async () => {
      pollStatus(ctx, 'ws_CO_unknown_checkout_id', 'not_found')
      await waitFor(() => expect(ctx.status).not.toBeNull())
    })

    then(/^the payment status is "(.*)"$/, (status: string) => {
      expect(ctx.status).toBe(status)
    })
  })
})
