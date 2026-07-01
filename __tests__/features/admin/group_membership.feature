@parity
Feature: Bulk add members to a group
  An admin adds several members to a group at once. Members without a login
  account are given one automatically, members already in the group are left
  untouched, and the admin is told exactly what happened.

  Background:
    Given a group "Complex A" exists
    And an admin is signed in

  Scenario: Adding a mix of new, existing, and account-less members
    Given a member "Ann" who is already in "Complex A"
    And a member "Ben" with a login account, not in "Complex A"
    And a member "Cyn" with no login account, not in "Complex A"
    When the admin bulk-adds Ann, Ben and Cyn to "Complex A"
    Then the result reports 2 added, 1 already a member, 0 skipped
    And Ben is in "Complex A"
    And Cyn is in "Complex A"
    And Cyn now has a login account

  Scenario: Re-running the same add is idempotent
    Given a member "Ben" who is already in "Complex A"
    When the admin bulk-adds Ben to "Complex A"
    Then the result reports 0 added, 1 already a member, 0 skipped
    And the operation still succeeds

  Scenario: Deleted members are rejected, not silently dropped
    Given a soft-deleted member "Del"
    When the admin bulk-adds Del to "Complex A"
    Then the result reports 0 added and "Del" is listed as skipped
