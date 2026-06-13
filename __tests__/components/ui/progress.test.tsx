/**
 * Progress tests.
 *
 * Verifies the Radix progress wrapper renders and that the indicator's
 * translateX reflects the value prop (the only logic in the component).
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress', () => {
  it('renders the root and indicator slots', () => {
    const { container } = render(<Progress value={40} />)
    expect(container.querySelector('[data-slot="progress"]')).toBeInTheDocument()
    expect(
      container.querySelector('[data-slot="progress-indicator"]')
    ).toBeInTheDocument()
  })

  it('translates the indicator to reflect the value', () => {
    const { container } = render(<Progress value={25} />)
    const indicator = container.querySelector(
      '[data-slot="progress-indicator"]'
    ) as HTMLElement
    expect(indicator.style.transform).toBe('translateX(-75%)')
  })

  it('treats a missing value as 0% complete', () => {
    const { container } = render(<Progress />)
    const indicator = container.querySelector(
      '[data-slot="progress-indicator"]'
    ) as HTMLElement
    expect(indicator.style.transform).toBe('translateX(-100%)')
  })

  it('merges custom className onto the root', () => {
    const { container } = render(<Progress value={10} className="extra" />)
    expect(container.querySelector('.extra')).toBeInTheDocument()
  })
})
