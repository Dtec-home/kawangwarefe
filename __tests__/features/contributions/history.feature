@parity
Feature: Contribution history
  A member reviews the contributions they have made.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A member with contributions sees them listed
    Given a member with phone "254712345678" has 2 completed contributions
    When the member views their contribution history
    Then 2 contributions are shown

  Scenario: A member with no contributions sees an empty history
    Given a member with phone "254700000000" has no contributions
    When the member views their contribution history
    Then no contributions are shown
