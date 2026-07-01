import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('has data-slot textarea', () => {
    render(<Textarea data-testid="ta" />)
    expect(screen.getByTestId('ta')).toHaveAttribute('data-slot', 'textarea')
  })
})
