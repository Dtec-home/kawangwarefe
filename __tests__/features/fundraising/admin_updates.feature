Feature: Campaign updates
  Staff keep givers in the loop with short news posts on a campaign: progress
  photos, milestones, thank-yous. Updates show on the public campaign page and,
  when staff choose, are also sent by SMS to everyone who has given.

  Scenario: Staff see the campaign's updates, newest first
    Given the campaign has an update "Foundation poured" posted by "Jane Wanjiku" on "2026-10-01"
    And the campaign has an update "Roof is on" posted by "Peter Otieno" on "2026-10-15" that was sent by SMS
    When they open the updates tab
    Then the updates are listed as "Roof is on", "Foundation poured"
    And "Roof is on" is marked as sent by SMS
    And "Foundation poured" is not marked as sent by SMS
    And "Foundation poured" shows it was posted by "Jane Wanjiku"

  Scenario: A campaign with no updates invites staff to post one
    Given the campaign has no updates
    When they open the updates tab
    Then they are told there are no updates yet

  Scenario: Staff post an update without SMS
    Given the campaign has no updates
    When they open the updates tab
    And they write an update titled "Walls are up" saying "Thank you all. The walls are finished."
    And they post the update
    Then the update is posted with title "Walls are up" and no SMS
    And they are told "Update posted"
    And the updates are listed as "Walls are up"

  Scenario: Staff post an update and SMS everyone who has given
    Given the campaign has no updates
    When they open the updates tab
    And they write an update titled "Final push" saying "We are 90% there."
    And they choose to also SMS everyone who has given
    And they post the update
    Then the update is posted with title "Final push" and an SMS to donors
    And they are told "Update posted and SMS queued"

  Scenario: The server refuses an update
    Given the campaign has no updates
    And the server will refuse with "Only staff can post updates"
    When they open the updates tab
    And they write an update titled "Walls are up" saying "Done."
    And they post the update
    Then they are told "Only staff can post updates"

  Scenario: Staff remove an update after confirming
    Given the campaign has an update "Foundation poured" posted by "Jane Wanjiku" on "2026-10-01"
    When they open the updates tab
    And they remove "Foundation poured"
    And they confirm the removal
    Then they are told "Update removed"
    And they are told there are no updates yet
