/**
 * Test Data Fixtures — Object Mother Pattern
 *
 * Centralised factory functions so every test has repeatable, DRY data.
 * Following FIRST (Repeatable) and SOLID (OCP — extend via overrides, never modify factories).
 */

export interface Announcement {
  id: string
  title: string
  content: string
  publishDate: string
  priority: number
}

export interface Devotional {
  id: string
  title: string
  content: string
  author: string
  scriptureReference: string
  publishDate: string
  isFeatured: boolean
  featuredImageUrl?: string
}

export interface Event {
  id: string
  title: string
  description: string
  eventDate: string
  eventTime: string
  location: string
  registrationLink?: string
  featuredImageUrl?: string
}

export interface YouTubeVideo {
  id: string
  title: string
  videoId: string
  description: string
  category: string
  embedUrl: string
  thumbnailUrl: string
  watchUrl: string
}

export interface Category {
  id: string
  name: string
  code: string
  description: string
}

export interface CategoryAmount {
  categoryId: string
  amount: string
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

let _seq = 0
const seq = () => String(++_seq)

export const makeAnnouncement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: seq(),
  title: 'Sabbath School Curriculum Update',
  content: 'New quarterly materials are available at the reception desk.',
  publishDate: '2026-03-01T10:00:00Z',
  priority: 0,
  ...overrides,
})

export const makeDevotional = (overrides: Partial<Devotional> = {}): Devotional => ({
  id: seq(),
  title: 'Trust in the Lord',
  content: 'Proverbs 3:5-6 reminds us to lean not on our own understanding.',
  author: 'Pastor James Kariuki',
  scriptureReference: 'Proverbs 3:5-6',
  publishDate: '2026-03-01T06:00:00Z',
  isFeatured: false,
  ...overrides,
})

export const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: seq(),
  title: 'Pathfinder Club Rally',
  description: 'Annual pathfinder club rally at the church grounds.',
  eventDate: '2026-03-15T09:00:00Z',
  eventTime: '9:00 AM',
  location: 'Church Grounds, Kawangware',
  ...overrides,
})

export const makeYouTubeVideo = (overrides: Partial<YouTubeVideo> = {}): YouTubeVideo => ({
  id: seq(),
  title: 'Sabbath Sermon — March 1, 2026',
  videoId: 'dQw4w9WgXcQ',
  description: 'Join us for this Sabbath sermon on the love of God.',
  category: 'Sermon',
  embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ...overrides,
})

export const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: seq(),
  name: 'Tithe',
  code: 'TITHE',
  description: 'Weekly tithe contribution',
  ...overrides,
})

export const makeCategoryAmount = (overrides: Partial<CategoryAmount> = {}): CategoryAmount => ({
  categoryId: '',
  amount: '',
  ...overrides,
})
