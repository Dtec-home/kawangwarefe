@parity
Feature: Multi-category contribution
  A member gives to several categories in a single M-Pesa payment, and the
  resulting contributions are grouped under one payment.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: Giving to two categories is accepted with the combined total
    Given a contribution category "Tithe" is available
    And a contribution category "Offering" is available
    And the giver's phone number is "254712345678"
    When the giver contributes the following in one payment:
      | category | amount |
      | Tithe    | 1000   |
      | Offering | 500    |
    Then the combined payment of "1500" is accepted
    And 2 contributions are grouped under one payment
