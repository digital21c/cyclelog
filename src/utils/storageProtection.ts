/**
 * Whether the browser has promised not to clear this site's storage (and so
 * the rides in localStorage) when the device runs low on space.
 *
 * Uses the Storage API: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
 * Browsers decide differently: Chrome grants it automatically to installed or
 * frequently used sites, Firefox asks the user, Safari uses its own heuristics.
 */
export type StorageProtection = 'persistent' | 'not-persistent' | 'unsupported'

/** The part of `navigator.storage` used here; injectable for tests. */
export type PersistenceApi = Pick<StorageManager, 'persisted' | 'persist'>

function defaultApi(): PersistenceApi | undefined {
  return globalThis.navigator?.storage
}

/** Reports the current protection, without asking for anything. */
export async function getStorageProtection(
  api: PersistenceApi | undefined = defaultApi(),
): Promise<StorageProtection> {
  if (typeof api?.persisted !== 'function') return 'unsupported'
  try {
    return (await api.persisted()) ? 'persistent' : 'not-persistent'
  } catch {
    return 'unsupported'
  }
}

/**
 * Asks the browser to protect storage. May show a permission prompt (Firefox),
 * so call it from a user action such as a button press, not at startup.
 */
export async function requestStorageProtection(
  api: PersistenceApi | undefined = defaultApi(),
): Promise<StorageProtection> {
  if (typeof api?.persist !== 'function') return 'unsupported'
  try {
    return (await api.persist()) ? 'persistent' : 'not-persistent'
  } catch {
    return 'not-persistent'
  }
}
