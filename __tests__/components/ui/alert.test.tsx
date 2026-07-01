import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert', () => {
  it('renders with role alert', () => {
    render(<Alert>Content</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders title and description', () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Something happened</AlertDescription>
      </Alert>,
    )
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('Something happened')).toBeInTheDocument()
  })

  it('applies data-slot attributes', () => {
    render(
      <Alert>
        <AlertTitle>T</AlertTitle>
        <AlertDescription>D</AlertDescription>
      </Alert>,
    )
    expect(document.querySelector('[data-slot="alert"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="alert-title"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="alert-description"]')).toBeInTheDocument()
  })
})
