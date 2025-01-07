import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', 'e2e/**', '*.test.ts'],
  },
})
