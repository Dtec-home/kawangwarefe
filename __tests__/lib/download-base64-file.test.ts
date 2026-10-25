import { describe, it, expect, vi, afterEach } from 'vitest'
import { downloadBase64File } from '@/lib/download-base64-file'

describe('downloadBase64File', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds a Blob of the decoded bytes and clicks a download link', () => {
    const created: Blob[] = []
    const createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob)
      return 'blob:cash-statement'
    })
    const revokeObjectURL = vi.fn()
    Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('Cash_Statement_2026-09-12.pdf')
      expect(this.href).toBe('blob:cash-statement')
    })

    downloadBase64File(btoa('%PDF'), 'Cash_Statement_2026-09-12.pdf', 'application/pdf')

    expect(click).toHaveBeenCalledTimes(1)
    expect(created[0].type).toBe('application/pdf')
    expect(created[0].size).toBe(4) // "%PDF" decoded
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:cash-statement')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
