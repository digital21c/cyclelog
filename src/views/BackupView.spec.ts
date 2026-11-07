import { describe, it, expect, vi, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { Ride } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { routes } from '@/router'
import { createBackup } from '@/services/rideBackup'
import { rideRepositoryKey } from '@/stores/injectionKeys'
import { useRidesStore } from '@/stores/rides'

import BackupView from './BackupView.vue'

afterEach(() => {
  vi.restoreAllMocks()
})

function makeRide(id: string, overrides: Partial<Ride> = {}): Ride {
  return {
    id,
    date: '2026-10-25',
    name: `Ride ${id}`,
    distanceKm: 40,
    elevationM: 400,
    createdAt: '2026-10-25T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    ...overrides,
  }
}

async function repositoryWith(rides: Ride[]): Promise<RideRepository> {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  await repository.saveMany(rides)
  return repository
}

/** Mounts the page with rides loaded, as App.vue would have done at startup. */
async function openBackup(repository: RideRepository) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/backup')
  const pinia = createPinia()
  const wrapper = mount(BackupView, {
    global: {
      plugins: [router, pinia],
      provide: { [rideRepositoryKey]: repository },
    },
  })
  await useRidesStore(pinia).loadRides()
  await flushPromises()
  return wrapper
}

/** Simulates choosing a file in the file picker. */
async function chooseFile(wrapper: VueWrapper, contents: string, fileName = 'backup.json') {
  const input = wrapper.get('input[type="file"]')
  const file = new File([contents], fileName, { type: 'application/json' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

function buttonNamed(wrapper: VueWrapper, text: string) {
  const found = wrapper.findAll('button').find((candidate) => candidate.text() === text)
  if (!found) throw new Error(`No button "${text}"`)
  return found
}

describe('BackupView export', () => {
  it('downloads every ride in the backup format', async () => {
    const rides = [makeRide('a'), makeRide('b')]
    const wrapper = await openBackup(await repositoryWith(rides))
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn<(blob: Blob) => string>(
      (blob: Blob) => (blobs.push(blob), 'blob:test'),
    )
    URL.revokeObjectURL = vi.fn<(url: string) => void>()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(wrapper.text()).toContain('Saves all 2 rides')
    await buttonNamed(wrapper, 'Download backup').trigger('click')

    expect(click).toHaveBeenCalledTimes(1)
    const backup = JSON.parse((await blobs[0]?.text()) ?? '')
    expect(backup).toMatchObject({ version: 1, app: 'CycleLog', rides })
  })

  it('disables the download when there are no rides', async () => {
    const wrapper = await openBackup(await repositoryWith([]))
    expect(buttonNamed(wrapper, 'Download backup').attributes('disabled')).toBeDefined()
  })
})

describe('BackupView import', () => {
  it('previews a backup without saving anything', async () => {
    const repository = await repositoryWith([makeRide('a')])
    const wrapper = await openBackup(repository)

    await chooseFile(wrapper, createBackup([makeRide('a'), makeRide('b'), makeRide('c')]).contents)

    expect(wrapper.text()).toContain('backup.json contains 3 rides: 2 new, 1 already in CycleLog.')
    expect(buttonNamed(wrapper, 'Import 2 rides').exists()).toBe(true)
    expect(await repository.getAll()).toHaveLength(1)
  })

  it('imports only the new rides when confirmed, leaving existing ones unchanged', async () => {
    const repository = await repositoryWith([makeRide('a', { name: 'Mine' })])
    const wrapper = await openBackup(repository)

    await chooseFile(
      wrapper,
      createBackup([makeRide('a', { name: 'From backup' }), makeRide('b')]).contents,
    )
    await buttonNamed(wrapper, 'Import 1 ride').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Imported 1 ride.')
    expect(wrapper.get('a[href="/"]').text()).toBe('View your rides')
    const saved = await repository.getAll()
    expect(saved.map((ride) => ride.id).sort()).toEqual(['a', 'b'])
    expect(saved.find((ride) => ride.id === 'a')?.name).toBe('Mine')
  })

  it('says there is nothing to import when every ride is already present', async () => {
    const rides = [makeRide('a')]
    const wrapper = await openBackup(await repositoryWith(rides))

    await chooseFile(wrapper, createBackup(rides).contents)

    expect(wrapper.text()).toContain('Nothing to import')
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['Download backup'])
  })

  it('explains why a file cannot be imported, and saves nothing', async () => {
    const repository = await repositoryWith([])
    const wrapper = await openBackup(repository)

    await chooseFile(wrapper, '{"some":"other app"}', 'notes.json')

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain("notes.json can't be imported.")
    expect(alert.text()).toContain("isn't a CycleLog backup")
    expect(await repository.getAll()).toEqual([])
  })

  it("explains when the chosen file can't be read at all", async () => {
    const wrapper = await openBackup(await repositoryWith([]))
    const input = wrapper.get('input[type="file"]')
    const unreadable = new File(['{}'], 'locked.json', { type: 'application/json' })
    // e.g. the file was moved or its permissions changed after it was picked
    Object.defineProperty(unreadable, 'text', {
      value: () => Promise.reject(new DOMException('File could not be read', 'NotReadableError')),
    })
    Object.defineProperty(input.element, 'files', { value: [unreadable], configurable: true })
    await input.trigger('change')
    await flushPromises()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain("locked.json can't be imported.")
    expect(alert.text()).toContain("The file couldn't be read.")
  })

  it('keeps the preview and allows a retry if saving fails', async () => {
    const repository = await repositoryWith([])
    const wrapper = await openBackup(repository)
    vi.spyOn(repository, 'saveMany').mockRejectedValueOnce(
      new Error('The quota has been exceeded.'),
    )

    await chooseFile(wrapper, createBackup([makeRide('a')]).contents)
    await buttonNamed(wrapper, 'Import 1 ride').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('The quota has been exceeded.')
    expect(await repository.getAll()).toEqual([])

    await buttonNamed(wrapper, 'Import 1 ride').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Imported 1 ride.')
    expect(await repository.getAll()).toEqual([makeRide('a')])
  })
})

describe('BackupView when rides cannot be loaded', () => {
  it('explains that backup and import are unavailable', async () => {
    const repository = await repositoryWith([])
    vi.spyOn(repository, 'getAll').mockRejectedValue(new Error('Ride data is not valid JSON.'))
    const wrapper = await openBackup(repository)

    expect(wrapper.get('[role="alert"]').text()).toContain('backup and import are unavailable')
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
  })
})
