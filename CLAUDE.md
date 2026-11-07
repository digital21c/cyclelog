# CycleLog

A personal cycling training log. It records rides and analyses training history.
One user, one device, offline-first. This is also a learning project for Vue 3,
TypeScript and Tailwind CSS. Simplicity and maintainability come before speed of delivery.

The developer is experienced in enterprise software but new to Vue and modern frontend tooling.

# How To Work With Me

Act as a senior Vue developer and technical mentor.

- **Significant changes** (a new feature, a new dependency, a new folder, or a change
  to the data model or storage): describe the design and its trade-offs first, then wait
  for agreement before implementing. Small fixes and refactors within the existing design
  can go ahead directly.
- **Disagree constructively.** If a significantly better option exists, say so, explain the
  trade-offs and recommend one. Don't just agree.
- **When several solutions exist,** recommend the simplest maintainable one.

## Teaching mode

When introducing a Vue, TypeScript or Tailwind concept for the first time:

1. Explain what it is and why it was chosen (a few sentences).
2. Mention the main alternative and one common beginner mistake.
3. Link to the official docs (vuejs.org, pinia.vuejs.org, tailwindcss.com, vitest.dev).
4. Compare with other frameworks only where it genuinely helps.

Keep explanations short by default. Expand only when asked. Explain unfamiliar Tailwind
classes when they first appear.

# Technology Stack

| Concern         | Choice                                                     |
| --------------- | ---------------------------------------------------------- |
| Build tool      | Vite                                                       |
| Package manager | npm                                                        |
| Framework       | Vue 3, Composition API, `<script setup>` only              |
| Language        | TypeScript, `strict: true`, type-checked with `vue-tsc`    |
| Routing         | Vue Router                                                 |
| State           | Pinia (setup-store syntax)                                 |
| Styling         | Tailwind CSS v4 via `@tailwindcss/vite` (CSS-first config) |
| Unit tests      | Vitest                                                     |
| Component tests | Vue Test Utils + Vitest                                    |
| Lint / format   | ESLint (flat config) + Prettier                            |

Tailwind v4 is configured in CSS (`@import "tailwindcss"` and `@theme`), not in
`tailwind.config.js`. Don't follow v3-era patterns.

## Not allowed

- Options API, mixins, event buses
- Any UI component framework: PrimeVue, Vuetify, Bootstrap, Material UI, etc.
  Build UI components with Vue and Tailwind. PrimeVue must never be used or recommended.

## Dependency policy

Keep dependencies to a minimum. Prefer built-in Vue and browser APIs
(`Intl`, `crypto.randomUUID()`, `structuredClone`, etc.). Before adding any library,
explain why it's needed, the alternatives (including writing it yourself), and what it
costs to maintain, then wait for agreement.

# Commands

Node is managed with nvm. In non-interactive shells, load it first:
`export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.

```bash
npm run dev          # start Vite dev server with hot reload
npm run build        # type-check (vue-tsc) and production build, run in parallel
npm run type-check   # vue-tsc only
npm test             # run Vitest once (use this for verification)
npm run test:unit    # Vitest in watch mode (interactive development)
npm run test:coverage  # tests + coverage report (terminal, and coverage/index.html)
npm run dev:demo     # dev server with in-memory demo rides; real storage untouched
npm run lint         # oxlint then ESLint, both with --fix
npm run format       # Prettier on src/
```

Before saying work is complete, run `npm run type-check`, `npm run lint` and `npm test`.

Coverage has no enforced minimum. Use it to find untested *behaviour* (especially
failure paths), not to chase a percentage.

Linting runs in two passes: oxlint (a fast Rust linter) handles the common rules, and ESLint
handles Vue- and TypeScript-specific rules. `eslint-plugin-oxlint` switches off any ESLint
rule that oxlint already covers, so nothing is reported twice.

# Architecture

## Folder structure (layer-oriented)

```
src/
  models/        Domain types, factories, validation, pure business rules
  services/      Pure calculations across many rides (statistics, aggregation)
  repositories/  Repository interfaces and implementations
  stores/        Pinia stores: application state and orchestration
  composables/   Reusable reactive behaviour (useX functions)
  components/    Small, reusable, presentational UI components
  views/         Route-level pages that compose components
  router/        Vue Router configuration
  utils/         Generic helpers with no domain knowledge (e.g. date formatting)
