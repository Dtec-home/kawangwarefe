Feature: Departments that never receive money, and one leader record (R1-R3)
  A department has two switches: "Show in giving" and "Writes a yearly report".
  A department that is not in giving (Elders) is never offered when someone
  chooses where money goes. A department leader's website profile lives on the
  Dept. Admins assignment and is read-only on the Leaders page.

  Scenario: The admin marks Elders as a reporting department that takes no money
    Given the department "Elders" is in giving and writes no yearly report
    When the admin turns off "Show in giving" and turns on "Writes a yearly report" for "Elders"
    Then the department is saved with giving off and the yearly report on

  Scenario: The list shows which departments are not in giving
    Given the department "Elders" is not in giving and writes a yearly report
    When the admin opens the departments page
    Then "Elders" is badged "Not in giving" and "Yearly report"

  Scenario: Elders is not offered on the give page
    Given the departments "Tithe" (in giving) and "Elders" (not in giving)
    When a member opens the give page
    Then the give page asks only for departments that accept giving
    And "Elders" is not offered

  Scenario: The admin sets a leader profile when assigning a department leader
    Given the admin is assigning "Mary Atieno" to "Elders"
    When they fill the leader profile with title "Head Elder" shown on the website
    And they assign the leader
    Then the assignment is saved with that profile

  Scenario: A department leader is read-only on the Leaders page
    Given "John Kamau" is a department leader with a website profile
    When the admin opens the Leaders page
    Then "John Kamau" is marked "Department leader"
    And the row links to "Edit under Dept. Admins" instead of edit and delete
