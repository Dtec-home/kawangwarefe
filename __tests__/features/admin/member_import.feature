@parity
Feature: Admin member import
  An administrator bulk-imports members from a CSV file. Valid rows are imported;
  a row missing a required field is reported as an error rather than imported.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: An administrator bulk-imports members from a CSV
    Given a member import file with 2 valid member rows
    When the administrator imports the members
    Then 2 members are imported
    And the import reports no errors

  Scenario: A row missing a required field is reported as an error
    Given a member import file with 1 valid row and 1 row missing the phone number
    When the administrator imports the members
    Then the import reports at least 1 error
    And 1 member is imported
