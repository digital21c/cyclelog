/**
 * The storage provider: the minimal string key-value API a repository needs.
 *
 * The browser's `localStorage` already matches this shape, so it can be passed
 * in directly with no adapter. TypeScript checks interfaces structurally
 * ("duck typing"): anything with these methods qualifies, without having to
 * declare `implements KeyValueStore`.
 */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** A non-persistent KeyValueStore, used in tests in place of localStorage. */
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly items = new Map<string, string>()

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }
}
