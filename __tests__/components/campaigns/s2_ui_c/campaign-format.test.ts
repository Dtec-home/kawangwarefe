import { describe, expect, it } from 'vitest'
import {
  daysLeftLabel,
  newestFirst,
  safeHttpUrl,
  storyParagraphs,
  youtubeId,
} from '@/components/campaigns/public/campaign-format'

describe('daysLeftLabel', () => {
  it('counts down the days', () => {
    expect(daysLeftLabel(12)).toBe('12 days left')
    expect(daysLeftLabel(1)).toBe('1 day left')
  })
  it('calls the last day out', () => {
    expect(daysLeftLabel(0)).toBe('Last day')
  })
  it('says the campaign has ended once the date has passed', () => {
    expect(daysLeftLabel(-3)).toBe('Ended')
  })
  it('says nothing when there is no end date', () => {
    expect(daysLeftLabel(null)).toBeNull()
  })
})

describe('storyParagraphs', () => {
  it('splits on blank lines and trims', () => {
    expect(storyParagraphs('  One.\n\n\nTwo\nlines. \n')).toEqual(['One.', 'Two\nlines.'])
  })
  it('handles Windows line endings and empty stories', () => {
    expect(storyParagraphs('A\r\n\r\nB')).toEqual(['A', 'B'])
    expect(storyParagraphs('   ')).toEqual([])
  })
})

describe('safeHttpUrl', () => {
  it('keeps http and https links', () => {
    expect(safeHttpUrl('https://images.example/a.jpg')).toBe('https://images.example/a.jpg')
    expect(safeHttpUrl(' http://x.example/b.png ')).toBe('http://x.example/b.png')
  })
  it('drops anything else', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:image/png;base64,AAA')).toBeNull()
    expect(safeHttpUrl('/relative.jpg')).toBeNull()
    expect(safeHttpUrl('')).toBeNull()
  })
})

describe('youtubeId', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
  ])('reads the id from %s', (url) => {
    expect(youtubeId(url)).toBe('dQw4w9WgXcQ')
  })
  it.each([
    'javascript:alert(1)',
    'https://evil.example/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ"><script>',
    '',
  ])('refuses %s', (url) => {
    expect(youtubeId(url)).toBeNull()
  })
})

describe('newestFirst', () => {
  it('orders updates by publish date, undated last', () => {
    const sorted = newestFirst([
      { id: 'a', publishedAt: '2026-10-01T00:00:00Z' },
      { id: 'b', publishedAt: null },
      { id: 'c', publishedAt: '2026-10-15T00:00:00Z' },
    ])
    expect(sorted.map((u) => u.id)).toEqual(['c', 'a', 'b'])
  })
})
