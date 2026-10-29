Feature: A campaign that counts all of its department's giving
  A department-backed campaign takes every gift to its department, whichever
  Pay Bill account the giver typed, including the department's past giving
  (ADR-0013). Choosing it after approval needs a second admin or pastor.
  DEPARTMENT_CAMPAIGNS DC-4, plan Appendix B.

  Background:
    Given the church is set up with its departments and people

  Scenario: A treasurer drafts a department-backed campaign; approval brings in the department's past giving
    Given the member sends KES 1500 from the M-Pesa menu to Pay Bill account "BLDG"
    And I am signed in as the treasurer
    When I draft the campaign "Shamba" for "Building Fund" with code "SHAMBA" and a target of 900000 counting all its department's giving
    And I submit the campaign for approval
    And the pastor signs in and approves the campaign "Shamba"
    Then the campaign overview shows the status "Active"
    And the campaign overview says it counts all "Building Fund" giving
    And the campaign overview shows KES 1500 raised
    And no request left the machine

  Scenario: Switching an approved campaign to department counting needs a second approver
    Given the campaign "Roof" with code "ROOF" has been approved
    And the member sends KES 2000 from the M-Pesa menu to Pay Bill account "BLDG"
    And I am signed in as the treasurer
    When I open the admin page of the campaign "Roof"
    And I ask for "Roof" to count all "Building Fund" giving
    Then the counting change waits for a second approver, asked by "Tom Treasurer"
    And the campaign overview offers me no way to approve the counting change
    When the pastor signs in and approves the counting change of "Roof"
    Then the campaign overview says it counts all "Building Fund" giving
    And the campaign overview shows KES 2000 raised
    And no request left the machine

  Scenario: Editing an approved department-backed campaign keeps what it counts
    Given the department-backed campaign "Shamba" with code "SHAMBA" has been approved
    And I am signed in as the treasurer
    When I open the admin page of the campaign "Shamba"
    And I rename the campaign to "Shamba Land" in the campaign form
    Then the campaign form showed the counting choice as read-only
    And the campaign overview says it counts all "Building Fund" giving
    And no request left the machine

  Scenario: A second department-backed campaign cannot go live on the same department
    Given the department-backed campaign "Shamba" with code "SHAMBA" has been approved
    And the department-backed campaign "Shamba Two" with code "SHAMBA2" is awaiting approval
    When the pastor signs in and approves the campaign "Shamba Two"
    Then the pastor is told "Shamba already counts all Building Fund giving"
    And the campaign overview shows the status "Awaiting approval"
    And no request left the machine
