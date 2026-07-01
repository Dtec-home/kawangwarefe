@parity
Feature: Family dependents
  An adult member acts as a guardian and may add children as dependents. Added
  children appear in the guardian's list of dependents. A child must be given a
  valid name.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A guardian adds a child and sees them as a dependent
    Given an adult member who is a guardian
    When they add a child named "Baby" "Otieno"
    Then the child is added
    And the guardian has 1 dependent

  Scenario: A child cannot be added without a name
    Given an adult member who is a guardian
    When they add a child with a blank first name
    Then adding the child is rejected
