/**
 * ThemeProvider tests.
 *
 * Thin wrapper around next-themes' provider. We mock the upstream provider to
 * capture the configuration props and confirm children pass through.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const providerProps: Record<string, unknown>[] = []

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...rest }: { children: React.ReactNode }) => {
    providerProps.push(rest)
    return <div data-testid="next-themes">{children}</div>
  },
}))

import { ThemeProvider } from '@/lib/theme/theme-provider'

describe('ThemeProvider', () => {
  it('renders its children', () => {
    render(
      <ThemeProvider>
        <span>hello theme</span>
      </ThemeProvider>
    )
    expect(screen.getByText('hello theme')).toBeInTheDocument()
  })

  it('configures next-themes with class attribute, light default, and the church storage key', () => {
    render(
      <ThemeProvider>
        <span>x</span>
      </ThemeProvider>
    )
    const props = providerProps.at(-1)!
    expect(props.attribute).toBe('class')
    expect(props.defaultTheme).toBe('light')
    expect(props.enableSystem).toBe(true)
    expect(props.storageKey).toBe('church-theme')
    expect(props.themes).toEqual(['light', 'dark', 'system'])
  })
})
