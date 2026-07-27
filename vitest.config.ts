import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Run tests in Node.js environment (no browser, no CSS)
    environment: 'node',
    // Look for test files in the tests/ directory
    include: ['tests/**/*.test.ts'],
    // Coverage reporting
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/db.ts', 'node_modules', '.next'],
    },
    globals: true,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      // Match Next.js @/ path alias
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Disable CSS processing entirely — unit tests are pure logic, no styles needed
  css: {
    postcss: {
      plugins: [],
    },
  },
})
