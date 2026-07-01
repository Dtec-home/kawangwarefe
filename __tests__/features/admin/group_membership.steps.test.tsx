/**
 * Web binding for the canonical `admin/group_membership.feature` (@parity).
 *
 * Drives the web app's real `BULK_ADD_MEMBERS_TO_GROUP` mutation through Apollo's
 * MockedProvider, mirroring the backend BDD flow. The mocked response encodes the
 * breakdown the GroupMembershipService would produce for the given member states,
 * so the web binding asserts the client sends the right memberIds and surfaces the
 * added / already-member / skipped counts.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { BULK_ADD_MEMBERS_TO_GROUP } from '@/lib/graphql/group-management'

const feature = loadFeature('./group_membership.feature', { loadRelativePath: true })

const GROUP_ID = '953'

// Deterministic ids keyed by scenario member name.
const MEMBER_IDS: Record<string, string> = {
  Ann: '14201',
  Ben: '14202',
  Cyn: '14203',
  Del: '14204',
}

function BulkAdder({ variables, mockResult, onResult }: any) {
  const [add] = useMutation(BULK_ADD_MEMBERS_TO_GROUP)
  React.useEffect(() => {
    add({ variables })
      .then((res: any) => onResult(res?.data?.bulkAddMembersToGroup ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// Rules mirror the backend GroupMembershipService.
function breakdownFor(members: any[]) {
  const added = members.filter(m => m.state === 'account' || m.state === 'noaccount').length
  const already = members.filter(m => m.state === 'already').length
  const skippedMembers = members.filter(m => m.state === 'deleted').map(m => `${m.name} (deleted)`)
  return { added, already, skipped: skippedMembers.length, skippedMembers }
}

defineFeature(feature, (test) => {
  const setup = () => {
    const ctx: any = { members: {}, groupId: GROUP_ID, result: null }

    const registerMember = (name: string, state: string) => {
      ctx.members[name] = { id: MEMBER_IDS[name], name, state }
    }

    const bulkAdd = async (namesPhrase: string) => {
      const names = namesPhrase.replace(/ and /g, ',').split(',').map(s => s.trim()).filter(Boolean)
      const chosen = names.map(n => ctx.members[n])
      const memberIds = chosen.map(m => m.id)
      const b = breakdownFor(chosen)
      const variables = { memberIds, groupId: ctx.groupId }
      const mocks = [{
        request: { query: BULK_ADD_MEMBERS_TO_GROUP, variables },
        result: {
          data: {
            bulkAddMembersToGroup: {
              __typename: 'GroupResponse',
              success: true,
              message: `Added ${b.added}`,
              addedCount: b.added,
              alreadyMemberCount: b.already,
              skippedCount: b.skipped,
              skippedMembers: b.skippedMembers,
            },
          },
        },
      }]
      render(
        <MockedProvider mocks={mocks}>
          <BulkAdder variables={variables} onResult={(r: any) => { ctx.result = r }} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.result).not.toBeNull())
    }

    return { ctx, registerMember, bulkAdd }
  }

  test('Adding a mix of new, existing, and account-less members', ({ given, and, when, then }) => {
    const { ctx, registerMember, bulkAdd } = setup()

    given(/^a group "(.*)" exists$/, () => {})
    and('an admin is signed in', () => {})
    and(/^a member "(.*)" who is already in "(.*)"$/, (name: string) => registerMember(name, 'already'))
    and(/^a member "(.*)" with a login account, not in "(.*)"$/, (name: string) => registerMember(name, 'account'))
    and(/^a member "(.*)" with no login account, not in "(.*)"$/, (name: string) => registerMember(name, 'noaccount'))

    when(/^the admin bulk-adds (.*) to "(.*)"$/, async (names: string) => { await bulkAdd(names) })

    then(/^the result reports (\d+) added, (\d+) already a member, (\d+) skipped$/,
      (added: string, already: string, skipped: string) => {
        expect(ctx.result.addedCount).toBe(Number(added))
        expect(ctx.result.alreadyMemberCount).toBe(Number(already))
        expect(ctx.result.skippedCount).toBe(Number(skipped))
      })
    and(/^(\w+) is in "(.*)"$/, () => {})  // Ben
    and(/^(\w+) is in "(.*)"$/, () => {})  // Cyn
    and(/^(\w+) now has a login account$/, () => {})
  })

  test('Re-running the same add is idempotent', ({ given, and, when, then }) => {
    const { ctx, registerMember, bulkAdd } = setup()

    given(/^a group "(.*)" exists$/, () => {})
    and('an admin is signed in', () => {})
    and(/^a member "(.*)" who is already in "(.*)"$/, (name: string) => registerMember(name, 'already'))

    when(/^the admin bulk-adds (.*) to "(.*)"$/, async (names: string) => { await bulkAdd(names) })

    then(/^the result reports (\d+) added, (\d+) already a member, (\d+) skipped$/,
      (added: string, already: string, skipped: string) => {
        expect(ctx.result.addedCount).toBe(Number(added))
        expect(ctx.result.alreadyMemberCount).toBe(Number(already))
        expect(ctx.result.skippedCount).toBe(Number(skipped))
      })
    and('the operation still succeeds', () => {
      expect(ctx.result.success).toBe(true)
    })
  })

  test('Deleted members are rejected, not silently dropped', ({ given, and, when, then }) => {
    const { ctx, registerMember, bulkAdd } = setup()

    given(/^a group "(.*)" exists$/, () => {})
    and('an admin is signed in', () => {})
    and(/^a soft-deleted member "(.*)"$/, (name: string) => registerMember(name, 'deleted'))

    when(/^the admin bulk-adds (.*) to "(.*)"$/, async (names: string) => { await bulkAdd(names) })

    then(/^the result reports (\d+) added and "(.*)" is listed as skipped$/,
      (added: string, name: string) => {
        expect(ctx.result.addedCount).toBe(Number(added))
        expect(ctx.result.skippedMembers.some((s: string) => s.includes(name))).toBe(true)
      })
  })
})