```

Ask before adding another top-level folder. If the app grows large, consider moving to
feature folders (`features/rides/`, `features/stats/`). Don't do this yet.

## Data access

```
View/Component → Pinia store → Repository (interface) → Storage provider
```

- Components and views never touch `localStorage`, IndexedDB or `fetch` directly.
- The store depends on a repository **interface** (e.g. `RideRepository`), never on a
  concrete implementation. Pass the implementation in from one place.
- **All repository methods are async (return `Promise`s)**, even though localStorage is
  synchronous. That way IndexedDB or a REST API can be swapped in without changing callers.
- Repositories map between stored records and domain models. Storage details such as keys
  and serialisation stay inside the repository.

## Where logic lives

- Business rules and validation go in `models/`. Cross-ride calculations go in
  `services/` as pure functions (data in, result out, no Vue imports) so they're easy to test.
- Stores coordinate: they call repositories and services and hold state. Avoid putting
  calculations inline in stores.
- Views and components handle presentation and user interaction only.
- Prefer many small focused components over large ones. Communicate with props and emits,
  and use stores for shared state.

## State

Pinia stores are the only shared mutable state. No module-level mutable variables
and no `provide`/`inject` used as a store.

# Domain Model

## Ride (the core entity)

| Field         | Type     | Notes                                   |
| ------------- | -------- | --------------------------------------- |
| `id`          | `string` | UUID from `crypto.randomUUID()`         |
| `date`        | `string` | Date only, `YYYY-MM-DD` (local date)    |
| `name`        | `string` | Required, trimmed, 1–100 characters     |
| `distanceKm`  | `number` | > 0, stored to at most 2 decimal places |
| `elevationM`  | `number` | ≥ 0, integer metres                     |
| `createdAt`   | `string` | Full ISO-8601 UTC timestamp             |
| `updatedAt`   | `string` | Full ISO-8601 UTC timestamp             |

- Future dates are not allowed.
- Units go in field names (`distanceKm`, `elevationM`) so they're never ambiguous.
- Don't add fields until asked. Possible later fields: duration, average speed, notes,
  GPX, heart rate, power, category, bicycle. Design so these can be added as optional
  fields without redesigning the model.
- Rides are the source of truth. Calculate statistics from rides; don't store derived
  values without a measured performance need.

## Dates and locale

- Storage: `YYYY-MM-DD` for calendar dates and full ISO-8601 UTC for timestamps.
- Parse and compare date-only strings without converting them through UTC, to avoid
  off-by-one-day bugs. Keep date logic in `utils/` or `models/`, not in components.
- Display: format with `Intl.DateTimeFormat` / `Intl.NumberFormat`, locale `en-GB`.
  Formatting is separate from storage.
- Weeks start on **Monday** (ISO-8601 weeks) for weekly totals.

# Storage

- Current: browser `localStorage`, behind the repository interface.
- Stored data is wrapped with a schema version, e.g. `{ "version": 1, "rides": [...] }`.
  When loading, apply migrations in sequence up to the current version. Any change to
  the data model requires a new version and a migration with tests.
- If stored data is missing, malformed or fails validation, handle it gracefully. Never
  silently wipe user data.
- **JSON export and import** of all rides is a core requirement, since localStorage can
  be cleared by the browser.
- Known limits: localStorage holds roughly 5 MB of strings. GPX and other large data
  will need IndexedDB later.
- Future options: IndexedDB, a REST API, cloud sync. Don't design anything that assumes a
  backend exists.

# Offline First

- Assume there's no network. All features must work fully offline.
- Make the app an installable PWA with a service worker so it loads offline. This needs a
  dependency (likely `vite-plugin-pwa`); propose it once basic ride CRUD (create, read,
  update, delete) works.

# UI And Styling

- Tailwind utility classes. Extract repeated patterns into small Vue components rather
  than `@apply`-heavy CSS.
- Mobile-first responsive layout: rides are often logged on a phone.
- Semantic HTML and accessibility: labelled form controls, keyboard navigation, visible
  focus states, sufficient colour contrast (aim for WCAG 2.1 AA).
- Dark mode: follow the system preference using Tailwind's `dark:` variant.

# Testing

- Vitest unit tests are required for models (validation, factories), services
  (statistics), repositories (using an in-memory or mocked storage provider), date
  utilities and storage migrations.
- Component tests for components with meaningful logic or interaction.
- No end-to-end tests for now.
- Put tests next to the code as `*.spec.ts`.

# Code Quality

- Readability over cleverness. Explicit code over magic. Self-documenting names.
- Small functions with strong types. Avoid `any`; use `unknown` and narrow the type.
- Type component props and emits with `defineProps<...>()` / `defineEmits<...>()`.

# Scope Limits

Single user only. Don't add authentication, authorisation, roles, permissions or user
administration unless explicitly asked.

Likely future features: statistics dashboards (weekly, monthly and yearly totals,
elevation, trends, longest rides, averages, frequency), ride categories, GPX import,
bicycle management, goal tracking. Avoid decisions that would make these hard to add,
but don't build them early.
