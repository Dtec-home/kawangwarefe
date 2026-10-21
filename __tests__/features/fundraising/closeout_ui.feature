Feature: Close out a campaign
  When a campaign has done its job, staff close it. A closed campaign stops
  taking gifts and its Pay Bill code goes back to normal department matching.
  Any money left over stays in the campaign's department; nothing is moved.
  After closing, staff see the final statement.

  Scenario: Staff close an active campaign after confirming
    Given an active campaign "New Church Roof" with Pay Bill code "ROOF" in the "Building Fund"
    And the final statement will show 150000.00 in, 120000.00 out and 30000.00 left
    When they open the close-out tab
    Then the campaign status shows "Active"
    When they choose to close the campaign
    Then they are warned "Any money left over stays in Building Fund; nothing is moved."
    And they are warned the campaign stops taking gifts and "ROOF" returns to normal department matching
    When they confirm closing the campaign
    Then the campaign is closed
    And they are told "Campaign closed"
    And the campaign status shows "Closed"
    And the final statement shows "KES 150,000.00" in, "KES 120,000.00" out and "KES 30,000.00" left

  Scenario: A paused campaign can be closed too
    Given a paused campaign "Chairs" with Pay Bill code "CHAIRS" in the "Building Fund"
    When they open the close-out tab
    Then the campaign status shows "Paused"
    And they can close the campaign

  Scenario: Staff change their mind
    Given an active campaign "New Church Roof" with Pay Bill code "ROOF" in the "Building Fund"
    When they open the close-out tab
    And they choose to close the campaign
    And they cancel
    Then the campaign is not closed
    And the campaign status shows "Active"

  Scenario: The server refuses to close the campaign
    Given an active campaign "New Church Roof" with Pay Bill code "ROOF" in the "Building Fund"
    And the server will refuse with "Only an admin or pastor can close a campaign"
    When they open the close-out tab
    And they choose to close the campaign
    And they confirm closing the campaign
    Then they see the message "Only an admin or pastor can close a campaign"
    And the campaign status shows "Active"

  Scenario: A closed campaign shows when it closed and its final statement
    Given a campaign "Old Hall" in the "Building Fund" closed on "2026-09-30"
    And the final statement will show 80000.00 in, 80000.00 out and 0.00 left
    When they open the close-out tab
    Then the campaign status shows "Closed"
    And they see it was closed on "2026-09-30"
    And they cannot close the campaign
    And the final statement shows "KES 80,000.00" in, "KES 80,000.00" out and "KES 0.00" left
    And they see "Stays in Building Fund"

  Scenario: The final statement is refused
    Given a campaign "Old Hall" in the "Building Fund" closed on "2026-09-30"
    And the statement will be refused with "You do not have permission to view this statement"
    When they open the close-out tab
    Then they see the message "You do not have permission to view this statement"

  Scenario: A draft campaign cannot be closed yet
    Given a draft campaign "Bus" with Pay Bill code "BUS" in the "Youth Fund"
    When they open the close-out tab
    Then the campaign status shows "Draft"
    And they cannot close the campaign
    And they see "Only an active or paused campaign can be closed."
