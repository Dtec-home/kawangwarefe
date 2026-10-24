Feature: A department admin creates campaigns for their own department only
  Category admins may draft campaigns for their own departments (decision 2).

  Background:
    Given the church is set up with its departments and people

  Scenario: The Building Fund admin drafts a Building Fund campaign
    Given I am signed in as the dept_admin
    When I open the new campaign form
    Then the campaign form offers only the department "Building Fund"
    When I draft the campaign "New Hall Floor" for "Building Fund" with code "FLOOR" and a target of 200000 in the campaign form
    Then the campaign overview shows the status "Draft"
    And the backend refuses the dept_admin a "Welfare" campaign
    And no request left the machine
