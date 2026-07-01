import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption,
} from '@/components/ui/table'

describe('Table components', () => {
  it('renders a complete table with all sub-components', () => {
    render(
      <Table>
        <TableCaption>Test caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )
    expect(screen.getByText('Test caption')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('applies data-slot attributes', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>C</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )
    expect(document.querySelector('[data-slot="table"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="table-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="table-body"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="table-row"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="table-head"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="table-cell"]')).toBeInTheDocument()
  })

  it('wraps table in a scrollable container', () => {
    render(<Table><TableBody><TableRow><TableCell>X</TableCell></TableRow></TableBody></Table>)
    expect(document.querySelector('[data-slot="table-container"]')).toBeInTheDocument()
  })
})
