import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders with text content', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toHaveAttribute('data-variant', 'default')
  })

  it('applies secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText('Secondary')).toHaveAttribute('data-variant', 'secondary')
  })

  it('applies destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>)
    expect(screen.getByText('Error')).toHaveAttribute('data-variant', 'destructive')
  })

  it('applies outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText('Outline')).toHaveAttribute('data-variant', 'outline')
  })

  it('merges custom className', () => {
    render(<Badge className="custom-class">Test</Badge>)
    expect(screen.getByText('Test').className).toContain('custom-class')
  })

  it('has data-slot badge attribute', () => {
    render(<Badge>Slot</Badge>)
    expect(screen.getByText('Slot')).toHaveAttribute('data-slot', 'badge')
  })
})
