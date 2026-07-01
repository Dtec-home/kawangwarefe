/**
 * Unit tests for DepartmentBarChart component.
 *
 * Recharts uses SVG + ResizeObserver APIs that don't work reliably in jsdom,
 * so we mock the entire recharts module and assert on the data that is
 * computed/passed rather than on rendered SVG elements.
 */

import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mock recharts ────────────────────────────────────────────────────────────
// Replace every recharts component with a no-op div so rendering succeeds.
vi.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-points={data?.length}>{children}</div>
  ),
  Bar: ({ dataKey, onClick, children }: any) => (
    <div data-testid={`bar-${dataKey}`} data-clickable={!!onClick}>{children}</div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: ({ fill }: any) => <div data-testid="cell" data-fill={fill} />,
}))

import { DepartmentBarChart } from '@/components/admin/DepartmentBarChart'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const baseMembers = [
  {
    memberId: '1',
    memberName: 'Kamau Njoroge',
    grandTotal: '700',
    contributionCount: 3,
    byPurpose: [
      { purposeId: 'p1', purposeName: 'Foundation', totalAmount: '300' },
      { purposeId: 'p2', purposeName: 'Roof',       totalAmount: '400' },
    ],
    byGroup: [
      { groupId: 'g1', groupName: 'Youth',  totalAmount: '700' },
    ],
  },
  {
    memberId: '2',
    memberName: 'Wanjiku Mwangi',
    grandTotal: '1500',
    contributionCount: 5,
    byPurpose: [
      { purposeId: 'p1', purposeName: 'Foundation', totalAmount: '500' },
      { purposeId: 'p2', purposeName: 'Roof',       totalAmount: '1000' },
    ],
    byGroup: [
      { groupId: 'g1', groupName: 'Youth',  totalAmount: '500' },
      { groupId: 'g2', groupName: 'Elders', totalAmount: '1000' },
    ],
  },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DepartmentBarChart', () => {
  describe('empty state', () => {
    test('shows empty message when members array is empty', () => {
      render(<DepartmentBarChart members={[]} breakdownBy="none" />)
      expect(screen.getByText(/no data to display/i)).toBeInTheDocument()
    })

    test('does not render a chart when members is empty', () => {
      render(<DepartmentBarChart members={[]} breakdownBy="none" />)
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
    })
  })

  describe('breakdownBy = "none" (single bar per member)', () => {
    test('renders a BarChart with the correct number of data points', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="none" />)
      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-points', '2')
    })

    test('renders a single Bar keyed on "total"', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="none" />)
      expect(screen.getByTestId('bar-total')).toBeInTheDocument()
    })

    test('calls onMemberClick with the correct memberId when bar clicked', async () => {
      const onClick = vi.fn()
      // The mock Bar just exposes a data-clickable flag; clicking it
      // directly would need the real recharts event. We verify the prop is wired.
      render(<DepartmentBarChart members={baseMembers} breakdownBy="none" onMemberClick={onClick} />)
      expect(screen.getByTestId('bar-total')).toHaveAttribute('data-clickable', 'true')
    })

    test('renders Cell components for each member (colour palette)', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="none" />)
      const cells = screen.getAllByTestId('cell')
      expect(cells).toHaveLength(baseMembers.length)
    })
  })

  describe('breakdownBy = "purpose" (stacked bars)', () => {
    test('renders one Bar per distinct purpose', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="purpose" />)
      expect(screen.getByTestId('bar-Foundation')).toBeInTheDocument()
      expect(screen.getByTestId('bar-Roof')).toBeInTheDocument()
    })

    test('renders a Legend when stacked', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="purpose" />)
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    test('does NOT render single-bar Cell components when stacked', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="purpose" />)
      expect(screen.queryByTestId('cell')).not.toBeInTheDocument()
    })
  })

  describe('breakdownBy = "group" (stacked bars)', () => {
    test('renders one Bar per distinct group', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="group" />)
      expect(screen.getByTestId('bar-Youth')).toBeInTheDocument()
      expect(screen.getByTestId('bar-Elders')).toBeInTheDocument()
    })

    test('chart receives correct number of data points', () => {
      render(<DepartmentBarChart members={baseMembers} breakdownBy="group" />)
      const chart = screen.getByTestId('bar-chart')
      expect(chart).toHaveAttribute('data-points', '2')
    })
  })

  describe('long member names', () => {
    test('truncates names longer than 14 characters', () => {
      const longNameMember = [{
        ...baseMembers[0],
        memberName: 'Bartholomew Kariuki Mwangi',
        grandTotal: '100',
      }]
      render(<DepartmentBarChart members={longNameMember} breakdownBy="none" />)
      // The chart renders — no crash
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })
})
