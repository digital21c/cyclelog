import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import BarChart, { type Bar } from './BarChart.vue'

// jsdom has no layout, so the chart uses its fallback width of 600px.

function bars(values: number[]): Bar[] {
  return values.map((value, index) => ({
    key: `p${index}`,
    label: `Period ${index}`,
    shortLabel: `P${index}`,
    value,
    valueLabel: `${value} km`,
  }))
}

function mountChart(values: number[]) {
  return mount(BarChart, {
    props: {
      title: 'Bar chart of weekly distance',
      bars: bars(values),
      barClass: 'fill-sky-600',
    },
  })
}

function barHeights(wrapper: ReturnType<typeof mountChart>): number[] {
  return wrapper.findAll('rect').map((rect) => Number(rect.attributes('height')))
}

describe('BarChart', () => {
  it('is announced as an image with its title', () => {
    const svg = mountChart([10]).get('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Bar chart of weekly distance')
  })

  it('draws one bar per value, in proportion to the values', () => {
    const heights = barHeights(mountChart([50, 100, 25]))
    expect(heights).toHaveLength(3)
    expect(heights[1]).toBeCloseTo((heights[0] ?? 0) * 2)
    expect(heights[0]).toBeCloseTo((heights[2] ?? 0) * 2)
  })

  it('draws zero-value periods as empty bars', () => {
    expect(barHeights(mountChart([0, 40]))[0]).toBe(0)
  })

  it('handles a chart where every value is zero', () => {
    const wrapper = mountChart([0, 0, 0])
    expect(barHeights(wrapper)).toEqual([0, 0, 0])
    expect(wrapper.findAll('line').length).toBeGreaterThan(0) // the axis is still drawn
  })

  it('gives each bar a tooltip with its full label and value', () => {
    const titles = mountChart([42.5])
      .findAll('rect title')
      .map((title) => title.text())
    expect(titles).toEqual(['Period 0: 42.5 km'])
  })

  it('labels the value axis with round numbers', () => {
    const labels = mountChart([473])
      .findAll('line + text')
      .map((text) => text.text())
    expect(labels).toEqual(['0', '100', '200', '300', '400', '500'])
  })

  it('labels every bar when there is room', () => {
    const labels = mountChart([1, 2, 3, 4]).findAll('text[text-anchor="middle"]')
    expect(labels.map((label) => label.text())).toEqual(['P0', 'P1', 'P2', 'P3'])
  })

  it('thins out labels when bars are crowded, always keeping the newest', () => {
    const values = Array.from({ length: 52 }, (_, i) => i + 1)
    const labels = mountChart(values)
      .findAll('text[text-anchor="middle"]')
      .map((label) => label.text())

    expect(labels.length).toBeLessThan(52)
    expect(labels.length).toBeLessThanOrEqual(Math.floor(544 / 44) + 1)
    expect(labels.at(-1)).toBe('P51')
  })

  it('formats axis values with a supplied formatter', () => {
    const wrapper = mount(BarChart, {
      props: {
        title: 'Climb',
        bars: bars([1240]),
        barClass: 'fill-emerald-600',
        formatTick: (value: number) => `${value} m`,
      },
    })
    expect(wrapper.find('line + text').text()).toBe('0 m')
  })
})
