import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { DialogHeader, DialogFooter } from '@/components/ui/dialog'

// Radix primitives are hard to test in jsdom, so test the pure HTML wrappers
describe('Dialog HTML wrappers', () => {
  it('renders DialogHeader with data-slot', () => {
    render(<DialogHeader>Header content</DialogHeader>)
    expect(screen.getByText('Header content')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument()
  })

  it('renders DialogFooter with data-slot', () => {
    render(<DialogFooter>Footer content</DialogFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument()
  })

  it('merges custom className on DialogHeader', () => {
    render(<DialogHeader className="my-class">H</DialogHeader>)
    expect(document.querySelector('.my-class')).toBeInTheDocument()
  })
})
