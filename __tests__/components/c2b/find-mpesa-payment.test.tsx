/** FindMpesaPayment (W1, F1): staff fetch a reported payment by its M-Pesa code. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

import { FindMpesaPayment, isMpesaCode } from '@/components/c2b/find-mpesa-payment'
import { FIND_MPESA_PAYMENT, MPESA_STATUS_QUERIES } from '@/lib/graphql/payment-recovery'

const lookups = (items: unknown[]) => ({
  request: { query: MPESA_STATUS_QUERIES, variables: { limit: 10 } },
  result: { data: { mpesaStatusQueries: items } },
})
const find = (code: string, result: { success: boolean; message: string; status: string }) => ({
  request: { query: FIND_MPESA_PAYMENT, variables: { code } },
  result: { data: { findMpesaPayment: { __typename: 'FindPaymentResponse', ...result } } },
})
const q = (transId: string, status: string, resultDesc = '') => ({
  __typename: 'MpesaStatusQueryType', transId, status, resultDesc, createdAt: '2026-11-09T18:00:00Z',
})

describe('isMpesaCode', () => {
  it('accepts 10 letters and digits, any case and spacing', () => {
    expect(isMpesaCode('UK35C0RVDD')).toBe(true)
    expect(isMpesaCode(' uk35c0rvdd ')).toBe(true)
    expect(isMpesaCode('UK35C0RVD')).toBe(false)
    expect(isMpesaCode('UK35-0RVDD')).toBe(false)
  })
})

describe('FindMpesaPayment', () => {
  const open = () => fireEvent.click(screen.getByRole('button', { name: /Find payment by M-Pesa code/ }))

  it('asks Safaricom for an upper-cased code and shows the answer', async () => {
    const onFound = vi.fn()
    render(<MockedProvider mocks={[lookups([]), find('UK35C0RVDD', {
      success: true, status: 'requested', message: 'Asked Safaricom about UK35C0RVDD.' }), lookups([q('UK35C0RVDD', 'requested')])]}>
      <FindMpesaPayment onFound={onFound} /></MockedProvider>)
    open()
    fireEvent.change(screen.getByLabelText('M-Pesa code'), { target: { value: 'uk35c0rvdd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find' }))
    expect(await screen.findByText('Asked Safaricom about UK35C0RVDD.')).toBeInTheDocument()
    expect(onFound).toHaveBeenCalled()
  })

  it('will not send something that is not an M-Pesa code', () => {
    render(<MockedProvider mocks={[lookups([])]}><FindMpesaPayment /></MockedProvider>)
    open()
    fireEvent.change(screen.getByLabelText('M-Pesa code'), { target: { value: '12345' } })
    expect(screen.getByRole('button', { name: 'Find' })).toBeDisabled()
  })

  it('shows a refusal as an error', async () => {
    render(<MockedProvider mocks={[lookups([]), find('UK35C0RVDD', {
      success: false, status: 'failed', message: 'Could not reach Safaricom for UK35C0RVDD: timeout. Try again shortly.' })]}>
      <FindMpesaPayment /></MockedProvider>)
    open()
    fireEvent.change(screen.getByLabelText('M-Pesa code'), { target: { value: 'UK35C0RVDD' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach Safaricom')
  })

  it('lists recent lookups with a readable outcome', async () => {
    render(<MockedProvider mocks={[lookups([q('AB12CD34EF', 'recorded'), q('ZZ99YY88XX', 'not_ours')])]}>
      <FindMpesaPayment /></MockedProvider>)
    open()
    expect(await screen.findByText('AB12CD34EF')).toBeInTheDocument()
    expect(screen.getByText('Found and recorded')).toBeInTheDocument()
    expect(screen.getByText('Paid to another business')).toBeInTheDocument()
  })
})
