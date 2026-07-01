import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlertDialogHeader, AlertDialogFooter, AlertDialogMedia } from '@/components/ui/alert-dialog'

describe('AlertDialog HTML wrappers', () => {
  it('renders AlertDialogHeader with data-slot', () => {
    render(<AlertDialogHeader>Header</AlertDialogHeader>)
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="alert-dialog-header"]')).toBeInTheDocument()
  })

  it('renders AlertDialogFooter with data-slot', () => {
    render(<AlertDialogFooter>Footer</AlertDialogFooter>)
    expect(screen.getByText('Footer')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="alert-dialog-footer"]')).toBeInTheDocument()
  })

  it('renders AlertDialogMedia with data-slot', () => {
    render(<AlertDialogMedia data-testid="media">Icon</AlertDialogMedia>)
    expect(document.querySelector('[data-slot="alert-dialog-media"]')).toBeInTheDocument()
  })
})
