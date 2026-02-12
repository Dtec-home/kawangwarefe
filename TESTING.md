# Testing Guide

This document provides comprehensive guidance on testing the Church Funds UI application using Vitest for unit tests and Playwright for end-to-end (e2e) tests.

## Table of Contents

- [Overview](#overview)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

The application uses two complementary testing frameworks:

- **Vitest**: Fast unit testing framework powered by Vite, used for testing individual components, functions, and utilities
- **Playwright**: End-to-end testing framework that tests the application in real browsers (Chromium, Firefox, WebKit)

## Unit Testing with Vitest

### Running Unit Tests

```bash
# Run tests in watch mode (default)
npm run test

# Run tests once (for CI)
npm run test -- --run

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- __tests__/example.test.ts
```

### Configuration

Vitest is configured in [`vitest.config.mts`](file:///home/md/Tweny5/Kawangware/church-funds-system/church-funds-ui/vitest.config.mts) with:

- **React Plugin**: Supports JSX/TSX transformation
- **TypeScript Paths**: Resolves path aliases from `tsconfig.json`
- **jsdom Environment**: Provides DOM APIs for testing React components

### Writing Unit Tests

Unit tests should be placed in the `__tests__` directory with the `.test.ts` or `.test.tsx` extension.

**Example: Testing a utility function**

```typescript
import { expect, test, describe } from 'vitest'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount)
}

describe('formatCurrency', () => {
  test('formats numbers correctly', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
  })
})
```

**Example: Testing a React component**

```typescript
import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeDefined()
  })
})
```

### What to Unit Test

- ✅ Utility functions and helpers
- ✅ Custom hooks
- ✅ Component rendering logic
- ✅ Form validation
- ✅ Data transformations
- ✅ Business logic

## E2E Testing with Playwright

### Running E2E Tests

```bash
# Run all e2e tests (headless mode)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests with visible browser
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/example.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### Configuration

Playwright is configured in [`playwright.config.ts`](file:///home/md/Tweny5/Kawangware/church-funds-system/church-funds-ui/playwright.config.ts) with:

- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Web Server**: Automatically starts Next.js dev server before tests
- **Browsers**: Chromium, Firefox, and WebKit
- **Parallel Execution**: Tests run in parallel for faster execution

### Writing E2E Tests

E2E tests should be placed in the `e2e` directory with the `.spec.ts` extension.

**Example: Testing navigation**

```typescript
import { test, expect } from '@playwright/test'

test('user can navigate to contribute page', async ({ page }) => {
  await page.goto('/')

  // Click on contribute link
  await page.getByRole('link', { name: /contribute/i }).click()

  // Verify we're on the contribute page
  await expect(page).toHaveURL('/contribute')
  await expect(page.getByRole('heading', { name: /contribute/i })).toBeVisible()
})
```

**Example: Testing form submission**

```typescript
import { test, expect } from '@playwright/test'

test('user can submit contribution form', async ({ page }) => {
  await page.goto('/contribute')

  // Fill out the form
  await page.getByLabel('Amount').fill('1000')
  await page.getByLabel('Phone Number').fill('0712345678')

  // Submit
  await page.getByRole('button', { name: /submit/i }).click()

  // Verify success message
  await expect(page.getByText(/success/i)).toBeVisible()
})
```

### What to E2E Test

- ✅ Critical user flows (login, contribution, etc.)
- ✅ Navigation between pages
- ✅ Form submissions
- ✅ API integrations
- ✅ Payment flows
- ✅ Error handling and edge cases

### Viewing Test Reports

After running e2e tests, you can view the HTML report:

```bash
npx playwright show-report
```

## Best Practices

### General

1. **Write descriptive test names**: Use clear, action-oriented descriptions
   ```typescript
   // ✅ Good
   test('user can submit contribution with valid phone number', ...)

   // ❌ Bad
   test('contribution test', ...)
   ```

2. **Follow the AAA pattern**: Arrange, Act, Assert
   ```typescript
   test('example', () => {
     // Arrange: Set up test data
     const input = 'test'

     // Act: Perform the action
     const result = processInput(input)

     // Assert: Verify the result
     expect(result).toBe('expected')
   })
   ```

3. **Keep tests independent**: Each test should be able to run in isolation

4. **Use data-testid sparingly**: Prefer semantic queries (role, label, text)

### Vitest Specific

1. **Use `describe` blocks** to group related tests
2. **Mock external dependencies** (API calls, third-party libraries)
3. **Test edge cases** and error conditions
4. **Keep tests fast** - unit tests should run in milliseconds

### Playwright Specific

1. **Use `page.goto('/')` instead of full URLs** - baseURL is configured
2. **Wait for elements** before interacting with them
3. **Use built-in assertions** like `toBeVisible()`, `toHaveText()`
4. **Test across browsers** - run tests on all configured browsers
5. **Use UI mode for debugging** - `npm run test:e2e:ui`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test -- --run

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Vitest Issues

**Tests not found**
- Ensure test files have `.test.ts` or `.test.tsx` extension
- Check that files are in the `__tests__` directory or colocated with source files

**Module resolution errors**
- Verify `vite-tsconfig-paths` is installed
- Check path aliases in `tsconfig.json`

### Playwright Issues

**Browser not found**
- Run `npx playwright install` to download browsers

**Timeout errors**
- Increase timeout in `playwright.config.ts`
- Ensure dev server is running before tests

**Tests fail on CI but pass locally**
- Check for race conditions
- Ensure proper waits for elements
- Verify environment variables are set

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
