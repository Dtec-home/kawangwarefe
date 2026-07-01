@parity
Feature: M-Pesa STK payment lifecycle
  After a giver submits a contribution the payment stays pending until M-Pesa
  confirms it. The giver (or the app polling on their behalf) checks the payment
  status, which becomes completed on a successful callback and failed when the
  payment is cancelled. An unknown checkout request id is reported as not found.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A submitted payment is pending until M-Pesa confirms it
    Given an M-Pesa STK payment has been initiated
    When the payment status is checked before any callback
    Then the payment status is "pending"

  Scenario: A successful M-Pesa callback completes the payment
    Given an M-Pesa STK payment has been initiated
    When the M-Pesa payment is confirmed successful
    And the payment status is checked
    Then the payment status is "completed"

  Scenario: A cancelled M-Pesa payment is marked failed
    Given an M-Pesa STK payment has been initiated
    When the M-Pesa payment is cancelled
    And the payment status is checked
    Then the payment status is "failed"

  Scenario: An unknown checkout request id is not found
    When the payment status is checked for an unknown checkout request id
    Then the payment status is "not_found"
