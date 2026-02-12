import { expect, test, describe } from 'vitest'

// Example utility function to test
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount)
}

describe('Example Unit Tests', () => {
  test('formatCurrency formats numbers correctly', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
    expect(result).toContain('00')
  })

  test('basic arithmetic works', () => {
    expect(1 + 1).toBe(2)
    expect(5 * 3).toBe(15)
  })

  test('string operations work', () => {
    const greeting = 'Hello, World!'
    expect(greeting).toContain('World')
    expect(greeting.toLowerCase()).toBe('hello, world!')
  })
})
