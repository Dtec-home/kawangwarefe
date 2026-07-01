/**
 * Separator tests.
 *
 * The only branch is orientation -> sizing classes; cover both plus the
 * default (horizontal, decorative) rendering.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

describe('Separator', () => {
  it('renders a horizontal separator by default', () => {
    const { container } = render(<Separator data-testid="sep" />)
    const el = container.querySelector('[data-testid="sep"]') as HTMLElement
    expect(el).toBeInTheDocument()
    expect(el.className).toContain('h-[1px]')
    expect(el.className).toContain('w-full')
  })

  it('renders vertical sizing when orientation is vertical', () => {
    const { container } = render(
      <Separator orientation="vertical" data-testid="sep" />
    )
    const el = container.querySelector('[data-testid="sep"]') as HTMLElement
    expect(el.className).toContain('h-full')
    expect(el.className).toContain('w-[1px]')
  })

  it('merges a custom className', () => {
    const { container } = render(<Separator className="my-sep" />)
    expect(container.querySelector('.my-sep')).toBeInTheDocument()
  })
})
