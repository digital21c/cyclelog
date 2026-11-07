import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'

import type { Ride } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import { createBackup } from '@/services/rideBackup'
import { rideRepositoryKey } from '@/stores/injectionKeys'
import { useRidesStore } from '@/stores/rides'

import { useRideImport } from './useRideImport'

/**
 * useRideImport uses the rides store, which gets its repository via inject(),
 * so it must run inside a component. This host component just exposes it.
 * Most of the flow is tested through BackupView; these tests cover what the
 * page can't reach, such as a second confirm while the first is running.
 */
const Host = defineComponent({
  setup: () => useRideImport(),
  render: () => null,
})

const ride: Ride = {
  id: 'a',
  date: '2026-10-25',
  name: 'Cotter Loop',
  distanceKm: 52,
  elevationM: 540,
  createdAt: '2026-10-25T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
}

async function setUp() {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  const pinia = createPinia()
  const wrapper = mount(Host, {
    global: { plugins: [pinia], provide: { [rideRepositoryKey]: repository } },
  })
  await useRidesStore(pinia).loadRides()
  // `wrapper.vm` exposes what setup() returned; refs are unwrapped on it.
  return { repository, flow: wrapper.vm }
}

function backupFile(): File {
  return new File([createBackup([ride]).contents], 'backup.json', { type: 'application/json' })
}

describe('useRideImport', () => {
  it('saves only once when confirmed twice in quick succession', async () => {
    const { repository, flow } = await setUp()
    const saveMany = vi.spyOn(repository, 'saveMany')
    await flow.chooseFile(backupFile())

    await Promise.all([flow.confirmImport(), flow.confirmImport()])
    await flushPromises()

    expect(saveMany).toHaveBeenCalledTimes(1)
    expect(flow.state).toEqual({ step: 'done', importedCount: 1 })
  })

  it('ignores a confirm when there is nothing to confirm', async () => {
    const { repository, flow } = await setUp()
    const saveMany = vi.spyOn(repository, 'saveMany')

    await flow.confirmImport()

    expect(saveMany).not.toHaveBeenCalled()
    expect(flow.state).toEqual({ step: 'idle' })
  })

  it('shows the reading step while the file is being read', async () => {
    const { flow } = await setUp()
    const reading = flow.chooseFile(backupFile())
    expect(flow.state).toEqual({ step: 'reading', fileName: 'backup.json' })
    await reading
    expect(flow.state.step).toBe('preview')
  })
})
