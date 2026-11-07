import { describe, it, expect, vi } from 'vitest'

import {
  getStorageProtection,
  requestStorageProtection,
  type PersistenceApi,
} from './storageProtection'

function fakeApi({
  persisted = false,
  grant = false,
}: { persisted?: boolean; grant?: boolean } = {}): PersistenceApi {
  return {
    persisted: vi.fn<() => Promise<boolean>>().mockResolvedValue(persisted),
    persist: vi.fn<() => Promise<boolean>>().mockResolvedValue(grant),
  }
}

describe('getStorageProtection', () => {
  it('reports persistent storage', async () => {
    expect(await getStorageProtection(fakeApi({ persisted: true }))).toBe('persistent')
  })

  it('reports storage that may be cleared', async () => {
    expect(await getStorageProtection(fakeApi({ persisted: false }))).toBe('not-persistent')
  })

  it('never asks the browser for anything', async () => {
    const api = fakeApi()
    await getStorageProtection(api)
    expect(api.persist).not.toHaveBeenCalled()
  })

  it('reports unsupported when the API is missing or fails', async () => {
    expect(await getStorageProtection({} as PersistenceApi)).toBe('unsupported')
    const failing = fakeApi()
    vi.mocked(failing.persisted).mockRejectedValue(new Error('SecurityError'))
    expect(await getStorageProtection(failing)).toBe('unsupported')
  })

  it("uses the browser's navigator.storage by default (absent in jsdom)", async () => {
    expect(await getStorageProtection()).toBe('unsupported')
  })
})

describe('requestStorageProtection', () => {
  it('reports the browser granting protection', async () => {
    expect(await requestStorageProtection(fakeApi({ grant: true }))).toBe('persistent')
  })

  it('reports the browser declining', async () => {
    expect(await requestStorageProtection(fakeApi({ grant: false }))).toBe('not-persistent')
  })

  it('treats a failed request as declined', async () => {
    const failing = fakeApi()
    vi.mocked(failing.persist).mockRejectedValue(new Error('NotAllowedError'))
    expect(await requestStorageProtection(failing)).toBe('not-persistent')
  })

  it('reports unsupported when the API is missing', async () => {
    expect(await requestStorageProtection({} as PersistenceApi)).toBe('unsupported')
  })
})
