Feature: Admin campaigns
  Staff and department admins run fundraising campaigns: a drive with a target,
  dates and its own Pay Bill account code. A campaign starts as a draft, is
  submitted, and goes live only when an admin or pastor who did not create it
  approves it (four-eyes rule). The backend re-checks every permission.

  Scenario: Staff see every campaign with its progress
    Given campaign "Church Building" with code "BUILD" in "Building Fund" has raised "250000.00" of "1000000.00"
    When they open the campaign list
    Then the list shows "Church Building" with code "BUILD" in "Building Fund"
    And "Church Building" shows "KES 250,000.00" raised of "KES 1,000,000.00"
    And "Church Building" links to its campaign page

  Scenario: Staff filter the campaign list by status and search
    Given campaign "Church Building" with code "BUILD" in "Building Fund" has raised "250000.00" of "1000000.00"
    And a draft campaign "Youth Camp" with code "CAMP" in "Youth"
    When they open the campaign list
    And they show only "Draft" campaigns
    And they search for "camp"
    Then the list shows "Youth Camp" with code "CAMP" in "Youth"
    And the list does not show "Church Building"

  Scenario: An empty list invites staff to start a campaign
    Given there are no campaigns
    When they open the campaign list
    Then they are told there are no campaigns yet
    And they can start a new campaign
