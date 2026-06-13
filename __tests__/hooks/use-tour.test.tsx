import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// driver.js is mocked: capture the config it is constructed with and expose a
// fake instance whose drive/destroy we can assert on.
const driveSpy = vi.fn()
const destroySpy = vi.fn()
let lastConfig: any = null
vi.mock('driver.js', () => ({
  driver: (config: any) => {
    lastConfig = config
    return { drive: driveSpy, destroy: destroySpy }
  },
}))
vi.mock('driver.js/dist/driver.css', () => ({}))

// Apollo hooks mocked so the tutorial-state query + completion mutation are
// deterministic without a provider.
const markComplete = vi.fn().mockResolvedValue({ data: {} })
let queryResult: any = { data: { isTutorialCompleted: false }, loading: false }
vi.mock('@apollo/client/react', () => ({
  useQuery: () => queryResult,
  useMutation: () => [markComplete],
}))

import { useTour } from '@/hooks/use-tour'

const steps = [
  { popover: { title: 'Step 1', description: 'First' } },
  { popover: { title: 'Step 2', description: 'Second' } },
]

describe('useTour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    driveSpy.mockClear()
    destroySpy.mockClear()
    markComplete.mockClear()
    lastConfig = null
    queryResult = { data: { isTutorialCompleted: false }, loading: false }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps the tour steps into driver.js config', () => {
    renderHook(() => useTour({ tourKey: 'dashboard', steps, autoStart: false }))
    expect(lastConfig).not.toBeNull()
    expect(lastConfig.steps).toHaveLength(2)
    expect(lastConfig.steps[0].popover.title).toBe('Step 1')
    // Defaults applied by the hook.
    expect(lastConfig.steps[0].popover.side).toBe('left')
  })

  it('auto-starts the tour when not previously completed', () => {
    renderHook(() => useTour({ tourKey: 'dashboard', steps, autoStart: true }))
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(driveSpy).toHaveBeenCalled()
  })

  it('does NOT auto-start when the tutorial is already completed', () => {
    queryResult = { data: { isTutorialCompleted: true }, loading: false }
    renderHook(() => useTour({ tourKey: 'dashboard', steps, autoStart: true }))
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(driveSpy).not.toHaveBeenCalled()
  })

  it('marks the tutorial complete when the user closes the tour', () => {
    renderHook(() => useTour({ tourKey: 'dashboard', steps, autoStart: false }))
    act(() => {
      lastConfig.onDestroyStarted()
    })
    expect(markComplete).toHaveBeenCalledWith({
      variables: { tutorialKey: 'dashboard', completed: true },
    })
  })

  it('omits a reset function unless allowReset is set', () => {
    const { result } = renderHook(() =>
      useTour({ tourKey: 'dashboard', steps, autoStart: false })
    )
    expect(result.current.reset).toBeUndefined()
  })
})
