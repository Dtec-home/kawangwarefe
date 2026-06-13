@parity
Feature: Admin manual contribution entry
  An administrator records a cash or envelope contribution on a member's behalf.
  An entry below the minimum amount is rejected.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: An administrator records a cash contribution for a member
    Given a contribution category "Tithe" with code "TITHE"
    And a member exists with phone "254712345678"
    When the administrator records a manual contribution of "5000" to "Tithe" for "254712345678"
    Then the manual contribution is recorded as "completed"

  Scenario: A manual contribution below the minimum amount is rejected
    Given a contribution category "Tithe" with code "TITHE"
    When the administrator records a manual contribution of "0.50" to "Tithe" for "254712345678"
    Then the manual contribution is rejected
