# CycleLog

A personal, offline-first cycling training log built with Vue 3, TypeScript, Pinia and
Tailwind CSS.

## Setup

Requires Node `^22.18.0 || >=24.12.0` (installed via nvm).

```sh
npm install
npm run dev
```

## Scripts

| Script                  | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Dev server with hot reload                                |
| `npm run dev:demo`      | Dev server with in-memory demo rides (storage untouched)  |
| `npm run build`         | Type-check and production build                           |
| `npm run preview`       | Serve the production build, with offline support (PWA)    |
| `npm run type-check`    | Type-check only                                           |
| `npm test`              | Run unit tests once                                       |
| `npm run test:unit`     | Unit tests in watch mode                                  |
| `npm run test:coverage` | Unit tests with a coverage report (`coverage/index.html`) |
| `npm run lint`          | Lint and auto-fix (oxlint, then ESLint)                   |
| `npm run format`        | Format `src/` with Prettier                               |

Recommended editor: VS Code with the official Vue extension (`Vue.volar`).

Architecture and coding conventions are documented in [CLAUDE.md](CLAUDE.md).
