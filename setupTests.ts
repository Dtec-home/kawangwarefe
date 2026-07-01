/**
 * Vitest Global Setup
 * Runs before every test file.
 * Following FIRST: provides a clean, repeatable baseline.
 */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom lacks ResizeObserver; Radix UI primitives (Checkbox, etc.) need it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class _ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error — shim for tests
  globalThis.ResizeObserver = _ResizeObserverStub
}

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
// Mock next/link — renders a React <a> so href + children assertions work.
// Previously returned a raw DOM element; React 19 rejects that when the
// link has children, so we use createElement to keep things idiomatic.
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children?: React.ReactNode;[key: string]: unknown }) => {
    const React = require('react')
    return React.createElement('a', { href, ...props }, children)
  },
}))

// ---------------------------------------------------------------------------
// Mock Radix UI primitives that don't work in jsdom
// ---------------------------------------------------------------------------
vi.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('div', props, children)
  },
}))

vi.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: any) => {
    const React = require('react')
    return React.createElement('label', props, children)
  },
}))

vi.mock('@radix-ui/react-separator', () => ({
  Root: ({ ...props }: any) => {
    const React = require('react')
    return React.createElement('hr', props)
  },
}))

// ---------------------------------------------------------------------------
// Mock Radix UI Select — jsdom doesn't support Radix portals/popovers.
// Renders a native <select> so tests can assert on options.
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/select', () => {
  const React = require('react')
  return {
    Select: ({ children, value, onValueChange }: any) =>
      React.createElement('div', { 'data-testid': 'select-root' }, children),
    SelectTrigger: ({ children }: any) =>
      React.createElement('button', { type: 'button' }, children),
    SelectValue: ({ placeholder }: any) =>
      React.createElement('span', null, placeholder),
    SelectContent: ({ children }: any) =>
      React.createElement('div', null, children),
    SelectItem: ({ value, children }: any) =>
      React.createElement('div', { 'data-value': value }, children),
  }
})

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
