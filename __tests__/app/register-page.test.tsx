import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'

import { COMPLETE_REGISTRATION, REGISTRATION_OPTIONS, REGISTER_WITH_PHONE_LINKING } from '@/lib/graphql/auth-mutations'

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

// ── mocks ──────────────────────────────────────────────────────────────────
const completeAuthMock = vi.fn()
let authState = { isAuthenticated: true, isLoading: false }
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    ...authState,
    completeAuth: completeAuthMock,
  }),
}))

const replace = vi.fn()
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import RegisterPage from '@/app/(auth)/register/page'

const optionsMock = {
  request: { query: REGISTRATION_OPTIONS },
  result: { data: { registrationDepartments: [], registrationGroups: [] } },
}

function renderPage(extraMocks: any[] = []) {
  return render(
    <MockedProvider mocks={[optionsMock, ...extraMocks]} addTypename={false}>
      <RegisterPage />
    </MockedProvider>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    sessionStorageMock.clear()
    authState = { isAuthenticated: true, isLoading: false }
    replace.mockClear()
    push.mockClear()
    toastSuccess.mockClear()
    toastError.mockClear()
    completeAuthMock.mockClear()
  })

  it('renders the complete-registration form when authenticated', () => {
    renderPage()
    expect(screen.getByText(/Tell us a bit about yourself/i)).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    authState = { isAuthenticated: false, isLoading: false }
    renderPage()
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('allows access to unauthenticated users who have a registration token', () => {
    authState = { isAuthenticated: false, isLoading: false }
    sessionStorageMock.setItem('registration_token', 'valid-reg-token')
    renderPage()
    expect(screen.getByText(/Tell us a bit about yourself/i)).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('keeps submit disabled until both names are at least 2 characters', () => {
    renderPage()
    const button = screen.getByRole('button', { name: /complete registration/i })
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jo' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Kamau' } })
    expect(button).not.toBeDisabled()
  })

  it('submits the registration and routes to the dashboard on success', async () => {
    const completeMock = {
      request: {
        query: COMPLETE_REGISTRATION,
        variables: { firstName: 'John', lastName: 'Kamau', departmentId: null, groupId: null },
      },
      result: {
        data: {
          completeRegistration: {
            success: true,
            message: 'Welcome',
            member: { id: 'm1', fullName: 'John Kamau', isGuest: false },
          },
        },
      },
    }
    renderPage([completeMock])

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Kamau' } })
    fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('submits registerWithPhoneLinking on submit when registration token is present', async () => {
    authState = { isAuthenticated: false, isLoading: false }
    sessionStorageMock.setItem('registration_token', 'valid-reg-token')

    const registerLinkingMock = {
      request: {
        query: REGISTER_WITH_PHONE_LINKING,
        variables: {
          registrationToken: 'valid-reg-token',
          firstName: 'Jane',
          lastName: 'Smith',
          departmentId: null,
          groupId: null,
        },
      },
      result: {
        data: {
          registerWithPhoneLinking: {
            success: true,
            message: 'Welcome',
            accessToken: 'token-a',
            refreshToken: 'token-r',
            userId: 55,
            memberId: 77,
            phoneNumber: '254711111111',
            email: 'new@example.com',
            fullName: 'Jane Smith',
          },
        },
      },
    }

    renderPage([registerLinkingMock])

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Smith' } })
    fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

    await waitFor(() => {
      expect(completeAuthMock).toHaveBeenCalledWith({
        accessToken: 'token-a',
        refreshToken: 'token-r',
        userId: 55,
        memberId: 77,
        phoneNumber: '254711111111',
        email: 'new@example.com',
        fullName: 'Jane Smith',
      })
    })

    expect(push).toHaveBeenCalledWith('/dashboard')
    expect(toastSuccess).toHaveBeenCalled()
    expect(sessionStorageMock.getItem('registration_token')).toBeNull()
  })
})
