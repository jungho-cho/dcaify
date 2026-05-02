import { configDefaults, defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      '.worktrees/**',
      '.wrangler/**',
      '.open-next/**',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
