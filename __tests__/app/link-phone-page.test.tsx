import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'

import { CHECK_AND_LINK_PHONE } from '@/lib/graphql/auth-mutations'
import LinkPhonePage from '@/app/(auth)/link-phone/page'

// ── mocks ──────────────────────────────────────────────────────────────────
const completeAuthMock = vi.fn()
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    completeAuth: completeAuthMock,
  }),
}))

const pushMock = vi.fn()
const replaceMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: (param: string) => (param === 'redirect' ? '/custom-redirect' : null),
  }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: (m: string) => toastError(m),
  },
}))

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

describe('LinkPhonePage', () => {
  beforeEach(() => {
    sessionStorageMock.clear()
    pushMock.mockClear()
    replaceMock.mockClear()
    toastSuccess.mockClear()
    toastError.mockClear()
    completeAuthMock.mockClear()
  })

  it('redirects to /login if linking_token is missing', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <LinkPhonePage />
      </MockedProvider>
    )

    expect(pushMock).toHaveBeenCalledWith('/login')
    expect(toastError).toHaveBeenCalledWith('Session expired or invalid. Please log in again.')
  })

  it('renders the form when linking token is present', () => {
    sessionStorageMock.setItem('linking_token', 'valid-linking-token')
    sessionStorageMock.setItem('gated_email', 'test@example.com')

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <LinkPhonePage />
      </MockedProvider>
    )

    expect(screen.getByText(/Link Phone Number/i)).toBeInTheDocument()
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
  })

  it('submits the phone linking successfully and establishes auth context session', async () => {
    sessionStorageMock.setItem('linking_token', 'valid-linking-token')
    sessionStorageMock.setItem('gated_email', 'test@example.com')

    const linkMock = {
      request: {
        query: CHECK_AND_LINK_PHONE,
        variables: {
          phoneNumber: '254712345678',
          linkingToken: 'valid-linking-token',
        },
      },
      result: {
        data: {
          checkAndLinkPhone: {
            success: true,
            message: 'Linked successfully',
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            userId: 42,
            memberId: 101,
            phoneNumber: '254712345678',
            email: 'test@example.com',
            fullName: 'Jane Doe',
            isNewMember: false,
            needsRegistration: false,
            registrationToken: null,
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[linkMock]} addTypename={false}>
        <LinkPhonePage />
      </MockedProvider>
    )

    const phoneInput = screen.getByLabelText('Phone Number')
    fireEvent.change(phoneInput, { target: { value: '712345678' } })

    const submitBtn = screen.getByRole('button', { name: /Verify & Link Phone/i })
    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(completeAuthMock).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        userId: 42,
        memberId: 101,
        phoneNumber: '254712345678',
        email: 'test@example.com',
        fullName: 'Jane Doe',
      })
    })

    expect(pushMock).toHaveBeenCalledWith('/custom-redirect')
    expect(toastSuccess).toHaveBeenCalledWith('Account successfully linked!')
    expect(sessionStorageMock.getItem('linking_token')).toBeNull()
  })

  it('redirects to /register if the linked phone requires registration', async () => {
    sessionStorageMock.setItem('linking_token', 'valid-linking-token')
    sessionStorageMock.setItem('gated_email', 'new@example.com')

    const linkMock = {
      request: {
        query: CHECK_AND_LINK_PHONE,
        variables: {
          phoneNumber: '254799999999',
          linkingToken: 'valid-linking-token',
        },
      },
      result: {
        data: {
          checkAndLinkPhone: {
            success: true,
            message: 'Phone verified. Registration required.',
            accessToken: null,
            refreshToken: null,
            userId: null,
            memberId: null,
            phoneNumber: null,
            email: null,
            fullName: null,
            isNewMember: true,
            needsRegistration: true,
            registrationToken: 'valid-registration-token',
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[linkMock]} addTypename={false}>
        <LinkPhonePage />
      </MockedProvider>
    )

    const phoneInput = screen.getByLabelText('Phone Number')
    fireEvent.change(phoneInput, { target: { value: '799999999' } })

    const submitBtn = screen.getByRole('button', { name: /Verify & Link Phone/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(sessionStorageMock.getItem('registration_token')).toBe('valid-registration-token')
    })

    expect(pushMock).toHaveBeenCalledWith('/register')
    expect(toastSuccess).toHaveBeenCalledWith('Phone verified. Please complete your registration details.')
  })
})
