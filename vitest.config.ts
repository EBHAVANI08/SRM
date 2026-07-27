import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Run tests in Node.js environment (no browser needed for unit tests)
    environment: 'node',
    // Look for test files in the tests/ directory
    include: ['tests/**/*.test.ts'],
    // Coverage reporting
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
      exclude: ['src/lib/db.ts', 'node_modules', '.next'],
    },
    // Global test setup
    globals: true,
    // Timeout per test (10s)
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      // Match Next.js @/ path alias
      '@': path.resolve(__dirname, './src'),
    },
  },
})
