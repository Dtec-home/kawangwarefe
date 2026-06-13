@parity
Feature: Single-category contribution
  A member gives to one contribution category and is prompted to pay via M-Pesa.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A valid contribution is accepted for M-Pesa payment
    Given a contribution category "Tithe" is available
    And the giver's phone number is "254712345678"
    When the giver contributes "1000" to "Tithe"
    Then the contribution is accepted for payment

  Scenario: A contribution below the minimum amount is rejected
    Given a contribution category "Tithe" is available
    And the giver's phone number is "254712345678"
    When the giver contributes "0" to "Tithe"
    Then the contribution is rejected with a minimum-amount error
