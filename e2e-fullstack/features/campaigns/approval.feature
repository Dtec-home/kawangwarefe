Feature: Creating a campaign and the four-eyes approval
  Staff draft a campaign and submit it. Before it goes public, an admin or
  pastor who did not create it must approve it (decision 2).

  Background:
    Given the church is set up with its departments and people

  Scenario: A treasurer drafts and submits a campaign, and the pastor approves it
    Given I am signed in as the treasurer
    When I draft the campaign "Church Roof 2026" for "Building Fund" with code "ROOF" and a target of 500000 in the campaign form
    Then the campaign overview shows the status "Draft"
    When I submit the campaign for approval
    Then the campaign overview shows the status "Awaiting approval"
    And the campaign overview explains the four-eyes rule
    And the campaign overview offers no way to approve it
    When the pastor signs in and approves the campaign "Church Roof 2026"
    Then the campaign overview shows the status "Active"
    And the campaign overview says it was approved by "Paul Pastor"
    And no request left the machine

  Scenario: An admin who created a campaign cannot approve it, even though admins approve
    Given the admin has drafted and submitted the campaign "Mission Van" with code "VAN"
    And I am signed in as the admin
    When I open the admin page of the campaign "Mission Van"
    Then the campaign overview shows the status "Awaiting approval"
    And the campaign overview explains the four-eyes rule
    And the campaign overview offers no way to approve it
    And the backend refuses the admin's approval of "Mission Van" with the four-eyes message
    And no request left the machine
