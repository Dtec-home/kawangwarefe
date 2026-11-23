/** WA-3: the shared totals-post editor (schedule, layout, texts, live preview, save, test). */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React, { useState } from 'react'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('sonner', () => ({ toast }))

import { PostSettingsEditor, type PostSettingsEditorProps } from '@/components/whatsapp-posts/post-settings-editor'
import { PREVIEW_TOTALS_POST } from '@/lib/graphql/whatsapp-posts'
import { toFullOverrideInput } from '@/lib/whatsapp-posts/inputs'
import type { PostSettings } from '@/lib/whatsapp-posts/types'

import { PREVIEW_TEXT, settings } from '../../lib/whatsapp-posts/fixtures'

afterEach(() => {
  cleanup()
  toast.success.mockReset()
  toast.error.mockReset()
})

type Overrides = Partial<PostSettingsEditorProps> & { initial?: PostSettings }

function Harness({ initial = settings(), onChangeSpy, ...rest }: Overrides & { onChangeSpy?: (s: PostSettings) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <PostSettingsEditor
      value={value}
      onChange={(next) => {
        setValue(next)
        onChangeSpy?.(next)
      }}
      previewCampaignId="9"
      previewInput={toFullOverrideInput(value)}
      previewDelayMs={20}
      onSave={async () => ({ success: true, message: 'WhatsApp post settings saved.' })}
      {...rest}
    />
  )
}

function previewMock(input: ReturnType<typeof toFullOverrideInput>, text = PREVIEW_TEXT, calls?: { n: number }): MockedResponse {
  return {
    request: { query: PREVIEW_TOTALS_POST, variables: { campaignId: '9', input } },
    result: () => {
      if (calls) calls.n += 1
      return { data: { previewTotalsPost: { __typename: 'TotalsPostPreview', text } } }
    },
    maxUsageCount: 10,
  }
}

function renderEditor(props: Overrides = {}, mocks: MockedResponse[] = [previewMock(toFullOverrideInput(props.initial ?? settings()))]) {
  return render(
    <MockedProvider mocks={mocks}>
      <Harness {...props} />
    </MockedProvider>,
  )
}

describe('PostSettingsEditor — schedule', () => {
  it('summarises the schedule and shows the interval fields', async () => {
    renderEditor()
    expect(screen.getByTestId('schedule-summary')).toHaveTextContent('Hourly 08:00–20:00 when something changed, plus 23:50')
    expect(screen.getByLabelText('Every N minutes in a window')).toBeChecked()
    expect(screen.getByLabelText('Post every')).toHaveValue('60')
    expect(screen.getByLabelText('Window start')).toHaveValue('08:00')
    expect(screen.getByLabelText('Only post when something changed')).toBeChecked()
    expect(await screen.findByTestId('totals-preview')).toBeInTheDocument()
  })

  it('offers no interval under 30 minutes', () => {
    renderEditor()
    const options = within(screen.getByLabelText('Post every')).getAllByRole('option').map((o) => Number((o as HTMLOptionElement).value))
    expect(Math.min(...options)).toBe(30)
  })

  it('switches to fixed times and edits the list', () => {
    const spy = vi.fn()
    renderEditor({ onChangeSpy: spy })
    fireEvent.click(screen.getByLabelText('At fixed times'))
    expect(screen.getByText('Add at least one fixed time.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add a time' }))
    expect(screen.getByLabelText('Fixed time 1')).toHaveValue('12:00')
    fireEvent.change(screen.getByLabelText('Fixed time 1'), { target: { value: '13:30' } })
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ scheduleKind: 'fixed_times', fixedTimes: ['13:30'] }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove 13:30' }))
    expect(screen.queryByLabelText('Fixed time 1')).not.toBeInTheDocument()
  })

  it('once a day asks for the post time only', () => {
    renderEditor()
    fireEvent.click(screen.getByLabelText('Once a day'))
    expect(screen.queryByLabelText('Post every')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Post time')).toHaveValue('23:50')
    expect(screen.getByTestId('schedule-summary')).toHaveTextContent('Once a day at 23:50')
  })

  it('toggles weekdays and the final post', () => {
    const spy = vi.fn()
    renderEditor({ onChangeSpy: spy })
    const sunday = screen.getByRole('button', { name: 'Sunday' })
    expect(sunday).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(sunday)
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ daysOfWeek: [0, 1, 2, 3, 4, 5] }))
    fireEvent.click(screen.getByLabelText('Final daily post'))
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ finalPostTime: null }))
    expect(screen.queryByLabelText('Final post time')).not.toBeInTheDocument()
  })

  it('shows the server rule for a window that ends before it starts', () => {
    renderEditor()
    fireEvent.change(screen.getByLabelText('Window end'), { target: { value: '07:00' } })
    expect(screen.getByText('The window must start before it ends.')).toBeInTheDocument()
    expect(screen.getByText(/Fix the settings to see the preview/)).toBeInTheDocument()
  })
})

