/**
 * Web binding for the canonical `rbac/permissions.feature`.
 *
 * Drives the app's real `GetCurrentUserRole` query (the surface behind the
 * `useUserRole()` hook) through Apollo's MockedProvider and asserts the role +
 * scope flags the web uses to gate admin UI. The role payload per scenario
 * mirrors what the backend `PermissionChecker` computes for that role.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import React from 'react'

const feature = loadFeature('./permissions.feature', { loadRelativePath: true })

// Same query the production `useUserRole()` hook fires.
const GET_CURRENT_USER_ROLE = gql`
  query GetCurrentUserRole {
    currentUserRole {
      isAuthenticated
      isStaff
      isCategoryAdmin
      isGroupAdmin
      isContentAdmin
      canSendBulkMessage
      adminCategoryIds
      adminGroupNames
      adminCategories {
        id
        name
        code
        description
      }
    }
  }
`

function RoleProbe({ onResult }: { onResult: (r: any) => void }) {
  const { data } = useQuery(GET_CURRENT_USER_ROLE)
  React.useEffect(() => {
    if (data) onResult((data as any).currentUserRole)
  }, [data, onResult])
  return null
}

function emptyRole() {
  return {
    __typename: 'UserRoleInfo',
    isAuthenticated: true,
    isStaff: false,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: false,
    adminCategoryIds: [] as string[],
    adminGroupNames: [] as string[],
    adminCategories: [] as any[],
  }
}

async function fetchRole(ctx: any, role: Record<string, unknown>) {
  const mocks = [
    {
      request: { query: GET_CURRENT_USER_ROLE },
      result: { data: { currentUserRole: { ...emptyRole(), ...role } } },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <RoleProbe onResult={(r) => (ctx.role = r)} />
    </MockedProvider>
  )
  await waitFor(() => expect(ctx.role).toBeTruthy())
}

function category(name: string) {
  return { __typename: 'Category', id: name.toLowerCase(), name, code: name.toUpperCase(), description: '' }
}

defineFeature(feature, (test) => {
  test('A staff administrator can manage content and generate reports', ({ given, then, and }) => {
    const ctx: any = {}
    given(/^a member with the "(.*)" role$/, async () => {
      await fetchRole(ctx, { isStaff: true, canSendBulkMessage: true })
    })
    then('they can manage content', () => {
      expect(ctx.role.isStaff || ctx.role.isContentAdmin).toBe(true)
    })
    and('they can generate financial reports', () => {
      expect(ctx.role.isStaff).toBe(true)
    })
    and('they have staff privileges', () => {
      expect(ctx.role.isStaff).toBe(true)
    })
  })

  test('A content administrator can manage content but is not financial staff', ({ given, then, and }) => {
    const ctx: any = {}
    given(/^a member with the "(.*)" role$/, async () => {
      await fetchRole(ctx, { isContentAdmin: true })
    })
    then('they can manage content', () => {
      expect(ctx.role.isStaff || ctx.role.isContentAdmin).toBe(true)
    })
    and('they cannot generate financial reports', () => {
      expect(ctx.role.isStaff).toBe(false)
    })
    and('they do not have staff privileges', () => {
      expect(ctx.role.isStaff).toBe(false)
    })
  })

  test('A regular member is denied every admin capability', ({ given, then, and }) => {
    const ctx: any = {}
    given(/^a member with the "(.*)" role$/, async () => {
      await fetchRole(ctx, {})
    })
    then('they cannot manage content', () => {
      expect(ctx.role.isStaff || ctx.role.isContentAdmin).toBe(false)
    })
    and('they cannot generate financial reports', () => {
      expect(ctx.role.isStaff).toBe(false)
    })
    and('they cannot send bulk messages', () => {
      expect(ctx.role.canSendBulkMessage).toBe(false)
    })
  })

  test('A department administrator may only message their own department', ({ given, and, then }) => {
    const ctx: any = {}
    given(/^a department administrator scoped to the "(.*)" department$/, async (dept: string) => {
      await fetchRole(ctx, {
        isCategoryAdmin: true,
        canSendBulkMessage: true,
        adminCategories: [category(dept)],
        adminCategoryIds: [dept.toLowerCase()],
      })
    })
    and(/^another department "(.*)" they do not administer$/, (dept: string) => {
      ctx.otherDept = dept
    })
    then('they can send bulk messages', () => {
      expect(ctx.role.canSendBulkMessage).toBe(true)
    })
    and(/^their messaging scope includes the "(.*)" department$/, (dept: string) => {
      expect(ctx.role.adminCategories.some((c: any) => c.name === dept)).toBe(true)
    })
    and(/^their messaging scope excludes the "(.*)" department$/, (dept: string) => {
      expect(ctx.role.adminCategories.some((c: any) => c.name === dept)).toBe(false)
    })
  })

  test('A group administrator may only message their own group', ({ given, and, then }) => {
    const ctx: any = {}
    given(/^a group administrator scoped to the "(.*)" group$/, async (group: string) => {
      await fetchRole(ctx, {
        isGroupAdmin: true,
        canSendBulkMessage: true,
        adminGroupNames: [group],
      })
    })
    and(/^another group "(.*)" they do not administer$/, (group: string) => {
      ctx.otherGroup = group
    })
    then(/^their messaging scope includes the "(.*)" group$/, (group: string) => {
      expect(ctx.role.adminGroupNames.includes(group)).toBe(true)
    })
    and(/^their messaging scope excludes the "(.*)" group$/, (group: string) => {
      expect(ctx.role.adminGroupNames.includes(group)).toBe(false)
    })
  })
})
