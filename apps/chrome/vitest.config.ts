import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', 'e2e/**', '*.test.ts'],
  },
})