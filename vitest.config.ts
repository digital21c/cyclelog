import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      // Node 25+ has its own built-in localStorage, which hides jsdom's and is
      // unusable without a --localstorage-file. Turn it off so tests get jsdom's.
      execArgv: ['--no-experimental-webstorage'],
      // Used by `npm run test:coverage`. No minimum thresholds on purpose:
      // coverage is a periodic check for untested behaviour, not a target.
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.spec.ts'],
        reporter: ['text', 'html'], // terminal summary + browsable coverage/index.html
      },
    },
  }),
)
