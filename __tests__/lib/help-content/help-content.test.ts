/**
 * Help Center article registry (lib/help-content).
 *
 * Guards the registry conventions (unique kebab-case slugs, valid audiences,
 * internal routes), the Treasury Digital Books articles (T5.5) and their
 * audience filtering, and keeps retired flows (the receipt-settings page,
 * the free manual-entry date picker, the book "Book Receipt #" column) out
 * of the help text.
 */

import { describe, it, expect } from 'vitest'
import {
  HELP_ARTICLES,
  articlesForAudiences,
  helpAudiencesFor,
  searchArticles,
  type HelpArticle,
} from '@/lib/help-content'

const bySlug = (slug: string) => HELP_ARTICLES.find((a) => a.slug === slug)
const slugs = (articles: HelpArticle[]) => articles.map((a) => a.slug)

const RECORDER_SLUGS = [
  'recorder-recording-giving',
  'recorder-collection-sessions',
  'recorder-reprint-resend-void',
]
const TREASURER_SLUGS = [
  'treasurer-receipts-and-voids',
  'treasurer-statement-departments',
  'treasurer-cash-statement-export',
  'treasurer-period-summary',
  'treasurer-sessions-and-certification',
]
const ADMIN_TREASURY_SLUGS = [
  'admin-catch-up-windows',
  'admin-assigning-recorder-role',
  'admin-unlocking-certified-statement',
]

describe('HELP_ARTICLES registry', () => {
  it('has unique, kebab-case slugs', () => {
    const all = slugs(HELP_ARTICLES)
    expect(new Set(all).size).toBe(all.length)
    for (const slug of all) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('gives every article a title, category, body and at least one valid audience', () => {
    for (const article of HELP_ARTICLES) {
      expect(article.title.trim(), article.slug).not.toBe('')
      expect(article.category.trim(), article.slug).not.toBe('')
      expect(article.body.trim().length, article.slug).toBeGreaterThan(50)
      expect(article.roles.length, article.slug).toBeGreaterThan(0)
      for (const role of article.roles) expect(['member', 'recorder', 'admin']).toContain(role)
    }
  })

  it('uses internal routes for relatedRoute', () => {
    for (const article of HELP_ARTICLES) {
      if (article.relatedRoute) expect(article.relatedRoute, article.slug).toMatch(/^\/[a-z0-9\-/]*$/)
    }
  })

  it('does not reference retired flows', () => {
    for (const article of HELP_ARTICLES) {
      const text = `${article.title}\n${article.body}`.toLowerCase()
      expect(text, article.slug).not.toContain('receipt-settings')
      expect(text, article.slug).not.toContain('receipt settings')
      expect(text, article.slug).not.toContain('starting number')
      expect(text, article.slug).not.toContain('book receipt #')
      expect(text, article.slug).not.toContain('date picker')
      expect(article.relatedTourKey ?? '', article.slug).not.toContain('receipt_settings')
    }
  })
})

describe('Treasury Digital Books articles (T5.5)', () => {
  it('registers the recorder guides for the recorder audience only', () => {
    for (const slug of RECORDER_SLUGS) {
      const article = bySlug(slug)
      expect(article, slug).toBeDefined()
      expect(article!.roles).toEqual(['recorder'])
      expect(article!.relatedRoute).toBe('/record')
    }
  })

  it('registers the treasurer and admin guides for the admin audience', () => {
    for (const slug of [...TREASURER_SLUGS, ...ADMIN_TREASURY_SLUGS]) {
      const article = bySlug(slug)
      expect(article, slug).toBeDefined()
      expect(article!.roles).toEqual(['admin'])
    }
  })

  it('links each guide to the page it describes', () => {
    expect(bySlug('treasurer-receipts-and-voids')!.relatedRoute).toBe('/admin/receipts')
    expect(bySlug('treasurer-statement-departments')!.relatedRoute).toBe('/admin/categories')
    expect(bySlug('treasurer-cash-statement-export')!.relatedRoute).toBe('/admin/reports')
    expect(bySlug('treasurer-sessions-and-certification')!.relatedRoute).toBe('/admin/collection-sessions')
    expect(bySlug('admin-catch-up-windows')!.relatedRoute).toBe('/admin/catch-up-windows')
    expect(bySlug('admin-assigning-recorder-role')!.relatedRoute).toBe('/admin/members')
  })

  it('documents the date-based receipt number format and the no-backdating rule', () => {
    expect(bySlug('recorder-recording-giving')!.body).toContain('20260829-0017')
    expect(bySlug('recorder-recording-giving')!.body).toMatch(/catch-up window/)
    expect(bySlug('admin-catch-up-windows')!.body).toMatch(/72/)
    expect(bySlug('treasurer-receipts-and-voids')!.body).toMatch(/at least 10 characters/)
  })
})

describe('helpAudiencesFor', () => {
  const viewer = { canAccessAdmin: false, isRecorder: false, isStaff: false }

  it('gives a plain member only member articles', () => {
    expect(helpAudiencesFor(viewer)).toEqual(['member'])
  })

  it('adds recorder articles for a pure recorder, but no admin articles', () => {
    expect(helpAudiencesFor({ ...viewer, isRecorder: true })).toEqual(['member', 'recorder'])
  })

  it('gives staff recorder and admin articles (staff can also record giving)', () => {
    expect(helpAudiencesFor({ canAccessAdmin: true, isRecorder: false, isStaff: true })).toEqual([
      'member',
      'recorder',
      'admin',
    ])
  })

  it('gives a department admin admin articles without recorder ones', () => {
    expect(helpAudiencesFor({ ...viewer, canAccessAdmin: true })).toEqual(['member', 'admin'])
  })
})

describe('articlesForAudiences', () => {
  it('hides treasury and admin guides from a pure recorder', () => {
    const visible = slugs(articlesForAudiences(['member', 'recorder']))
    for (const slug of RECORDER_SLUGS) expect(visible).toContain(slug)
    for (const slug of [...TREASURER_SLUGS, ...ADMIN_TREASURY_SLUGS]) expect(visible).not.toContain(slug)
  })

  it('hides recorder guides from a plain member', () => {
    const visible = slugs(articlesForAudiences(['member']))
    for (const slug of RECORDER_SLUGS) expect(visible).not.toContain(slug)
    expect(visible).toContain('receipts-and-sms-notifications')
  })

  it('shows every article to staff', () => {
    expect(articlesForAudiences(['member', 'recorder', 'admin'])).toHaveLength(HELP_ARTICLES.length)
  })
})

describe('searchArticles', () => {
  it('finds the treasury guides by keyword', () => {
    const found = slugs(searchArticles('catch-up window', HELP_ARTICLES))
    expect(found).toContain('admin-catch-up-windows')
    expect(slugs(searchArticles('CERTIFY', HELP_ARTICLES))).toContain('treasurer-sessions-and-certification')
  })

  it('returns the list unchanged for a blank query', () => {
    expect(searchArticles('   ', HELP_ARTICLES)).toBe(HELP_ARTICLES)
  })
})
