import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

import ConfirmDialog from './ConfirmDialog.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

/** Mounts the dialog as `v-model:open` would use it, feeding updates back in. */
function mountDialog(props: { open: boolean; busy?: boolean; error?: string | null }) {
  const mounted = mount(ConfirmDialog, {
    props: {
      title: 'Delete this ride?',
      confirmLabel: 'Delete ride',
      busyLabel: 'Deleting…',
      ...props,
      'onUpdate:open': (value: boolean) => mounted.setProps({ open: value }),
    },
    slots: { default: 'Uriarra Loop will be permanently deleted.' },
    attachTo: document.body,
  })
  wrapper = mounted
  return mounted
}

function dialogElement(dialog: VueWrapper): HTMLDialogElement {
  return dialog.get('dialog').element as HTMLDialogElement
}

function button(dialog: VueWrapper, text: string) {
  const found = dialog.findAll('button').find((candidate) => candidate.text() === text)
  if (!found) throw new Error(`No button "${text}"`)
  return found
}

describe('ConfirmDialog', () => {
  it('opens the native dialog when open is true', () => {
    const dialog = mountDialog({ open: true })
    expect(dialogElement(dialog).open).toBe(true)
    expect(dialog.text()).toContain('Uriarra Loop will be permanently deleted.')
  })

  it('stays closed when open is false, and opens when it becomes true', async () => {
    const dialog = mountDialog({ open: false })
    expect(dialogElement(dialog).open).toBe(false)

    await dialog.setProps({ open: true })
    expect(dialogElement(dialog).open).toBe(true)
  })

  it('is labelled by its title', () => {
    const dialog = mountDialog({ open: true })
    const labelId = dialog.get('dialog').attributes('aria-labelledby') ?? ''
    expect(dialog.get(`#${CSS.escape(labelId)}`).text()).toBe('Delete this ride?')
  })

  it('emits confirm when the confirm button is pressed', async () => {
    const dialog = mountDialog({ open: true })
    await button(dialog, 'Delete ride').trigger('click')
    expect(dialog.emitted('confirm')).toHaveLength(1)
  })

  it('closes without confirming when Cancel is pressed', async () => {
    const dialog = mountDialog({ open: true })
    await button(dialog, 'Cancel').trigger('click')

    expect(dialog.emitted('update:open')).toEqual([[false]])
    expect(dialogElement(dialog).open).toBe(false)
    expect(dialog.emitted('confirm')).toBeUndefined()
  })

  it('updates the model when the dialog closes itself (e.g. Escape)', async () => {
    const dialog = mountDialog({ open: true })
    dialogElement(dialog).close()
    await dialog.vm.$nextTick()
    expect(dialog.emitted('update:open')).toEqual([[false]])
  })

  it('puts the safe choice, Cancel, first and focuses it on opening', () => {
    const dialog = mountDialog({ open: true })
    expect(dialog.findAll('button').map((candidate) => candidate.text())).toEqual([
      'Cancel',
      'Delete ride',
    ])
    expect(button(dialog, 'Cancel').attributes('autofocus')).toBeDefined()
  })

  describe('while busy', () => {
    it('disables both buttons and shows the busy label', () => {
      const dialog = mountDialog({ open: true, busy: true })
      const buttons = dialog.findAll('button')
      expect(buttons.map((candidate) => candidate.attributes('disabled'))).toEqual(['', ''])
      expect(buttons[1]?.text()).toBe('Deleting…')
    })

    it('ignores Escape', () => {
      const dialog = mountDialog({ open: true, busy: true })
      const escape = new Event('cancel', { cancelable: true })
      dialogElement(dialog).dispatchEvent(escape)
      expect(escape.defaultPrevented).toBe(true)
    })
  })

  it('lets Escape close it when not busy', () => {
    const dialog = mountDialog({ open: true })
    const escape = new Event('cancel', { cancelable: true })
    dialogElement(dialog).dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(false)
  })

  it('shows an error from a failed attempt', () => {
    const dialog = mountDialog({ open: true, error: 'The quota has been exceeded.' })
    expect(dialog.get('[role="alert"]').text()).toContain('The quota has been exceeded.')
  })
})
