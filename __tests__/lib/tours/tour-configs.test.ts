/**
 * tour-configs tests.
 *
 * The exported WELCOME/CONTRIBUTION/ADMIN configs are static data; the only
 * branching logic lives in createTourConfig (default vs. explicit side/align).
 */

import { describe, it, expect } from 'vitest'
import {
  WELCOME_TOUR_CONFIG,
  CONTRIBUTION_FLOW_TOUR_CONFIG,
  ADMIN_DASHBOARD_TOUR_CONFIG,
  createTourConfig,
} from '@/lib/tours/tour-configs'

describe('static tour configs', () => {
  it('each preset enables progress and has steps targeting data-tour anchors', () => {
    for (const cfg of [
      WELCOME_TOUR_CONFIG,
      CONTRIBUTION_FLOW_TOUR_CONFIG,
      ADMIN_DASHBOARD_TOUR_CONFIG,
    ]) {
      expect(cfg.showProgress).toBe(true)
      expect(cfg.allowClose).toBe(true)
      expect(Array.isArray(cfg.steps)).toBe(true)
      expect(cfg.steps!.length).toBeGreaterThan(0)
      for (const step of cfg.steps!) {
        expect(step.element).toMatch(/^\[data-tour=/)
        expect(step.popover?.title).toBeTruthy()
        expect(step.popover?.description).toBeTruthy()
      }
    }
  })
})

describe('createTourConfig', () => {
  it('maps flat steps into driver.js popover steps with shared defaults', () => {
    const cfg = createTourConfig([
      { element: '#a', title: 'A', description: 'desc A' },
      { element: '#b', title: 'B', description: 'desc B' },
    ])

    expect(cfg.showProgress).toBe(true)
    expect(cfg.allowClose).toBe(true)
    expect(cfg.overlayOpacity).toBe(0.5)
    expect(cfg.stagePadding).toBe(10)
    expect(cfg.steps).toHaveLength(2)

    const [first] = cfg.steps!
    expect(first.element).toBe('#a')
    expect(first.popover).toMatchObject({
      title: 'A',
      description: 'desc A',
      side: 'bottom', // default
      align: 'center', // default
    })
  })

  it('honours explicit side/align overrides', () => {
    const cfg = createTourConfig([
      { element: '#x', title: 'X', description: 'd', side: 'left', align: 'start' },
    ])
    expect(cfg.steps![0].popover).toMatchObject({ side: 'left', align: 'start' })
  })

  it('produces an empty steps array for no input', () => {
    const cfg = createTourConfig([])
    expect(cfg.steps).toEqual([])
  })
})
