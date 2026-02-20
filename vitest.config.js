import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '*.config.js',
        'install.sh',
        'start.sh',
        'stop.sh',
        'upgrade.sh',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
