@parity
Feature: Member profile update
  A member updates their own profile — for example, choosing the department they
  belong to. The update succeeds and the chosen department is saved.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A member sets their department
    Given a member with a linked account
    And a department "Choir Fund" exists
    When the member sets their department to "Choir Fund"
    Then the profile update succeeds
    And the member's department is "Choir Fund"