describe('PostSettingsEditor — layout', () => {
  it('lists every block with a switch and moves them', () => {
    const spy = vi.fn()
    renderEditor({ onChangeSpy: spy })
    const items = within(screen.getByRole('list', { name: 'Post layout' })).getAllByRole('listitem')
    expect(items).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Move Campaign name up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move How to give down' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Move Intro text up' }))
    expect(spy.mock.lastCall?.[0].layout.slice(0, 2).map((b: { block: string }) => b.block)).toEqual(['intro', 'header'])
    const thankYou = screen.getByRole('switch', { name: 'Show Thank-you line' })
    expect(thankYou).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(thankYou)
    expect(spy.mock.lastCall?.[0].layout.find((b: { block: string }) => b.block === 'thank_you').enabled).toBe(true)
  })

  it('counts the intro and closing characters', () => {
    renderEditor()
    fireEvent.change(screen.getByLabelText('Intro text'), { target: { value: 'Karibu' } })
    expect(screen.getByTestId('intro-text-count')).toHaveTextContent('6/1000')
    expect(screen.getByTestId('closing-text-count')).toHaveTextContent('0/1000')
  })
})

describe('PostSettingsEditor — preview', () => {
  it('renders the message like WhatsApp, bold in bold', async () => {
    renderEditor()
    const bubble = await screen.findByTestId('totals-preview')
    await waitFor(() => expect(bubble).toHaveTextContent('Today: KES 5,000 from 3 givers'))
    expect(within(bubble).getByText('📢 Church Building').tagName).toBe('STRONG')
  })

  it('waits for typing to stop before asking the server again', async () => {
    const calls = { n: 0 }
    const typed = settings({ introText: 'Karibu' })
    const mocks = [previewMock(toFullOverrideInput(settings()), PREVIEW_TEXT, calls), previewMock(toFullOverrideInput(typed), 'Karibu', calls)]
    render(
      <MockedProvider mocks={mocks}>
        <Harness />
      </MockedProvider>,
    )
    await waitFor(() => expect(calls.n).toBe(1))
    const intro = screen.getByLabelText('Intro text')
    for (const text of ['K', 'Ka', 'Kar', 'Kari', 'Karib', 'Karibu']) fireEvent.change(intro, { target: { value: text } })
    await waitFor(() => expect(screen.getByTestId('totals-preview')).toHaveTextContent('Karibu'))
    await act(async () => new Promise((r) => setTimeout(r, 60)))
    expect(calls.n).toBe(2)
  })

  it('says why there is no preview without a campaign', () => {
    renderEditor({ previewCampaignId: null, previewEmptyText: 'Create a campaign to see a preview.' }, [])
    expect(screen.getByText('Create a campaign to see a preview.')).toBeInTheDocument()
  })

  it('shows a preview error from the server', async () => {
    const mocks: MockedResponse[] = [
      { request: { query: PREVIEW_TOTALS_POST, variables: { campaignId: '9', input: toFullOverrideInput(settings()) } }, error: new Error('Gateway down') },
    ]
    renderEditor({}, mocks)
    expect(await screen.findByText(/Could not load the preview: Gateway down/)).toBeInTheDocument()
  })
})

describe('PostSettingsEditor — save and test', () => {
  it('saves and says so', async () => {
    const onSave = vi.fn(async () => ({ success: true, message: 'WhatsApp post settings saved.' }))
    renderEditor({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('WhatsApp post settings saved.'))
  })

  it('shows the server refusal next to the button', async () => {
    const onSave = vi.fn(async () => ({ success: false, message: 'Admin access required.' }))
    renderEditor({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Admin access required.')
    expect(toast.error).toHaveBeenCalledWith('Admin access required.')
  })

  it('does not send settings the server would refuse', async () => {
    const onSave = vi.fn(async () => ({ success: true, message: 'ok' }))
    renderEditor({ onSave, initial: settings({ intervalMinutes: 15 }) }, [])
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Fix the highlighted settings first.')
  })

  it('reports a thrown save error', async () => {
    const onSave = vi.fn(async () => {
      throw new Error('Network down')
    })
    renderEditor({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down')
  })

  it('explains the 10-minute limit when a test is refused', async () => {
    const onSendTest = vi.fn(async () => ({
      success: false,
      message: 'A test was posted a few minutes ago. Please wait 10 minutes before sending another.',
    }))
    renderEditor({ onSendTest })
    fireEvent.click(screen.getByRole('button', { name: 'Send a test to the group now' }))
    const note = await screen.findByTestId('send-test-refused')
    expect(note).toHaveTextContent('Please wait 10 minutes')
    expect(note).toHaveTextContent('One test can go to the group every 10 minutes for each campaign.')
  })

  it('sends a test and warns that unsaved changes are not in it', async () => {
    const onSendTest = vi.fn(async () => ({ success: true, message: 'Test post sent to the WhatsApp group.' }))
    renderEditor({ onSendTest, dirty: true })
    expect(screen.getByText(/the test uses the saved settings/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Send a test to the group now' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Test post sent to the WhatsApp group.'))
  })

  it('cannot send a test without a group', () => {
    renderEditor({ onSendTest: vi.fn(), sendTestBlockedReason: 'Add the WhatsApp group on the campaign form first.' })
    expect(screen.getByRole('button', { name: 'Send a test to the group now' })).toBeDisabled()
    expect(screen.getByText('Add the WhatsApp group on the campaign form first.')).toBeInTheDocument()
  })

  it('shows hints with a way back to the church value', () => {
    const onReset = vi.fn()
    renderEditor({ hints: { intervalMinutes: { text: 'Changed for this campaign', onReset }, windowStart: { text: 'Church: 08:00' } } })
    expect(screen.getByText('Church: 08:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use the church value for Post every' }))
    expect(onReset).toHaveBeenCalled()
  })
})
