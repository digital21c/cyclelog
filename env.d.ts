/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

/** Types for our own VITE_* environment variables (see .env.* files). */
interface ImportMetaEnv {
  /** "true" when running `npm run dev:demo`: use in-memory demo rides. */
  readonly VITE_DEMO_DATA?: string
}
