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

  Scenario: Staff draft a new campaign
    Given departments "Building Fund" and "Youth" are active
    When they start a new campaign
    And they fill in title "Church Building", department "Building Fund", target "1000000" and code "build"
    And they save the campaign
    Then the campaign is created as a draft with code "BUILD" and the default reminders
    And they are told "Campaign saved as a draft"
    And they are taken to the campaign page

  Scenario: A department admin can only start campaigns for their own department
    Given a department admin for "Youth"
    And departments "Building Fund" and "Youth" are active
    When they start a new campaign
    Then the department choices are only "Youth"

  Scenario: The Pay Bill code must be 2 to 10 capital letters or digits
    Given departments "Building Fund" and "Youth" are active
    When they start a new campaign
    And they fill in title "Church Building", department "Building Fund", target "1000000" and code "B"
    And they save the campaign
    Then they are told "Use 2 to 10 capital letters or digits, e.g. BUILD"

  Scenario: The end date cannot be before the start date
    Given departments "Building Fund" and "Youth" are active
    When they start a new campaign
    And they fill in title "Church Building", department "Building Fund", target "1000000" and code "BUILD"
    And they set the dates from "2026-12-01" to "2026-11-01"
    And they save the campaign
    Then they are told "The end date cannot be before the start date"

  Scenario: The server refuses a code that is already in use
    Given departments "Building Fund" and "Youth" are active
    And the code "TITHE" is already used by a department
    When they start a new campaign
    And they fill in title "Tithe Drive", department "Building Fund", target "5000" and code "tithe"
    And they save the campaign
    Then they are told "Code TITHE is already used by a department"
    And they stay on the new campaign form

  Scenario: Staff see a campaign's details and how to give
    Given an active campaign "Church Building" with code "BUILD" that has "KES 100,000.00" pledged
    When they open the campaign overview
    Then they see "Church Building" marked "Active"
    And they see the giving instructions "Pay Bill 247247, Account BUILD"
    And they see "KES 100,000.00 pledged"
    And they can copy the public link

  Scenario: The creator submits a draft for approval
    Given a draft campaign "Church Building" they created
    When they open the campaign overview
    And they choose "Submit for approval"
    Then they are told "Submitted for approval"
    And the campaign is marked "Awaiting approval"

  Scenario: The creator cannot approve their own campaign
    Given a campaign "Church Building" awaiting approval that they created
    When they open the campaign overview
    Then no approve action is offered
    And they are told another admin or pastor must approve it

  Scenario: Another admin approves the campaign
    Given a campaign "Church Building" awaiting approval that someone else created
    When they open the campaign overview
    And they choose "Approve"
    Then they are told "Campaign approved"
    And the campaign is marked "Active"

  Scenario: An approver returns a campaign to draft with a reason
    Given a campaign "Church Building" awaiting approval that someone else created
    When they open the campaign overview
    And they return it to draft with reason "Target needs board sign-off"
    Then the campaign was returned with reason "Target needs board sign-off"
    And the campaign is marked "Draft"

  Scenario: Staff pause and resume an active campaign
    Given an active campaign "Church Building" with code "BUILD" that has "KES 0.00" pledged
    When they open the campaign overview
    And they choose "Pause"
    Then the campaign is marked "Paused"
    And they choose "Resume"
    And the campaign is marked "Active"

  Scenario: Staff edit a campaign
    Given a draft campaign "Church Building" they created
    When they open the campaign overview
    And they choose "Edit"
    And they change the title to "New Sanctuary"
    And they choose "Save changes"
    Then they are told "Campaign updated"
    And they see "New Sanctuary" marked "Draft"

  Scenario: The server refuses an action
    Given a draft campaign "Church Building" they created
    And the server refuses with "Add an end date before submitting"
    When they open the campaign overview
    And they choose "Submit for approval"
    Then they are told "Add an end date before submitting"
    And the campaign is marked "Draft"
