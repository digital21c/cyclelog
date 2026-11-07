import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { Ride } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { routes } from '@/router'
import { rideRepositoryKey } from '@/stores/injectionKeys'
import { useRidesStore } from '@/stores/rides'
import { addDays, todayIsoDate } from '@/utils/isoDate'

import StatisticsView from './StatisticsView.vue'

// Dates relative to the real today, because the page uses today's date.
const TODAY = todayIsoDate()

function ride(id: string, daysAgo: number, distanceKm: number, elevationM: number): Ride {
  const date = addDays(TODAY, -daysAgo)
  return {
    id,
    date,
    name: id,
    distanceKm,
    elevationM,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  }
}

async function repositoryWith(rides: Ride[]): Promise<RideRepository> {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  await repository.saveMany(rides)
  return repository
}

async function openStatistics(repository: RideRepository, url = '/stats') {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(url)
  const pinia = createPinia()
  const wrapper = mount(StatisticsView, {
    global: { plugins: [router, pinia], provide: { [rideRepositoryKey]: repository } },
  })
  await useRidesStore(pinia).loadRides()
  await flushPromises()
  return { wrapper, router }
}

function footer(wrapper: VueWrapper): string[] {
  return wrapper
    .get('tfoot tr')
    .findAll('th, td')
    .map((cell) => cell.text())
}

describe('StatisticsView', () => {
  it('shows weekly totals for the last 12 weeks by default', async () => {
    const { wrapper } = await openStatistics(
      await repositoryWith([ride('a', 0, 40, 400), ride('b', 1, 20, 200)]),
    )

    expect(wrapper.get('h2').text()).toBe('Weekly totals, last 12 weeks')
    expect(wrapper.findAll('tbody tr')).toHaveLength(12)
    expect(footer(wrapper)).toEqual(['12 weeks', '2', '60 km', '600 m'])
  })

  it('switches period, updating the URL and the totals', async () => {
    const { wrapper, router } = await openStatistics(
      await repositoryWith([ride('recent', 0, 40, 400), ride('old', 200, 100, 1000)]),
    )

    await wrapper.get('input[value="month"]').setValue(true)
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ period: 'month' })
    expect(wrapper.get('h2').text()).toBe('Monthly totals, last 12 months')
    expect(footer(wrapper)).toEqual(['12 months', '2', '140 km', '1,400 m'])
  })

  it('reads the period from the URL', async () => {
    const { wrapper } = await openStatistics(
      await repositoryWith([ride('a', 0, 40, 400)]),
      '/stats?period=year',
    )
    expect(wrapper.get('h2').text()).toMatch(/^Yearly totals, \d{4}$/)
    expect((wrapper.get('input[value="year"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('suggests adding a ride when there are none', async () => {
    const { wrapper } = await openStatistics(await repositoryWith([]))
    expect(wrapper.text()).toContain('No rides recorded yet')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('explains when rides cannot be loaded', async () => {
    const repository = await repositoryWith([])
    vi.spyOn(repository, 'getAll').mockRejectedValue(new Error('Ride data is not valid JSON.'))
    const { wrapper } = await openStatistics(repository)
    expect(wrapper.get('[role="alert"]').text()).toContain('Ride data is not valid JSON.')
  })

  it('draws a distance chart and a climb chart, one bar per period', async () => {
    const { wrapper } = await openStatistics(await repositoryWith([ride('a', 0, 40, 400)]))
    const charts = wrapper.findAll('svg[role="img"]')

    expect(charts.map((chart) => chart.attributes('aria-label'))).toEqual([
      'Bar chart of distance: Weekly totals, last 12 weeks',
      'Bar chart of climb: Weekly totals, last 12 weeks',
    ])
    expect(charts.map((chart) => chart.findAll('rect').length)).toEqual([12, 12])
    // The newest bar is on the right and carries this week's totals.
    expect(charts[0]?.findAll('rect title').at(-1)?.text()).toMatch(/: 40 km$/)
    expect(charts[1]?.findAll('rect title').at(-1)?.text()).toMatch(/: 400 m$/)
  })
})
