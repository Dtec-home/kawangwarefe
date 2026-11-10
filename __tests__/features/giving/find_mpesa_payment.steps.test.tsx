/** Web binding for `giving/find_mpesa_payment.feature` (@web, W1). */
import { defineFeature, loadFeature } from 'jest-cucumber'
import { fireEvent, render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

import { FindMpesaPayment } from '@/components/c2b/find-mpesa-payment'
import { FIND_MPESA_PAYMENT, MPESA_STATUS_QUERIES } from '@/lib/graphql/payment-recovery'

const feature = loadFeature('./find_mpesa_payment.feature', { loadRelativePath: true })

defineFeature(feature, (test) => {
  test('A code is looked up and the answer shown', ({ given, when, then, and }) => {
    given(/^the treasurer opens "(.*)"$/, (name: string) => {
      render(<MockedProvider mocks={[
        { request: { query: MPESA_STATUS_QUERIES, variables: { limit: 10 } }, result: { data: { mpesaStatusQueries: [] } }, maxUsageCount: 5 },
        // Only the upper-cased code is answered: any other variables get no mock.
        { request: { query: FIND_MPESA_PAYMENT, variables: { code: 'UK35C0RVDD' } },
          result: { data: { findMpesaPayment: { __typename: 'FindPaymentResponse', success: true, status: 'requested',
            message: 'Asked Safaricom about UK35C0RVDD.' } } } },
      ]}><FindMpesaPayment /></MockedProvider>)
      fireEvent.click(screen.getByRole('button', { name }))
    })
    when(/^they enter "(.*)" and press Find$/, (code: string) => {
      fireEvent.change(screen.getByLabelText('M-Pesa code'), { target: { value: code } })
      fireEvent.click(screen.getByRole('button', { name: 'Find' }))
    })
    then(/^Safaricom is asked about "(.*)"$/, async (code: string) => {
      expect(await screen.findByRole('status')).toHaveTextContent(code)
    })
    and(/^the answer "(.*)" is shown$/, (message: string) => {
      expect(screen.getByRole('status')).toHaveTextContent(message)
    })
  })
})
