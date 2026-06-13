/**
 * Web binding for the canonical `admin/member_import.feature`.
 *
 * Drives the app's real `IMPORT_MEMBERS` mutation through Apollo's
 * MockedProvider, mirroring the backend bulk-import counts.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useMutation } from '@apollo/client/react'
import React from 'react'

import { IMPORT_MEMBERS } from '@/lib/graphql/member-import-mutations'

const feature = loadFeature('./member_import.feature', { loadRelativePath: true })

const HEADER = 'first_name,last_name,phone_number'
const TWO_VALID = [HEADER, 'Grace,Achieng,254700000001', 'Peter,Otieno,254700000002'].join('\n')
const ONE_VALID_ONE_MISSING = [HEADER, 'Grace,Achieng,254700000003', 'Peter,Otieno,'].join('\n')

function Importer({ variables, onResult }: { variables: any; onResult: (r: any) => void }) {
  const [importMembers] = useMutation(IMPORT_MEMBERS)
  React.useEffect(() => {
    importMembers({ variables })
      .then((res: any) => onResult(res?.data?.importMembers ?? { success: false }))
      .catch((e: any) => onResult({ success: false, message: String(e?.message ?? e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function runImport(ctx: any, result: Record<string, unknown>) {
  const variables = { csvData: ctx.csv, fileType: 'csv', sendNotifications: undefined }
  const mocks = [
    {
      request: { query: IMPORT_MEMBERS, variables },
      result: {
        data: {
          importMembers: {
            __typename: 'MemberImportResponse',
            success: true,
            message: 'Import complete',
            importedCount: 0,
            createdCount: 0,
            updatedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            identifiersCreated: [],
            identifiersUpdated: [],
            errors: [],
            duplicates: [],
            ...result,
          },
        },
      },
    },
  ]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Importer variables={variables} onResult={(r) => (ctx.result = r)} />
    </MockedProvider>
  )
}

defineFeature(feature, (test) => {
  test('An administrator bulk-imports members from a CSV', ({ given, when, then, and }) => {
    const ctx: any = { result: null }

    given('a member import file with 2 valid member rows', () => {
      ctx.csv = TWO_VALID
    })
    when('the administrator imports the members', async () => {
      runImport(ctx, { importedCount: 2, createdCount: 2, errorCount: 0 })
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })
    then(/^(\d+) members are imported$/, (count: string) => {
      expect(ctx.result.importedCount).toBe(Number(count))
    })
    and('the import reports no errors', () => {
      expect(ctx.result.errorCount).toBe(0)
    })
  })

  test('A row missing a required field is reported as an error', ({ given, when, then, and }) => {
    const ctx: any = { result: null }

    given('a member import file with 1 valid row and 1 row missing the phone number', () => {
      ctx.csv = ONE_VALID_ONE_MISSING
    })
    when('the administrator imports the members', async () => {
      runImport(ctx, {
        importedCount: 1,
        createdCount: 1,
        errorCount: 1,
        errors: ["Row 2: Missing required field 'phone_number'"],
      })
      await waitFor(() => expect(ctx.result).not.toBeNull())
    })
    then('the import reports at least 1 error', () => {
      expect(ctx.result.errorCount).toBeGreaterThanOrEqual(1)
    })
    and(/^(\d+) member is imported$/, (count: string) => {
      expect(ctx.result.importedCount).toBe(Number(count))
    })
  })
})
