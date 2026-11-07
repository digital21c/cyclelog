import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import type { PersistenceApi } from '@/utils/storageProtection'

import StorageProtectionStatus from './StorageProtectionStatus.vue'

function fakeApi(persisted: boolean, grant: boolean): PersistenceApi {
  return {
    persisted: vi.fn<() => Promise<boolean>>().mockResolvedValue(persisted),
    persist: vi.fn<() => Promise<boolean>>().mockResolvedValue(grant),
  }
}

async function mountStatus(api?: PersistenceApi) {
  const wrapper = mount(StorageProtectionStatus, { props: { api } })
  await flushPromises()
  return wrapper
}

describe('StorageProtectionStatus', () => {
  it('says storage is protected when it is', async () => {
    const wrapper = await mountStatus(fakeApi(true, true))
    expect(wrapper.text()).toContain('Storage is protected.')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('offers to ask for protection, without asking on its own', async () => {
    const api = fakeApi(false, true)
    const wrapper = await mountStatus(api)

    expect(wrapper.text()).toContain("Storage isn't protected.")
    expect(wrapper.get('button').text()).toBe('Ask the browser to protect it')
    expect(api.persist).not.toHaveBeenCalled()
  })

  it('shows protected once the browser agrees', async () => {
    const wrapper = await mountStatus(fakeApi(false, true))
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Storage is protected.')
  })

  it('suggests installing the app if the browser declines', async () => {
    const wrapper = await mountStatus(fakeApi(false, false))
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('The browser declined.')
    expect(wrapper.text()).toContain('Add to Home Screen')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('recommends backups when the browser gives no answer', async () => {
    const wrapper = await mountStatus() // jsdom has no navigator.storage
    expect(wrapper.text()).toContain("doesn't say whether it will keep your rides")
  })
})
