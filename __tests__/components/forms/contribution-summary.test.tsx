/**
 * ContributionSummary Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContributionSummary } from '@/components/forms/contribution-summary'
import { makeCategory } from '../../fixtures'

const cat1 = makeCategory({ id: '1', name: 'Tithe', code: 'TITHE' })
const cat2 = makeCategory({ id: '2', name: 'Offering', code: 'OFFER' })

const singleContrib = [{ category: cat1, amount: '1000' }]
const multiContrib = [
  { category: cat1, amount: '1000' },
  { category: cat2, amount: '500' },
]

function renderSummary(overrides: Partial<React.ComponentProps<typeof ContributionSummary>> = {}) {
  const defaults = {
    phoneNumber: '254712345678',
    contributions: singleContrib,
    totalAmount: '1000',
    onEdit: vi.fn(),
    onConfirm: vi.fn(),
  }
  return render(<ContributionSummary {...defaults} {...overrides} />)
}

describe('ContributionSummary', () => {
  it('renders Contribution Summary heading', () => {
    renderSummary()
    expect(screen.getByText(/contribution summary/i)).toBeDefined()
  })

  it('renders the formatted phone number', () => {
    renderSummary({ phoneNumber: '254712345678' })
    expect(screen.getByText(/0712/)).toBeDefined()
  })

  it('renders department name', () => {
    renderSummary()
    expect(screen.getByText('Tithe')).toBeDefined()
  })

  it('renders department code', () => {
    renderSummary()
    expect(screen.getByText('TITHE')).toBeDefined()
  })

  it('renders the amount for a single contribution', () => {
    renderSummary()
    expect(screen.getAllByText(/1,000/).length).toBeGreaterThan(0)
  })

  it('renders all departments for multi-contribution', () => {
    renderSummary({ contributions: multiContrib, totalAmount: '1500' })
    expect(screen.getByText('Tithe')).toBeDefined()
    expect(screen.getByText('Offering')).toBeDefined()
  })

  it('renders total amount label and value', () => {
    renderSummary({ contributions: multiContrib, totalAmount: '1500' })
    expect(screen.getByText(/total amount/i)).toBeDefined()
    expect(screen.getByText(/1,500/)).toBeDefined()
  })

  it('calls onEdit when Edit button is clicked', () => {
    const onEdit = vi.fn()
    renderSummary({ onEdit })
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn()
    renderSummary({ onConfirm })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('disables both buttons when isLoading=true', () => {
    renderSummary({ isLoading: true })
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect((btn as HTMLButtonElement).disabled).toBe(true))
  })

  it('shows Processing text when isLoading=true', () => {
    renderSummary({ isLoading: true })
    expect(screen.getByText(/processing/i)).toBeDefined()
  })
})
