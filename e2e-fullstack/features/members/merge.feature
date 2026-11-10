Feature: Merging two records of the same person loses nothing
  A treasurer (or an admin) merges a Pay Bill payer into a member, starting
  from the member's row menu on the Members page (Merge…) and entering the
  duplicate's phone number. Every gift moves, the old number keeps crediting the
  member, and Undo hands everything back (ADR-0014, F3).

  Background:
    Given the church is set up with its departments and people

  Scenario: A treasurer merges by phone numbers, then undoes it
    Given a second number of the member pays 2000 to "TITHE" and 600 to "OFFER" by Pay Bill as "MARY"
    And the member pays 3000 to "TITHE" by Pay Bill from the member's own number
    And I am signed in as the treasurer
    When I choose Merge… on the member's row and merge in the second number's record, giving the reason "Same person, second SIM"
    Then the member has given 5600 in total
    When the second number pays 500 to "TITHE" by Pay Bill
    Then the member has given 6100 in total
    When I open Members, then Recent merges, and undo that merge because "Different people"
    Then the member has given 3000 in total
    And the second number's record has given 3100 in total

  Scenario: Merging is in the Members menu for a treasurer, not for a pastor
    Given I am signed in as the treasurer
    When I open the Members menu in the sidebar
    Then I see "Merge duplicates" and "Recent merges" in it
    When I sign in as the pastor and open the Members menu in the sidebar
    Then I do not see "Merge duplicates" in it
