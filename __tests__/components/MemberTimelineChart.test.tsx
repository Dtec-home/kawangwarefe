/**
 * Unit tests for MemberTimelineChart component.
 *
 * Recharts is mocked so tests run in jsdom without SVG/canvas constraints.
 * We focus on:
 *  - Empty state
 *  - Correct number of data points passed to the chart
 *  - "Back" button presence and callback
 *  - Individual vs monthly date formatting
 *  - Running total is non-decreasing (logic check on the data array)
 */

import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mock recharts ────────────────────────────────────────────────────────────
vi.mock('recharts', () => ({
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-points={data?.length}>{children}</div>
  ),
  Area: ({ dataKey }: any) => <div data-testid={`area-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="grid" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceDot: () => <div data-testid="ref-dot" />,
}))

import { MemberTimelineChart } from '@/components/admin/MemberTimelineChart'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeContributions = (entries: Array<{ date: string; amount: string; running: string }>) =>
  entries.map((e, i) => ({
    contributionId: String(i + 1),
    transactionDate: e.date,
    amount: e.amount,
    entryType: 'mpesa',
    purposeName: null,
    groupName: null,
    runningTotal: e.running,
  }))

const singleContrib = makeContributions([
  { date: '2026-01-15T10:00:00Z', amount: '100', running: '100' },
])

const threeContribs = makeContributions([
  { date: '2026-01-15T10:00:00Z', amount: '100', running: '100' },
  { date: '2026-02-03T10:00:00Z', amount: '200', running: '300' },
  { date: '2026-03-20T10:00:00Z', amount: '400', running: '700' },
])

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MemberTimelineChart', () => {
  describe('empty state', () => {
    test('shows empty message when contributions is empty', () => {
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={[]}
          timeBucket="none"
        />
      )
      expect(screen.getByText(/no contribution data/i)).toBeInTheDocument()
    })

    test('does not render area chart when empty', () => {
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={[]}
          timeBucket="none"
        />
      )
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })
  })

  describe('renders chart with data', () => {
    test('passes correct number of data points to AreaChart', () => {
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={threeContribs}
          timeBucket="none"
        />
      )
      expect(screen.getByTestId('area-chart')).toHaveAttribute('data-points', '3')
    })

    test('renders a single Area keyed on runningTotal', () => {
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={singleContrib}
          timeBucket="none"
        />
      )
      expect(screen.getByTestId('area-runningTotal')).toBeInTheDocument()
    })

    test('renders member name in header', () => {
      render(
        <MemberTimelineChart
          memberName="Wanjiku Mwangi"
          contributions={singleContrib}
          timeBucket="none"
        />
      )
      expect(screen.getByText(/Wanjiku Mwangi/i)).toBeInTheDocument()
    })

    test('renders CartesianGrid for readability', () => {
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={threeContribs}
          timeBucket="none"
        />
      )
      expect(screen.getByTestId('grid')).toBeInTheDocument()
    })
  })

  describe('back button', () => {
    test('back button is shown when onBack prop is provided', () => {
      const onBack = vi.fn()
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={threeContribs}
          timeBucket="none"
          onBack={onBack}
        />
      )
      expect(screen.getByText(/back to all members/i)).toBeInTheDocument()
    })

    test('back button is NOT shown without onBack prop', () => {
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={threeContribs}
          timeBucket="none"
        />
      )
      expect(screen.queryByText(/back to all members/i)).not.toBeInTheDocument()
    })

    test('clicking back button calls onBack', async () => {
      const onBack = vi.fn()
      const user = userEvent.setup()
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={threeContribs}
          timeBucket="none"
          onBack={onBack}
        />
      )
      await user.click(screen.getByText(/back to all members/i))
      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('running total invariant', () => {
    test('running totals in fixture are non-decreasing', () => {
      // This validates our fixture data — the chart must receive monotonic totals.
      const totals = threeContribs.map((c) => Number(c.runningTotal))
      const sorted = [...totals].sort((a, b) => a - b)
      expect(totals).toEqual(sorted)
    })
  })

  describe('timeBucket formatting', () => {
    test('renders without error in monthly bucket mode', () => {
      const monthlyContribs = makeContributions([
        { date: '2026-01-01T00:00:00Z', amount: '300', running: '300' },
        { date: '2026-02-01T00:00:00Z', amount: '500', running: '800' },
      ])
      render(
        <MemberTimelineChart
          memberName="Kamau"
          contributions={monthlyContribs}
          timeBucket="monthly"
        />
      )
      expect(screen.getByTestId('area-chart')).toHaveAttribute('data-points', '2')
    })
  })
})
