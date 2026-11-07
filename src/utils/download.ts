/**
 * Makes the browser save `contents` as a file called `fileName`.
 *
 * Works offline: the file is built in memory as a Blob, given a temporary
 * `blob:` URL, and "clicked" through a hidden link with a `download`
 * attribute. Nothing is sent anywhere.
 */
export function downloadTextFile(
  fileName: string,
  contents: string,
  mimeType = 'application/json',
): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }))

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()

  // Release the memory once the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
