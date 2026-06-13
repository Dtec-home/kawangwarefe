@parity
Feature: Admin prayer moderation
  A staff administrator may change the status of a prayer request and see every
  request. A non-staff member may not moderate, and sees the request unchanged.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A staff administrator marks a prayer request as answered
    Given an open prayer request titled "Healing"
    And a staff administrator
    When the administrator marks the prayer request as "answered"
    Then the prayer request status is "answered"

  Scenario: A non-staff member cannot moderate prayer requests
    Given an open prayer request titled "Healing"
    And a non-staff member
    When the member tries to mark the prayer request as "answered"
    Then the moderation is rejected
    And the prayer request status remains "open"

  Scenario: A staff administrator sees every prayer request
    Given an open prayer request titled "Healing"
    And a private prayer request titled "Personal Matter"
    And a staff administrator
    When the administrator lists prayer requests
    Then 2 prayer requests are listed
