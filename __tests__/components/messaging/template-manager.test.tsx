/**
 * TemplateManager tests.
 *
 * Covers the full template lifecycle (list, create, edit, toggle, delete) plus
 * the toast success/error branches. useQuery/useMutation and react-hot-toast
 * are mocked; the inline form is driven with real fireEvent input.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const useQuery = vi.fn()
const createTpl = vi.fn()
const updateTpl = vi.fn()
const deleteTpl = vi.fn()
const refetch = vi.fn().mockResolvedValue({})

// The component calls useMutation three times per render, in this order:
// create, update, delete. Resolve by per-render call position so every render
// (not just the first) wires the right fn.
let mutationCallIndex = 0
const mutationFns = [createTpl, updateTpl, deleteTpl]
vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  useMutation: () => {
    const fn = mutationFns[mutationCallIndex % 3]
    mutationCallIndex += 1
    return [fn]
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import { TemplateManager } from '@/components/messaging/TemplateManager'

const TEMPLATE = { id: 't1', name: 'Welcome', body: 'Hi {{first_name}}', isActive: true }

// The inline form's Label has no htmlFor, so query by role/tag: the Name field
// is the lone <input> and the Body field is the lone <textarea> in the form.
function nameInput() {
  return document.querySelector(
    'input[data-slot="input"]'
  ) as HTMLInputElement
}
function bodyInput() {
  return document.querySelector('textarea') as HTMLTextAreaElement
}

beforeEach(() => {
  vi.clearAllMocks()
  mutationCallIndex = 0
  refetch.mockResolvedValue({})
  useQuery.mockReturnValue({ data: { messageTemplates: [TEMPLATE] }, refetch })
})

describe('TemplateManager', () => {
  it('lists templates with name, body, and active badge', () => {
    render(<TemplateManager />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Hi {{first_name}}')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('1 template(s)')).toBeInTheDocument()
  })

  it('shows the empty state when there are no templates', () => {
    useQuery.mockReturnValue({ data: { messageTemplates: [] }, refetch })
    render(<TemplateManager />)
    expect(screen.getByText(/No templates yet/i)).toBeInTheDocument()
  })

  it('opens the create form and submits a new template', async () => {
    createTpl.mockResolvedValue({
      data: { createMessageTemplate: { success: true, message: 'Created', template: TEMPLATE } },
    })
    render(<TemplateManager />)

    fireEvent.click(screen.getByText('New Template'))
    fireEvent.change(nameInput(), { target: { value: 'Reminder' } })
    fireEvent.change(bodyInput(), { target: { value: 'Pay up' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(createTpl).toHaveBeenCalled())
    expect(createTpl.mock.calls[0][0].variables).toEqual({ name: 'Reminder', body: 'Pay up' })
    expect(toastSuccess).toHaveBeenCalledWith('Created')
    expect(refetch).toHaveBeenCalled()
  })

  it('disables Save until both name and body are filled', () => {
    render(<TemplateManager />)
    fireEvent.click(screen.getByText('New Template'))
    const save = screen.getByText('Save')
    expect(save).toBeDisabled()
    fireEvent.change(nameInput(), { target: { value: 'X' } })
    expect(save).toBeDisabled()
    fireEvent.change(bodyInput(), { target: { value: 'Y' } })
    expect(save).not.toBeDisabled()
  })

  it('toasts an error when create fails', async () => {
    createTpl.mockResolvedValue({
      data: { createMessageTemplate: { success: false, message: 'Name taken', template: null } },
    })
    render(<TemplateManager />)
    fireEvent.click(screen.getByText('New Template'))
    fireEvent.change(nameInput(), { target: { value: 'Dup' } })
    fireEvent.change(bodyInput(), { target: { value: 'b' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Name taken'))
  })

  it('toggles a template active state', async () => {
    updateTpl.mockResolvedValue({
      data: { updateMessageTemplate: { success: true, message: 'ok', template: TEMPLATE } },
    })
    render(<TemplateManager />)
    fireEvent.click(screen.getByTitle('Deactivate'))
    await waitFor(() => expect(updateTpl).toHaveBeenCalled())
    expect(updateTpl.mock.calls[0][0].variables).toEqual({ templateId: 't1', isActive: false })
    expect(refetch).toHaveBeenCalled()
  })

  it('confirms before deleting and refetches on success', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteTpl.mockResolvedValue({
      data: { deleteMessageTemplate: { success: true, message: 'Deleted' } },
    })
    render(<TemplateManager />)
    fireEvent.click(screen.getByTitle('Delete'))
    await waitFor(() => expect(deleteTpl).toHaveBeenCalled())
    expect(toastSuccess).toHaveBeenCalledWith('Deleted')
    confirmSpy.mockRestore()
  })

  it('does not delete when the confirm dialog is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TemplateManager />)
    fireEvent.click(screen.getByTitle('Delete'))
    expect(deleteTpl).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('enters edit mode pre-filled with the template values', () => {
    render(<TemplateManager />)
    fireEvent.click(screen.getByTitle('Edit'))
    expect((nameInput() as HTMLInputElement).value).toBe('Welcome')
    expect((bodyInput() as HTMLTextAreaElement).value).toBe('Hi {{first_name}}')
  })
})
