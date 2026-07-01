import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StructuredData } from '@/components/seo/structured-data'

describe('StructuredData', () => {
  it('renders 4 script tags with type application/ld+json', () => {
    const { container } = render(<StructuredData />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(4)
  })

  it('Church schema contains correct name', () => {
    const { container } = render(<StructuredData />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent || ''))
    const church = schemas.find((s) => s['@type'] === 'Church')
    expect(church).toBeDefined()
    expect(church.name).toBe('Seventh-Day Adventist Church Kawangware')
  })

  it('WebSite schema has correct type', () => {
    const { container } = render(<StructuredData />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent || ''))
    const website = schemas.find((s) => s['@type'] === 'WebSite')
    expect(website).toBeDefined()
    expect(website['@type']).toBe('WebSite')
  })

  it('Organization schema has logo', () => {
    const { container } = render(<StructuredData />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent || ''))
    const org = schemas.find((s) => s['@type'] === 'Organization')
    expect(org).toBeDefined()
    expect(org.logo).toBeDefined()
  })

  it('BreadcrumbList has Home item', () => {
    const { container } = render(<StructuredData />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const schemas = Array.from(scripts).map((s) => JSON.parse(s.textContent || ''))
    const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    const homeItem = breadcrumb.itemListElement.find(
      (item: { name: string }) => item.name === 'Home'
    )
    expect(homeItem).toBeDefined()
  })
})
