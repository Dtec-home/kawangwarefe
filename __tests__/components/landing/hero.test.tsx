import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Hero } from '@/components/landing/hero'

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: false, logout: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => React.createElement('a', { href, ...props }, children),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => React.createElement('img', { src, alt }),
}))

describe('Hero', () => {
  it('renders heading text', () => {
    render(<Hero />)
    expect(screen.getByText('Seventh-Day')).toBeDefined()
    expect(screen.getByText('Adventist Church')).toBeDefined()
  })

  it('renders "Kawangware"', () => {
    render(<Hero />)
    expect(screen.getByText('Kawangware')).toBeDefined()
  })

  it('renders Sabbath service info', () => {
    render(<Hero />)
    expect(screen.getByText('Sabbath Service')).toBeDefined()
    expect(screen.getByText('Saturday 9:00 AM - 12:00 PM')).toBeDefined()
  })

  it('renders Give Online and View Events buttons/links', () => {
    render(<Hero />)
    const giveOnline = screen.getByText('Give Online')
    const viewEvents = screen.getByText('View Events')
    expect(giveOnline).toBeDefined()
    expect(viewEvents).toBeDefined()
    expect(giveOnline.closest('a')).toHaveAttribute('href', '/contribute')
    expect(viewEvents.closest('a')).toHaveAttribute('href', '/events')
  })
})
