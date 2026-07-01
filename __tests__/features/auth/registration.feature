@parity
Feature: Member self-registration
  A new giver may contribute before completing their profile, so they start as a
  guest. They later complete registration by giving their name, after which they
  are no longer a guest. A name that is not valid is rejected.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A new giver completes their profile after giving
    Given a guest member who has not completed their profile
    When they complete registration with first name "Mary" and last name "Wanjiku"
    Then registration succeeds
    And the member is no longer a guest

  Scenario: Registration requires a valid name
    Given a guest member who has not completed their profile
    When they complete registration with first name "M" and last name "Wanjiku"
    Then registration is rejected
