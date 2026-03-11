/**
 * Vitest Global Setup
 * Runs before every test file.
 * Following FIRST: provides a clean, repeatable baseline.
 */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Next.js navigation (used by ProtectedRoute, AdminLayout, etc.)
// ---------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// ---------------------------------------------------------------------------
// Mock next/image — renders a plain <img> so src assertions work in jsdom
// ---------------------------------------------------------------------------
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string;[key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return Object.assign(document.createElement('img'), { src, alt, ...props })
  },
}))

// ---------------------------------------------------------------------------
// Mock next/link — renders a standard <a> so href assertions work
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode;[key: string]: unknown }) => {
    const a = document.createElement('a')
    a.href = href as string
    return a
  },
}))

// ---------------------------------------------------------------------------
// Suppress console.error noise in tests (e.g. React act() warnings)
// Tests that rely on error logging should re-enable explicitly.
// ---------------------------------------------------------------------------
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('act(') || args[0].includes('ReactDOM'))
    ) {
      return
    }
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
