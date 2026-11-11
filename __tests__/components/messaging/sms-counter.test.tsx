/**
 * SmsCounter: the live one-SMS counter shown under every staff SMS composer.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { SmsCounter, fitsOneSms } from '@/components/messaging/SmsCounter'

describe('SmsCounter', () => {
  it('shows length/160 for plain text', () => {
    render(<SmsCounter text={'a'.repeat(118)} />)
    expect(screen.getByTestId('sms-counter')).toHaveTextContent('118/160 characters (one SMS)')
    expect(screen.queryByTestId('sms-counter-non-gsm')).toBeNull()
    expect(screen.queryByTestId('sms-counter-over')).toBeNull()
  })

  it('switches to the 70 limit and names the non-GSM character', () => {
    render(<SmsCounter text={'Kawangware – Sabbath'} />)
    expect(screen.getByTestId('sms-counter')).toHaveTextContent('20/70 characters')
    expect(screen.getByTestId('sms-counter-non-gsm')).toHaveTextContent(
      '"–" is not a standard SMS character, so this SMS can only be 70 characters'
    )
  })

  it('says how much to cut when over one SMS', () => {
    render(<SmsCounter text={'a'.repeat(163)} />)
    expect(screen.getByTestId('sms-counter')).toHaveTextContent('163/160 characters, more than one SMS')
    expect(screen.getByTestId('sms-counter-over')).toHaveTextContent('Shorten it by 3 characters')
  })

  it('explains token counting', () => {
    render(<SmsCounter text="Dear {{first_name}}" />)
    expect(screen.getByTestId('sms-counter')).toHaveTextContent('17/160')
    expect(screen.getByText(/Names are counted at their longest/)).toBeInTheDocument()
  })

  it('counts against a lower limit when given', () => {
    render(<SmsCounter text={'a'.repeat(60)} limit={57} />)
    expect(screen.getByTestId('sms-counter')).toHaveTextContent('60/57 characters, more than one SMS')
  })
})

describe('fitsOneSms', () => {
  it('applies the encoding limit and an optional lower limit', () => {
    expect(fitsOneSms('a'.repeat(160))).toBe(true)
    expect(fitsOneSms('a'.repeat(161))).toBe(false)
    expect(fitsOneSms('’' + 'a'.repeat(70))).toBe(false)
    expect(fitsOneSms('a'.repeat(58), 57)).toBe(false)
    expect(fitsOneSms('a'.repeat(57), 57)).toBe(true)
  })
})
