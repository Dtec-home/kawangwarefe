/**
 * Web binding for the canonical `admin/manual_contribution.feature`.
 *
 * Drives the app's real `CREATE_MANUAL_CONTRIBUTION` mutation through Apollo's
 * MockedProvider, mirroring the backend admin manual-entry flow.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { CREATE_MANUAL_CONTRIBUTION } from '@/lib/graphql/manual-contribution-mutations'

const feature = loadFeature('./manual_contribution.feature', { loadRelativePath: true })

function Recorder({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [record] = useMutation(CREATE_MANUAL_CONTRIBUTION)
  React.useEffect(() => {
    record({ variables })
      .then((res: any) => onResult(res?.data?.createManualContribution ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function runRecord(ctx: any, result: Record<string, unknown>) {
  const variables = {
    phoneNumber: ctx.phone,
    amount: ctx.amount,
    categoryId: ctx.categoryId,
    entryType: 'cash',
    receiptNumber: undefined,
    transactionDate: undefined,
    notes: undefined,
  }
  const mocks = [
    {
      request: { query: CREATE_MANUAL_CONTRIBUTION, variables },
      result: { data: { createManualContribution: { __typename: 'ContributionResponse', ...result } } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Recorder variables={variables} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('An administrator records a cash contribution for a member', ({ given, and, when, then }) => {
    const ctx: any = { result: null, categoryId: 'cat-tithe' }

    given(/^a contribution category "(.*)" with code "(.*)"$/, (name: string) => {
      ctx.category = name
    })
    and(/^a member exists with phone "(.*)"$/, (phone: string) => {
      ctx.phone = phone
    })
    when(
      /^the administrator records a manual contribution of "(.*)" to "(.*)" for "(.*)"$/,
      async (amount: string, _category: string, phone: string) => {
        ctx.amount = amount
        ctx.phone = phone
        runRecord(ctx, {
          success: true,
          message: 'Contribution recorded',
          contribution: {
            __typename: 'ContributionType',
            id: 'm1',
            amount,
            entryType: 'cash',
            manualReceiptNumber: 'RCP-20260612-1',
            transactionDate: '2026-06-12',
            status: 'completed',
            member: { __typename: 'MemberType', id: 'mem1', fullName: 'Grace A', phoneNumber: phone, memberNumber: '100001', isGuest: false },
            category: { __typename: 'CategoryType', id: ctx.categoryId, name: ctx.category, code: 'TITHE' },
          },
        })
        await waitFor(() => expect(ctx.result).not.toBeNull())
      }
    )
    then(/^the manual contribution is recorded as "(.*)"$/, (status: string) => {
      expect(ctx.result.success).toBe(true)
      expect(ctx.result.contribution.status).toBe(status)
    })
  })

  test('A manual contribution below the minimum amount is rejected', ({ given, when, then }) => {
    const ctx: any = { result: null, categoryId: 'cat-tithe', phone: '254712345678' }

    given(/^a contribution category "(.*)" with code "(.*)"$/, (name: string) => {
      ctx.category = name
    })
    when(
      /^the administrator records a manual contribution of "(.*)" to "(.*)" for "(.*)"$/,
      async (amount: string, _category: string, phone: string) => {
        ctx.amount = amount
        ctx.phone = phone
        runRecord(ctx, {
          success: false,
          message: 'Amount must be at least KES 1.00',
          contribution: null,
        })
        await waitFor(() => expect(ctx.result).not.toBeNull())
      }
    )
    then('the manual contribution is rejected', () => {
      expect(ctx.result.success).toBe(false)
    })
  })
})
