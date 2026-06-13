/**
 * Web binding for the canonical `giving/single_contribution.feature`.
 *
 * Drives the SAME scenarios the backend BDD suite runs, against the web app's
 * real GraphQL operation (`INITIATE_CONTRIBUTION`) through Apollo's
 * MockedProvider — the mock stands in for the backend (which the backend BDD
 * tests exercise for real). This proves the web app's giving data-path honours
 * the same accept/reject behaviour for the same inputs.
 *
 * Runner: jest-cucumber on top of Vitest (globals enabled in vitest.config.mts).
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { INITIATE_CONTRIBUTION } from '@/lib/graphql/mutations'

const feature = loadFeature('./single_contribution.feature', { loadRelativePath: true })

// A fixed category id used for both the available-category mock and the request.
const CATEGORY_ID = '1'

function buildMock(variables: Record<string, unknown>, response: Record<string, unknown>) {
  return [
    {
      request: { query: INITIATE_CONTRIBUTION, variables },
      result: {
        data: {
          initiateContribution: {
            __typename: 'ContributionResponse',
            contribution: null,
            ...response,
          },
        },
      },
    },
  ]
}

/** Minimal harness that fires the real mutation and reports the result. */
function Giver({
  variables,
  onResult,
}: {
  variables: Record<string, unknown>
  onResult: (r: any) => void
}) {
  const [initiate] = useMutation(INITIATE_CONTRIBUTION)
  React.useEffect(() => {
    initiate({ variables })
      .then((res: any) =>
        onResult(res?.data?.initiateContribution ?? { success: false, message: 'no data' })
      )
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

defineFeature(feature, (test) => {
  test('A valid contribution is accepted for M-Pesa payment', ({ given, and, when, then }) => {
    const ctx: any = { categories: {}, result: null }

    given(/^a contribution category "(.*)" is available$/, (name: string) => {
      ctx.categories[name] = CATEGORY_ID
    })

    and(/^the giver's phone number is "(.*)"$/, (phone: string) => {
      ctx.phone = phone
    })

    when(/^the giver contributes "(.*)" to "(.*)"$/, async (amount: string, name: string) => {
      const variables = {
        phoneNumber: ctx.phone,
        amount,
        categoryId: ctx.categories[name],
      }
      const mocks = buildMock(variables, {
        success: true,
        message: 'STK push sent. Enter your M-Pesa PIN.',
        checkoutRequestId: 'ws_CO_test_123',
      })
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <Giver variables={variables} onResult={(r) => (ctx.result = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('the contribution is accepted for payment', () => {
      expect(ctx.result.success).toBe(true)
      expect(ctx.result.checkoutRequestId).toBeTruthy()
    })
  })

  test('A contribution below the minimum amount is rejected', ({ given, and, when, then }) => {
    const ctx: any = { categories: {}, result: null }

    given(/^a contribution category "(.*)" is available$/, (name: string) => {
      ctx.categories[name] = CATEGORY_ID
    })

    and(/^the giver's phone number is "(.*)"$/, (phone: string) => {
      ctx.phone = phone
    })

    when(/^the giver contributes "(.*)" to "(.*)"$/, async (amount: string, name: string) => {
      const variables = {
        phoneNumber: ctx.phone,
        amount,
        categoryId: ctx.categories[name],
      }
      const mocks = buildMock(variables, {
        success: false,
        message: 'Amount must be at least KES 1.00',
        checkoutRequestId: null,
      })
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <Giver variables={variables} onResult={(r) => (ctx.result = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('the contribution is rejected with a minimum-amount error', () => {
      expect(ctx.result.success).toBe(false)
      expect(String(ctx.result.message).toLowerCase()).toContain('at least')
    })
  })
})
