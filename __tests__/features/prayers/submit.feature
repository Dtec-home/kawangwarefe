@parity
Feature: Submit a prayer request
  A member submits a prayer request with a title and a body. A request without a
  title is rejected.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A member submits a prayer request
    Given a prayer request titled "Healing" with body "Please pray for my family"
    When the prayer request is submitted
    Then the prayer request is accepted

  Scenario: A prayer request without a title is rejected
    Given a prayer request with a blank title and body "Please pray for my family"
    When the prayer request is submitted
    Then the prayer request is rejected
