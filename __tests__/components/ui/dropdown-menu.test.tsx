import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DropdownMenuShortcut } from '@/components/ui/dropdown-menu'

describe('DropdownMenu', () => {
  it('renders DropdownMenuShortcut with data-slot', () => {
    const { container } = render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>)
    expect(container.querySelector('[data-slot="dropdown-menu-shortcut"]')).toBeInTheDocument()
    expect(container.textContent).toBe('⌘K')
  })
})
