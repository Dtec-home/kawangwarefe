import { describe, it, expect, vi } from 'vitest'

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

vi.mock('sonner', () => ({
  Toaster: (props: any) => {
    const React = require('react')
    return React.createElement('div', { 'data-testid': 'sonner-toaster', ...props })
  },
}))

import { render, screen } from '@testing-library/react'
import { Toaster } from '@/components/ui/sonner'

describe('Toaster (sonner)', () => {
  it('renders the toaster component', () => {
    render(<Toaster />)
    expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument()
  })
})
