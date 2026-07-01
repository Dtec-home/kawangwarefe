/**
 * avatar-upload client tests.
 * Pure-function tests for the validator + a fetch-mocked integration test.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  AVATAR_MAX_BYTES,
  AVATAR_ALLOWED_MIME,
  validateAvatarLocally,
  compressAvatarImage,
  uploadAvatar,
} from '@/lib/profile/avatar-upload'

describe('avatar constants', () => {
  it('caps uploads at 2 MB and allows only PNG/JPEG', () => {
    expect(AVATAR_MAX_BYTES).toBe(2 * 1024 * 1024)
    expect([...AVATAR_ALLOWED_MIME]).toEqual(['image/png', 'image/jpeg'])
  })
})

describe('validateAvatarLocally', () => {
  it('accepts a small PNG', () => {
    const f = new File([new Uint8Array(1024)], 'a.png', { type: 'image/png' })
    expect(() => validateAvatarLocally(f)).not.toThrow()
  })

  it('accepts a JPEG', () => {
    const f = new File([new Uint8Array(1024)], 'a.jpg', { type: 'image/jpeg' })
    expect(() => validateAvatarLocally(f)).not.toThrow()
  })

  it('rejects GIFs', () => {
    const f = new File([new Uint8Array(1024)], 'a.gif', { type: 'image/gif' })
    expect(() => validateAvatarLocally(f)).toThrow(/Unsupported/)
  })

  it('rejects oversize files', () => {
    const f = new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], 'a.png', {
      type: 'image/png',
    })
    expect(() => validateAvatarLocally(f)).toThrow(/too large/i)
  })
})

describe('uploadAvatar', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // jsdom never fires Image.onload (it doesn't load images), so the in-browser
    // canvas compression would hang. Trigger onerror instead — uploadAvatar
    // falls back to the raw file and proceeds to the (mocked) network call.
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: ((e: unknown) => void) | null = null
        set src(_v: string) {
          setTimeout(() => this.onerror && this.onerror(new Error('no image in jsdom')), 0)
        }
      }
    )
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllGlobals()
  })

  it('POSTs multipart with bearer token on happy path', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'ok', avatar_url: '/media/x.png' }),
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const f = new File([new Uint8Array(100)], 'pic.png', { type: 'image/png' })
    const res = await uploadAvatar(f, 'jwt-token')

    expect(res.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [, init] = mockFetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer jwt-token')
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('throws on server-side rejection (success=false)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Image too large' }),
    }) as unknown as typeof fetch

    const f = new File([new Uint8Array(100)], 'pic.png', { type: 'image/png' })
    await expect(uploadAvatar(f, 't')).rejects.toThrow(/Image too large/)
  })

  it('rejects an unsupported MIME type before any network call', async () => {
    const mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    const f = new File([new Uint8Array(10)], 'a.gif', { type: 'image/gif' })
    await expect(uploadAvatar(f, 't')).rejects.toThrow(/Unsupported/)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('surfaces a generic error when the response body is not JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Unexpected token < in JSON')
      },
    }) as unknown as typeof fetch

    const f = new File([new Uint8Array(10)], 'pic.png', { type: 'image/png' })
    await expect(uploadAvatar(f, 't')).rejects.toThrow(/HTTP 502/)
  })

  it('falls back to the server status message when payload omits one', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: '' }),
    }) as unknown as typeof fetch

    const f = new File([new Uint8Array(10)], 'pic.png', { type: 'image/png' })
    await expect(uploadAvatar(f, 't')).rejects.toThrow(/HTTP 401/)
  })
})

describe('compressAvatarImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('resizes via canvas and resolves the JPEG blob on image load', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()

    // Fire onload synchronously once src is set so the canvas branch runs.
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: ((e: unknown) => void) | null = null
        naturalWidth = 2048
        naturalHeight = 1024
        set src(_v: string) {
          setTimeout(() => this.onload && this.onload(), 0)
        }
      }
    )

    const outBlob = new Blob([new Uint8Array(50)], { type: 'image/jpeg' })
    const ctx = { drawImage: vi.fn() }
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockImplementation(
        () =>
          ({
            width: 0,
            height: 0,
            getContext: () => ctx,
            toBlob: (cb: (b: Blob | null) => void) => cb(outBlob),
          }) as unknown as HTMLElement
      )

    const file = new File([new Uint8Array(100)], 'pic.png', { type: 'image/png' })
    const result = await compressAvatarImage(file, 1024, 0.8)

    expect(result).toBe(outBlob)
    expect(ctx.drawImage).toHaveBeenCalled()
    createElement.mockRestore()
  })

  it('rejects when the image cannot be loaded', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: ((e: unknown) => void) | null = null
        set src(_v: string) {
          setTimeout(() => this.onerror && this.onerror(new Error('boom')), 0)
        }
      }
    )

    const file = new File([new Uint8Array(10)], 'pic.png', { type: 'image/png' })
    await expect(compressAvatarImage(file)).rejects.toThrow(/Could not load image/)
  })

  it('rejects when canvas.toBlob yields null', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: ((e: unknown) => void) | null = null
        naturalWidth = 100
        naturalHeight = 100
        set src(_v: string) {
          setTimeout(() => this.onload && this.onload(), 0)
        }
      }
    )
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (cb: (b: Blob | null) => void) => cb(null),
        } as unknown as HTMLElement
      }
      return {} as HTMLElement
    })

    const file = new File([new Uint8Array(10)], 'pic.png', { type: 'image/png' })
    await expect(compressAvatarImage(file)).rejects.toThrow(/Canvas compression failed/)
  })
})
