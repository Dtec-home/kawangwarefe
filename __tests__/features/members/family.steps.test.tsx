/**
 * Web binding for the canonical `members/family.feature`.
 *
 * Drives the web app's real `ADD_CHILD` mutation and `GET_MY_DEPENDENTS` query
 * through Apollo's MockedProvider, mirroring the backend BDD family flow.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation, useQuery } from '@apollo/client/react'
import React from 'react'

import { ADD_CHILD, GET_MY_DEPENDENTS } from '@/lib/graphql/family-mutations'

const feature = loadFeature('./family.feature', { loadRelativePath: true })

function ChildAdder({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [addChild] = useMutation(ADD_CHILD)
  React.useEffect(() => {
    addChild({ variables })
      .then((res: any) => onResult(res?.data?.addChild ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function DependentsViewer({ onResult }: { onResult: (r: any[]) => void }) {
  const { data, loading } = useQuery(GET_MY_DEPENDENTS)
  React.useEffect(() => {
    if (!loading) onResult((data as any)?.myDependents ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data])
  return null
}

function makeChild(first: string, last: string) {
  return {
    __typename: 'MemberType',
    id: 'c1',
    firstName: first,
    lastName: last,
    fullName: `${first} ${last}`,
    isMinor: true,
    dateOfBirth: null,
    memberNumber: '100123',
  }
}

defineFeature(feature, (test) => {
  test('A guardian adds a child and sees them as a dependent', ({ given, when, and, then }) => {
    const ctx: any = { addResult: null, dependents: null }

    given('an adult member who is a guardian', () => {
      ctx.guardian = true
    })

    when(/^they add a child named "(.*)" "(.*)"$/, async (first: string, last: string) => {
      const variables = { firstName: first, lastName: last, dateOfBirth: null }
      const child = makeChild(first, last)
      ctx.child = child
      const mocks = [
        {
          request: { query: ADD_CHILD, variables },
          result: {
            data: {
              addChild: {
                __typename: 'MemberResponse',
                success: true,
                message: 'Child added',
                member: child,
              },
            },
          },
        },
      ]
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <ChildAdder variables={variables} onResult={(r) => (ctx.addResult = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.addResult).not.toBeNull())
    })

    then('the child is added', () => {
      expect(ctx.addResult.success).toBe(true)
    })

    and(/^the guardian has (\d+) dependent$/, async (count: string) => {
      const mocks = [
        {
          request: { query: GET_MY_DEPENDENTS },
          result: { data: { myDependents: [ctx.child] } },
        },
      ]
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <DependentsViewer onResult={(r) => (ctx.dependents = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.dependents).not.toBeNull())
      expect(ctx.dependents).toHaveLength(Number(count))
    })
  })

  test('A child cannot be added without a name', ({ given, when, then }) => {
    const ctx: any = { addResult: null }

    given('an adult member who is a guardian', () => {
      ctx.guardian = true
    })

    when('they add a child with a blank first name', async () => {
      const variables = { firstName: '', lastName: 'Otieno', dateOfBirth: null }
      const mocks = [
        {
          request: { query: ADD_CHILD, variables },
          result: {
            data: {
              addChild: {
                __typename: 'MemberResponse',
                success: false,
                message: 'Valid first name is required',
                member: null,
              },
            },
          },
        },
      ]
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <ChildAdder variables={variables} onResult={(r) => (ctx.addResult = r)} />
        </MockedProvider>
      )
      await waitFor(() => expect(ctx.addResult).not.toBeNull())
    })

    then('adding the child is rejected', () => {
      expect(ctx.addResult.success).toBe(false)
    })
  })
})
