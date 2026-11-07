/**
 * Runs before every test file (see `setupFiles` in vitest.config.ts).
 *
 * jsdom, the simulated browser used by the tests, doesn't implement
 * <dialog>'s showModal()/close(), although every current browser does.
 * This minimal stand-in models just what our components rely on: the `open`
 * state and the `close` event. It does not imitate focus trapping or the
 * backdrop; those are checked in a real browser.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
