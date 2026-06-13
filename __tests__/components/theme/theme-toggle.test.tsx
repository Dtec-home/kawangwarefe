import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// next-themes is mocked so we control the current theme and observe setTheme.
const setTheme = vi.fn()
let currentTheme: string | undefined = 'light'

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: currentTheme, setTheme, themes: ['light', 'dark', 'system'] }),
}))

import { ThemeToggle } from '@/components/theme/theme-toggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    setTheme.mockClear()
    currentTheme = 'light'
  })

  it('renders nothing while the theme is still hydrating (undefined)', () => {
    currentTheme = undefined
    const { container } = render(<ThemeToggle />)
    expect(container.firstChild).toBeNull()
  })

  it('cycles light → dark on click (button variant)', () => {
    currentTheme = 'light'
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('cycles dark → system on click', () => {
    currentTheme = 'dark'
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(setTheme).toHaveBeenCalledWith('system')
  })

  it('cycles system → light on click (wraps around)', () => {
    currentTheme = 'system'
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('shows the current theme label when showLabel is set', () => {
    currentTheme = 'dark'
    render(<ThemeToggle showLabel />)
    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('renders the menu variant trigger (system theme → Monitor icon)', () => {
    currentTheme = 'system'
    render(<ThemeToggle variant="menu" />)
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
    expect(screen.getByTitle('Theme menu')).toBeInTheDocument()
  })

  it('renders the menu variant trigger for the dark theme', () => {
    currentTheme = 'dark'
    render(<ThemeToggle variant="menu" />)
    expect(screen.getByTitle('Theme menu')).toBeInTheDocument()
  })
})
