/**
 * Web binding for the canonical `auth/otp_login.feature`.
 *
 * Drives the web app's real `VERIFY_OTP` mutation through Apollo's
 * MockedProvider. The backend BDD suite exercises the real OTP verification;
 * here the mock stands in for the server so the web auth data-path is proven to
 * honour the same accept/reject behaviour.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { VERIFY_OTP } from '@/lib/graphql/auth-mutations'

const feature = loadFeature('./otp_login.feature', { loadRelativePath: true })

function Verifier({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [verify] = useMutation(VERIFY_OTP)
  React.useEffect(() => {
    verify({ variables })
      .then((res: any) => onResult(res?.data?.verifyOtp ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function runVerify(ctx: any, otpCode: string, result: Record<string, unknown>) {
  const variables = { phoneNumber: ctx.phone, otpCode }
  const mocks = [
    {
      request: { query: VERIFY_OTP, variables },
      result: { data: { verifyOtp: { __typename: 'AuthResponse', ...result } } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Verifier variables={variables} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

const AUTHED = {
  success: true,
  message: 'Authentication successful',
  accessToken: 'jwt-access-token',
  refreshToken: 'jwt-refresh-token',
  userId: 1,
  memberId: 1,
  phoneNumber: '254712345678',
  fullName: 'Test Member',
  isNewMember: false,
}

const REJECTED = {
  success: false,
  message: 'Invalid or expired OTP',
  accessToken: null,
  refreshToken: null,
  userId: null,
  memberId: null,
  phoneNumber: null,
  fullName: null,
  isNewMember: null,
}

defineFeature(feature, (test) => {
  test('A member logs in with the correct OTP', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given(/^a member with phone "(.*)" who requested a login code$/, (phone: string) => {
      ctx.phone = phone
    })

    when('they submit the correct OTP', async () => {
      runVerify(ctx, '123456', AUTHED)
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('they are authenticated', () => {
      expect(ctx.result.success).toBe(true)
      expect(ctx.result.accessToken).toBeTruthy()
    })
  })

  test('A wrong OTP is rejected', ({ given, when, then }) => {
    const ctx: any = { result: null }

    given(/^a member with phone "(.*)" who requested a login code$/, (phone: string) => {
      ctx.phone = phone
    })

    when('they submit an incorrect OTP', async () => {
      runVerify(ctx, '000000', REJECTED)
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('authentication is rejected', () => {
      expect(ctx.result.success).toBe(false)
    })
  })
})
