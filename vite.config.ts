import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    // Makes the production build an installable, offline-capable PWA.
    // https://vite-pwa-org.netlify.app/guide/
    VitePWA({
      // Don't swap in a new version silently: UpdatePrompt asks first, so a
      // half-filled form is never lost to an automatic reload.
      registerType: 'prompt',
      // Registration happens in UpdatePrompt via useRegisterSW().
      injectRegister: false,
      // Icons are already precached by globPatterns below; don't list them twice.
      includeManifestIcons: false,
      manifest: {
        name: 'CycleLog',
        short_name: 'CycleLog',
        description: 'A personal, offline-first cycling training log.',
        lang: 'en-GB',
        // start_url and scope are left out on purpose: the plugin sets both to
        // Vite's base, so the app works at / locally and at /cyclelog/ on GitHub Pages.
        display: 'standalone', // opens in its own window, without browser toolbars
        theme_color: '#0369a1',
        background_color: '#f8fafc', // shown while the app starts (slate-50)
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable', // safe for Android's round/squircle icon masks
          },
        ],
      },
      workbox: {
        // Precache the whole app, including lazily loaded pages, so every
        // page works offline even if it has never been opened.
        // (The plugin adds manifest.webmanifest itself.)
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Any in-app URL (e.g. /rides/abc/edit) is answered with index.html,
        // and the Vue router takes it from there.
        navigateFallback: 'index.html',
        // Remove caches left by older versions of the service worker.
        cleanupOutdatedCaches: true,
      },
      // The service worker stays off in `npm run dev`; test it with a build.
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
