/**
 * Web binding for the canonical `profile/update.feature`.
 *
 * Drives the web app's real `UPDATE_MEMBER_PROFILE` mutation through Apollo's
 * MockedProvider, mirroring the backend BDD profile-update flow.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { UPDATE_MEMBER_PROFILE } from '@/lib/graphql/profile-mutations'

const feature = loadFeature('./update.feature', { loadRelativePath: true })

const DEPARTMENT_ID = '7'

function ProfileUpdater({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [update] = useMutation(UPDATE_MEMBER_PROFILE)
  React.useEffect(() => {
    update({ variables })
      .then((res: any) => onResult(res?.data?.updateMemberProfile ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

defineFeature(feature, (test) => {
  test('A member sets their department', ({ given, and, when, then }) => {
    const ctx: any = { result: null, departments: {} }

    given('a member with a linked account', () => {
      ctx.linked = true
    })

    and(/^a department "(.*)" exists$/, (name: string) => {
      ctx.departments[name] = DEPARTMENT_ID
    })

    when(/^the member sets their department to "(.*)"$/, async (name: string) => {
      const variables = { departmentId: ctx.departments[name], groupIds: null }
      const mocks = [
        {
          request: { query: UPDATE_MEMBER_PROFILE, variables },
          result: {
            data: {
              updateMemberProfile: {
                __typename: 'MemberResponse',
                success: true,
                message: 'Profile updated',
                member: {
                  __typename: 'MemberType',
                  id: '1',
                  fullName: 'Test Member',
                  department: { __typename: 'ContributionCategoryType', id: DEPARTMENT_ID, name },
                  groups: [],
                },
              },
            },
          },
        },
      ]
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <ProfileUpdater variables={variables} onResult={(r) => (ctx.result = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })

    then('the profile update succeeds', () => {
      expect(ctx.result.success).toBe(true)
    })

    and(/^the member's department is "(.*)"$/, (name: string) => {
      expect(ctx.result.member.department.name).toBe(name)
    })
  })
})
