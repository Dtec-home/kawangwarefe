Feature: A member with two phone numbers
  Any of a member's numbers signs them in and credits their giving (MP-1, MP-2).

  Background:
    Given the church is set up with its departments and people

  Scenario: Mary adds a second number, gives from it and signs in with it
    Given I am signed in as the member
    When I add a second number from my profile with the code sent to it
    Then my profile lists the second number
    When the second number pays 700 to "TITHE" by Pay Bill as "MARY"
    Then the 700 is Mary Wanjiku's and no new member was created
    When I sign in again with the second number
    Then I am signed in as Mary Wanjiku
