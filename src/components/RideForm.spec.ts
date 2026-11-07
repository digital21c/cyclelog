import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

import type { RideDraft } from '@/models/rideDraft'
import type { RideInputErrors } from '@/models/rideValidation'

import RideForm from './RideForm.vue'

const initialDraft: RideDraft = { date: '2026-11-06', name: '', distanceKm: '', elevationM: '' }

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount() // detach from document.body between tests
  wrapper = undefined
})

function mountForm(props: { errors?: RideInputErrors; submitting?: boolean } = {}) {
  wrapper = mount(RideForm, {
    props: { initialDraft, maxDate: '2026-11-07', ...props },
    attachTo: document.body, // needed to check which element has focus
  })
  return wrapper
}

/** Finds an input by its visible label text, as a user would. */
function inputLabelled(form: VueWrapper, labelText: string) {
  const label = form.findAll('label').find((candidate) => candidate.text() === labelText)
  if (!label) throw new Error(`No label "${labelText}"`)
  return form.get(`#${CSS.escape(label.attributes('for') ?? '')}`)
}

describe('RideForm', () => {
  it('starts with the initial draft values and today as the latest date', () => {
    const form = mountForm()
    const date = inputLabelled(form, 'Date')
    expect((date.element as HTMLInputElement).value).toBe('2026-11-06')
    expect(date.attributes('max')).toBe('2026-11-07')
  })

  it('emits a typed RideInput on submit', async () => {
    const form = mountForm()
    await inputLabelled(form, 'Ride name').setValue('Uriarra Loop')
    await inputLabelled(form, 'Distance (km)').setValue('67.25')
    await inputLabelled(form, 'Climb (m)').setValue('790')
    await form.get('form').trigger('submit')

    expect(form.emitted('submit')).toEqual([
      [{ date: '2026-11-06', name: 'Uriarra Loop', distanceKm: 67.25, elevationM: 790 }],
    ])
  })

  it('does not modify the initial draft object', async () => {
    const form = mountForm()
    await inputLabelled(form, 'Ride name').setValue('Changed')
    expect(initialDraft.name).toBe('')
  })

  it('shows each field error under its input, linked for screen readers', () => {
    const form = mountForm({ errors: { name: 'Enter a ride name.' } })
    const name = inputLabelled(form, 'Ride name')

    expect(name.attributes('aria-invalid')).toBe('true')
    const message = form.get(`#${CSS.escape(name.attributes('aria-describedby') ?? '')}`)
    expect(message.text()).toBe('Enter a ride name.')
    expect(inputLabelled(form, 'Date').attributes('aria-invalid')).toBe('false')
  })

  it("hides a field's error once that field is edited, leaving others", async () => {
    const form = mountForm({
      errors: { name: 'Enter a ride name.', distanceKm: 'Distance must be greater than 0 km.' },
    })
    await inputLabelled(form, 'Ride name').setValue('Cotter Loop')

    expect(form.text()).not.toContain('Enter a ride name.')
    expect(form.text()).toContain('Distance must be greater than 0 km.')
  })

  it('shows all errors again, and focuses the first invalid field, when new errors arrive', async () => {
    const form = mountForm()
    await inputLabelled(form, 'Ride name').setValue('x')

    await form.setProps({
      errors: { name: 'Enter a ride name.', elevationM: 'Climb must be a whole number.' },
    })
    await form.vm.$nextTick()

    expect(form.text()).toContain('Enter a ride name.')
    expect(document.activeElement).toBe(inputLabelled(form, 'Ride name').element)
  })

  it('disables the save button while submitting', () => {
    const save = mountForm({ submitting: true }).get('button[type="submit"]')
    expect(save.attributes('disabled')).toBeDefined()
    expect(save.text()).toBe('Saving…')
  })

  it('emits cancel without submitting', async () => {
    const form = mountForm()
    await form.get('button[type="button"]').trigger('click')
    expect(form.emitted('cancel')).toHaveLength(1)
    expect(form.emitted('submit')).toBeUndefined()
  })
})
