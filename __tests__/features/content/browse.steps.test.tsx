/**
 * Web binding for the canonical `content/browse.feature`.
 *
 * Drives the web app's real public content queries (`GET_ALL_ANNOUNCEMENTS`,
 * `GET_ALL_DEVOTIONALS`, `GET_ALL_EVENTS`) through Apollo's MockedProvider. The
 * backend BDD suite proves the server-side visibility filters; here the mock
 * returns the already-filtered set and the web data-path renders it.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import { useQuery } from '@apollo/client/react'
import React from 'react'

import {
  GET_ALL_ANNOUNCEMENTS,
  GET_ALL_DEVOTIONALS,
  GET_ALL_EVENTS,
} from '@/lib/graphql/public-content-queries'

const feature = loadFeature('./browse.feature', { loadRelativePath: true })

function Feed({ query, field, onResult }: { query: any; field: string; onResult: (r: any[]) => void }) {
  const { data, loading } = useQuery(query)
  React.useEffect(() => {
    if (!loading) onResult((data as any)?.[field] ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data])
  return null
}

function runFeed(ctx: any, query: any, field: string, items: any[]) {
  const mocks = [{ request: { query }, result: { data: { [field]: items } } }]
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Feed query={query} field={field} onResult={(r) => (ctx.feed = r)} />
    </MockedProvider>
  )
}

const announcement = (i: number) => ({
  id: `a${i}`, title: `Announcement ${i}`, content: 'body',
  publishDate: '2026-06-01T10:00:00Z', expiryDate: null, priority: 0,
})
const devotional = (i: number) => ({
  id: `d${i}`, title: `Devotional ${i}`, content: 'body', author: 'Pastor',
  scriptureReference: 'John 3:16', publishDate: '2026-06-01T10:00:00Z',
  isFeatured: false, featuredImageUrl: null,
})
const event = (i: number) => ({
  id: `e${i}`, title: `Event ${i}`, description: 'desc', eventDate: '2026-05-01',
  eventTime: '10:00:00', location: 'Hall', registrationLink: null, featuredImageUrl: null,
})

defineFeature(feature, (test) => {
  test('Published announcements are listed and expired ones are hidden', ({ given, when, then }) => {
    const ctx: any = { feed: null }
    given(/^(\d+) published announcements and (\d+) expired announcement$/, (n: string) => {
      ctx.items = Array.from({ length: Number(n) }, (_, i) => announcement(i))
    })
    when('the announcements feed is loaded', async () => {
      runFeed(ctx, GET_ALL_ANNOUNCEMENTS, 'announcements', ctx.items)
      await waitFor(() => expect(ctx.feed).not.toBeNull())
    })
    then(/^(\d+) announcements are shown$/, (count: string) => {
      expect(ctx.feed).toHaveLength(Number(count))
    })
  })

  test('Only published devotionals are listed', ({ given, when, then }) => {
    const ctx: any = { feed: null }
    given(/^(\d+) published devotionals and (\d+) unpublished devotional$/, (n: string) => {
      ctx.items = Array.from({ length: Number(n) }, (_, i) => devotional(i))
    })
    when('the devotionals feed is loaded', async () => {
      runFeed(ctx, GET_ALL_DEVOTIONALS, 'devotionals', ctx.items)
      await waitFor(() => expect(ctx.feed).not.toBeNull())
    })
    then(/^(\d+) devotionals are shown$/, (count: string) => {
      expect(ctx.feed).toHaveLength(Number(count))
    })
  })

  test('Only active events are listed', ({ given, when, then }) => {
    const ctx: any = { feed: null }
    given(/^(\d+) active events and (\d+) inactive event$/, (n: string) => {
      ctx.items = Array.from({ length: Number(n) }, (_, i) => event(i))
    })
    when('the events feed is loaded', async () => {
      runFeed(ctx, GET_ALL_EVENTS, 'events', ctx.items)
      await waitFor(() => expect(ctx.feed).not.toBeNull())
    })
    then(/^(\d+) events are shown$/, (count: string) => {
      expect(ctx.feed).toHaveLength(Number(count))
    })
  })
})
