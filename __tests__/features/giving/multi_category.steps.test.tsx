/**
 * Web binding for the canonical `giving/multi_category.feature`.
 *
 * Drives the web app's real `INITIATE_MULTI_CONTRIBUTION` document through
 * Apollo's MockedProvider (the mock stands in for the backend, which the
 * backend BDD suite exercises for real).
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { INITIATE_MULTI_CONTRIBUTION } from '@/lib/graphql/multi-contribution-mutations'

const feature = loadFeature('./multi_category.feature', { loadRelativePath: true })

// Deterministic category ids assigned as categories become "available".
const CATEGORY_IDS: Record<string, string> = { Tithe: '1', Offering: '2' }

function MultiGiver({
  variables,
  onResult,
}: {
  variables: Record<string, unknown>
  onResult: (r: any) => void
}) {
  const [initiate] = useMutation(INITIATE_MULTI_CONTRIBUTION)
  React.useEffect(() => {
    initiate({ variables })
      .then((res: any) =>
        onResult(
          res?.data?.initiateMultiCategoryContribution ?? { success: false, message: 'no data' }
        )
      )
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

defineFeature(feature, (test) => {
  test('Giving to two categories is accepted with the combined total', ({
    given,
    and,
    when,
    then,
  }) => {
    const ctx: any = { categories: {}, result: null }

    given(/^a contribution category "(.*)" is available$/, (name: string) => {
      ctx.categories[name] = CATEGORY_IDS[name] ?? String(Object.keys(ctx.categories).length + 1)
    })

    and(/^a contribution category "(.*)" is available$/, (name: string) => {
      ctx.categories[name] = CATEGORY_IDS[name] ?? String(Object.keys(ctx.categories).length + 1)
    })

    and(/^the giver's phone number is "(.*)"$/, (phone: string) => {
      ctx.phone = phone
    })

    when(
      'the giver contributes the following in one payment:',
      (rows: Array<{ category: string; amount: string }>) => {
        const contributions = rows.map((r) => ({
          categoryId: ctx.categories[r.category],
          amount: r.amount,
        }))
        const total = rows.reduce((sum, r) => sum + Number(r.amount), 0)
        const variables = { phoneNumber: ctx.phone, contributions }
        ctx.variables = variables
        ctx.mocks = [
          {
            request: { query: INITIATE_MULTI_CONTRIBUTION, variables },
            result: {
              data: {
                initiateMultiCategoryContribution: {
                  __typename: 'MultiContributionResponse',
                  success: true,
                  message: 'STK push sent for the combined total.',
                  totalAmount: String(total),
                  contributionGroupId: 'grp_test_123',
                  checkoutRequestId: 'ws_CO_multi_123',
                  transactionId: 'txn_123',
                  contributions: rows.map((r) => ({
                    __typename: 'CategoryAmountType',
                    categoryId: ctx.categories[r.category],
                    categoryName: r.category,
                    categoryCode: r.category.toUpperCase(),
                    amount: r.amount,
                    purposeName: null,
                    routedGroupName: null,
                  })),
                },
              },
            },
          },
        ]
      }
    )

    then(/^the combined payment of "(.*)" is accepted$/, async (total: string) => {
      render(
        <MockedProvider mocks={ctx.mocks} addTypename={false}>
          <MultiGiver variables={ctx.variables} onResult={(r) => (ctx.result = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.result).not.toBeNull())
      expect(ctx.result.success).toBe(true)
      expect(String(ctx.result.totalAmount)).toBe(total)
    })

    and(/^(\d+) contributions are grouped under one payment$/, (count: string) => {
      expect(ctx.result.contributions).toHaveLength(Number(count))
      expect(ctx.result.contributionGroupId).toBeTruthy()
    })
  })
})
