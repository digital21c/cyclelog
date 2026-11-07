import { describe, it, expect, vi, afterEach } from 'vitest'

import { downloadTextFile } from './download'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/**
 * jsdom doesn't implement blob URLs or real downloads, so we capture what
 * would be downloaded: the Blob handed to createObjectURL and the link clicked.
 */
function captureDownload() {
  const blobs: Blob[] = []
  URL.createObjectURL = vi.fn<(blob: Blob) => string>((blob: Blob) => {
    blobs.push(blob)
    return 'blob:cyclelog/test'
  })
  URL.revokeObjectURL = vi.fn<(url: string) => void>()
  const clicked: HTMLAnchorElement[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push(this)
  })
  return { blobs, clicked }
}

describe('downloadTextFile', () => {
  it('clicks a link that downloads the contents under the given name', async () => {
    const { blobs, clicked } = captureDownload()

    downloadTextFile('cyclelog-backup-2026-11-07.json', '{"version":1}')

    expect(clicked).toHaveLength(1)
    expect(clicked[0]?.download).toBe('cyclelog-backup-2026-11-07.json')
    expect(clicked[0]?.href).toBe('blob:cyclelog/test')
    expect(await blobs[0]?.text()).toBe('{"version":1}')
    expect(blobs[0]?.type).toBe('application/json')
  })

  it('removes the temporary link from the page', () => {
    captureDownload()
    downloadTextFile('a.json', '{}')
    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })

  it('releases the blob URL afterwards', () => {
    vi.useFakeTimers()
    captureDownload()

    downloadTextFile('a.json', '{}')
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cyclelog/test')
  })
})
