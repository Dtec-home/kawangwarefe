/**
 * Member prayer submit page tests (Sprint 7 / Epic E5).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const submitFn = vi.fn().mockResolvedValue({
  data: {
    submitPrayerRequest: {
      success: true,
      message: 'Submitted',
      request: { id: '1' },
    },
  },
})

vi.mock('@apollo/client/react', () => ({
  useQuery: (doc: any) => {
    const name = doc?.definitions?.[0]?.name?.value ?? ''
    if (name === 'GetMyPrayerRequests') {
      return {
        data: { myPrayerRequests: [] },
        loading: false, error: null, refetch: vi.fn(),
      }
    }
    return { data: null, loading: false, error: null }
  },
  useMutation: () => [submitFn, { loading: false }],
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/prayers/new',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}))

vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: any) => React.createElement('div', null, children),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: { fullName: 'Test Member', phoneNumber: '254700000001' },
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({
    canAccessAdmin: false,
    canAccessContent: false,
    isStaff: false,
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import NewPrayerPage from '@/app/(dashboard)/prayers/new/page'

describe('NewPrayerPage', () => {
  it('renders the submission form', () => {
    render(<NewPrayerPage />)
    expect(screen.getByText('Submit a Prayer Request')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Details')).toBeInTheDocument()
  })

  it('submits via submitPrayerRequest mutation', async () => {
    render(<NewPrayerPage />)
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Please pray for my family' },
    })
    fireEvent.change(screen.getByLabelText('Details'), {
      target: { value: 'Thank you' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }))

    await Promise.resolve()
    expect(submitFn).toHaveBeenCalled()
    const call = submitFn.mock.calls[submitFn.mock.calls.length - 1][0]
    expect(call.variables).toMatchObject({
      title: 'Please pray for my family',
      body: 'Thank you',
      isAnonymous: false,
      visibility: 'team',
    })
  })
})
