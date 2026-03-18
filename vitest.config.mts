import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // Explicitly map `@/` to the project root so vitest resolves it in
      // __tests__/ files even though that directory is in tsconfig "exclude".
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['components/**', 'lib/**', 'app/**'],
      exclude: ['**/*.d.ts', '**/__tests__/**', '**/node_modules/**'],
    },
  },
})

