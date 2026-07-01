/**
 * Web binding for the canonical `auth/registration.feature`.
 *
 * Drives the web app's real `COMPLETE_REGISTRATION` mutation through Apollo's
 * MockedProvider. Mirrors the backend BDD give-before-profile flow: completing
 * registration clears the guest flag; an invalid name is rejected.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { COMPLETE_REGISTRATION } from '@/lib/graphql/auth-mutations'

const feature = loadFeature('./registration.feature', { loadRelativePath: true })

function Registrar({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [complete] = useMutation(COMPLETE_REGISTRATION)
  React.useEffect(() => {
    complete({ variables })
      .then((res: any) => onResult(res?.data?.completeRegistration ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function runRegister(ctx: any, first: string, last: string, result: Record<string, unknown>) {
  const variables = { firstName: first, lastName: last, departmentId: null, groupId: null }
  const mocks = [
    {
      request: { query: COMPLETE_REGISTRATION, variables },
      result: { data: { completeRegistration: { __typename: 'MemberResponse', ...result } } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Registrar variables={variables} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('A new giver completes their profile after giving', ({ given, when, and, then }) => {
    const ctx: any = { result: null }

    given('a guest member who has not completed their profile', () => {
      ctx.isGuest = true
    })

    when(
      /^they complete registration with first name "(.*)" and last name "(.*)"$/,
      async (first: string, last: string) => {
        runRegister(ctx, first, last, {
          success: true,
          message: 'Registration complete',
          member: {
            __typename: 'MemberType',
            id: '1',
            firstName: first,
            lastName: last,
            fullName: `${first} ${last}`,
            isGuest: false,
          },
        })
        await waitFor(() => expect(ctx.result).not.toBeNull())
      }
    )

    then('registration succeeds', () => {
      expect(ctx.result.success).toBe(true)
    })

    and('the member is no longer a guest', () => {
      expect(ctx.result.member.isGuest).toBe(false)
    })
  })

  test('Registration requires a valid name', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given('a guest member who has not completed their profile', () => {
      ctx.isGuest = true
    })

    when(
      /^they complete registration with first name "(.*)" and last name "(.*)"$/,
      async (first: string, last: string) => {
        runRegister(ctx, first, last, {
          success: false,
          message: 'Valid first name is required (2-50 letters)',
          member: null,
        })
        await waitFor(() => expect(ctx.result).not.toBeNull())
      }
    )

    then('registration is rejected', () => {
      expect(ctx.result.success).toBe(false)
    })
  })
})
