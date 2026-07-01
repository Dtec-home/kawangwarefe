import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUpload } from '@/components/admin/file-upload'

describe('FileUpload', () => {
  it('renders upload area when no file selected', () => {
    render(<FileUpload onFileSelect={vi.fn()} />)
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()
  })

  it('shows accepted formats', () => {
    render(<FileUpload onFileSelect={vi.fn()} accept=".csv,.xlsx" maxSize={10} />)
    expect(screen.getByText(/Accepted formats: .csv,.xlsx/)).toBeInTheDocument()
    expect(screen.getByText(/Max 10MB/)).toBeInTheDocument()
  })

  it('shows selected file info', () => {
    const file = new File(['content'], 'data.csv', { type: 'text/csv' })
    render(<FileUpload onFileSelect={vi.fn()} selectedFile={file} />)
    expect(screen.getByText('data.csv')).toBeInTheDocument()
  })

  it('calls onClear when clearing file', () => {
    const onClear = vi.fn()
    const file = new File(['content'], 'data.csv', { type: 'text/csv' })
    render(<FileUpload onFileSelect={vi.fn()} selectedFile={file} onClear={onClear} />)
    // Click the X button to clear
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onClear).toHaveBeenCalled()
  })

  it('shows drag and drop text', () => {
    render(<FileUpload onFileSelect={vi.fn()} />)
    expect(screen.getByText(/Drag and drop/)).toBeInTheDocument()
  })

  it('accepts a valid file via the hidden input', () => {
    const onFileSelect = vi.fn()
    const { container } = render(<FileUpload onFileSelect={onFileSelect} />)
    const input = container.querySelector('#file-upload') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(100)], 'ok.csv', { type: 'text/csv' })] },
    })
    expect(onFileSelect).toHaveBeenCalledOnce()
    expect(onFileSelect.mock.calls[0][0].name).toBe('ok.csv')
  })

  it('rejects a file with a disallowed extension', () => {
    const onFileSelect = vi.fn()
    const { container } = render(<FileUpload onFileSelect={onFileSelect} />)
    const input = container.querySelector('#file-upload') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'evil.exe', { type: 'application/x-msdownload' })] },
    })
    expect(onFileSelect).not.toHaveBeenCalled()
    expect(screen.getByText(/File type must be one of/)).toBeInTheDocument()
  })

  it('rejects a file larger than the max size', () => {
    const onFileSelect = vi.fn()
    const { container } = render(<FileUpload onFileSelect={onFileSelect} maxSize={1} />)
    const input = container.querySelector('#file-upload') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(2 * 1024 * 1024)], 'big.csv', { type: 'text/csv' })] },
    })
    expect(onFileSelect).not.toHaveBeenCalled()
    expect(screen.getByText(/File size must be less than 1MB/)).toBeInTheDocument()
  })

  it('accepts a file dropped onto the dropzone and toggles drag state', () => {
    const onFileSelect = vi.fn()
    const { container } = render(<FileUpload onFileSelect={onFileSelect} />)
    const card = container.querySelector('[data-slot="card"]') as HTMLElement

    fireEvent.dragOver(card)
    expect(screen.getByText('Drop file here')).toBeInTheDocument()

    fireEvent.drop(card, {
      dataTransfer: { files: [new File([new Uint8Array(50)], 'dropped.csv', { type: 'text/csv' })] },
    })
    expect(onFileSelect).toHaveBeenCalledOnce()
  })

  it('clears the dragging highlight on drag leave', () => {
    const { container } = render(<FileUpload onFileSelect={vi.fn()} />)
    const card = container.querySelector('[data-slot="card"]') as HTMLElement
    fireEvent.dragOver(card)
    expect(screen.getByText('Drop file here')).toBeInTheDocument()
    fireEvent.dragLeave(card)
    expect(screen.getByText('Upload File')).toBeInTheDocument()
  })

  it('shows the selected file size in KB', () => {
    const file = new File([new Uint8Array(2048)], 'members.csv', { type: 'text/csv' })
    render(<FileUpload onFileSelect={vi.fn()} selectedFile={file} />)
    expect(screen.getByText('2.00 KB')).toBeInTheDocument()
  })
})
