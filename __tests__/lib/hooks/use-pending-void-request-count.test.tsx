/**
 * usePendingVoidRequestCount (T2.6)
 */
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import type { ReactNode } from 'react'
import { usePendingVoidRequestCount } from '@/lib/hooks/use-pending-void-request-count'
import { GET_PENDING_VOID_REQUEST_COUNT } from '@/lib/graphql/receipt-queries'

const mocks = [
  {
    request: { query: GET_PENDING_VOID_REQUEST_COUNT },
    result: {
      data: {
        voidRequests: [
          { __typename: 'ReceiptVoidRequestType', id: '1' },
          { __typename: 'ReceiptVoidRequestType', id: '2' },
        ],
      },
    },
  },
]

const wrapper = ({ children }: { children: ReactNode }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>

describe('usePendingVoidRequestCount', () => {
  it('counts pending void requests when enabled', async () => {
    const { result } = renderHook(() => usePendingVoidRequestCount({ enabled: true }), { wrapper })
    await waitFor(() => expect(result.current).toBe(2))
  })

  it('returns 0 without querying when disabled', () => {
    const { result } = renderHook(() => usePendingVoidRequestCount({ enabled: false }), {
      wrapper: ({ children }: { children: ReactNode }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    })
    expect(result.current).toBe(0)
  })
})
