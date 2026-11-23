@web
Feature: Moving money between funds and moving a gift (FT-2, RA-2)
  Plan: DEPARTMENT_REPORTS/03_ADDITIONS_FUNDS_WHATSAPP.md — US-16, US-17, US-18, US-19 (E1, E5–E7).
  A treasurer asks to move money from one department/purpose to another, a
  second treasurer or admin decides, the books show the movement, and a gift
  put in the wrong department is moved from the contributions list.

  Scenario: A treasurer requests a transfer within the available balance (US-16)
    Given the treasurer opens Fund transfers
    And "Youth" holds "KES 8,000.00" today
    When the treasurer asks to move "5000" from "Youth" to "Building Fund" because "Youth surplus to the roof"
    Then the transfer from "Youth" to "Building Fund" is listed as "Requested"

  Scenario: A transfer above the available balance is refused before sending (US-16)
    Given the treasurer opens Fund transfers
    And "Youth" holds "KES 8,000.00" today
    When the treasurer asks to move "9000" from "Youth" to "Building Fund" because "Too much"
    Then the dialog says "The source only holds KES 8,000.00 on that date."
    And no transfer was requested

  Scenario: The requester cannot approve their own transfer (US-17)
    Given the treasurer opens Fund transfers with their own requested transfer
    Then the transfer can be cancelled but not approved or rejected

  Scenario: Another treasurer approves the transfer (US-17)
    Given a second treasurer opens Fund transfers with a requested transfer
    When they approve it
    Then the transfer is listed as "Approved"

  Scenario: Rejecting needs a note (US-17)
    Given a second treasurer opens Fund transfers with a requested transfer
    When they reject it without a note
    Then the dialog says "Say why the transfer is rejected."
    When they reject it with the note "Not this year"
    Then the transfer is listed as "Rejected"

  Scenario: The department report shows the transfers (US-18)
    Given the Building Fund statement has a transfer in from "Youth" of "5000.00" and a transfer out to "Tithe / Mission" of "1000.00"
    Then "Transfer in from Youth" is listed under money in
    And "Transfer out to Tithe / Mission" is listed under money out

  Scenario: The treasurer moves a gift put in the wrong department (US-19)
    Given the treasurer opens "Move gift" on a payment of "1000.00" to "Tithe"
    When the treasurer moves "600" to "Building Fund" and "400" to "Youth"
    And previews the move
    Then the preview shows "Tithe" before and "Building Fund" after
    When the treasurer confirms because "Giver meant Building"
    Then the gift is moved
