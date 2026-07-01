import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflinePage from '@/app/offline/page'

describe('OfflinePage', () => {
  it('renders offline heading', () => {
    render(<OfflinePage />)
    expect(screen.getByText("You're Offline")).toBeInTheDocument()
  })

  it('shows church branding', () => {
    render(<OfflinePage />)
    expect(screen.getByText('SDA Church Kawangware')).toBeInTheDocument()
  })

  it('shows try again link', () => {
    render(<OfflinePage />)
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })
})
