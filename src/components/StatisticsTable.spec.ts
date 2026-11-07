import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import type { PeriodSummary } from '@/services/rideStatistics'

import StatisticsTable from './StatisticsTable.vue'

const monthly: PeriodSummary = {
  period: 'month',
  rows: [
    { periodStart: '2026-09-01', rideCount: 4, distanceKm: 210.5, elevationM: 2100 },
    { periodStart: '2026-10-01', rideCount: 0, distanceKm: 0, elevationM: 0 },
    { periodStart: '2026-11-01', rideCount: 6, distanceKm: 1052.25, elevationM: 11250 },
  ],
  totals: { rideCount: 10, distanceKm: 1262.75, elevationM: 13350 },
}

function mountTable(summary: PeriodSummary = monthly) {
  return mount(StatisticsTable, { props: { summary, caption: 'Monthly totals, last 3 months' } })
}

function cells(row: ReturnType<ReturnType<typeof mountTable>['get']>): string[] {
  return row.findAll('th, td').map((cell) => cell.text())
}

describe('StatisticsTable', () => {
  it('has a caption and column headers for screen readers', () => {
    const wrapper = mountTable()
    expect(wrapper.get('caption').text()).toBe('Monthly totals, last 3 months')
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      'Month',
      'Rides',
      'Distance',
      'Climb',
    ])
    expect(wrapper.findAll('thead th').every((th) => th.attributes('scope') === 'col')).toBe(true)
  })

  it('lists periods newest first, with formatted values', () => {
    const rows = mountTable().findAll('tbody tr')
    expect(rows.map((row) => cells(row))).toEqual([
      ['November 2026', '6', '1,052.3 km', '11,250 m'],
      ['October 2026', '0', '0 km', '0 m'],
      ['September 2026', '4', '210.5 km', '2,100 m'],
    ])
  })

  it('marks each period as a row header with a machine-readable date', () => {
    const firstRowHeader = mountTable().get('tbody tr th')
    expect(firstRowHeader.attributes('scope')).toBe('row')
    expect(firstRowHeader.get('time').attributes('datetime')).toBe('2026-11-01')
  })

  it('totals the range in the footer', () => {
    expect(cells(mountTable().get('tfoot tr'))).toEqual([
      '3 months',
      '10',
      '1,262.8 km',
      '13,350 m',
    ])
  })

  it('labels weeks by their Monday', () => {
    const weekly: PeriodSummary = {
      period: 'week',
      rows: [{ periodStart: '2026-11-02', rideCount: 1, distanceKm: 10, elevationM: 50 }],
      totals: { rideCount: 1, distanceKm: 10, elevationM: 50 },
    }
    const wrapper = mountTable(weekly)
    expect(wrapper.get('thead th').text()).toBe('Week of')
    expect(wrapper.get('tbody th').text()).toBe('2 Nov 2026')
    expect(wrapper.get('tfoot th').text()).toBe('1 week')
  })
})
