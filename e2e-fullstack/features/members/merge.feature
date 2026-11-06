Feature: Merging duplicate members loses nothing
  An admin merges a Pay Bill guest into a known member. All gifts and receipts
  follow. The duplicate's number keeps crediting the survivor. An undo
  hands everything back, including money that arrived after the merge.

  Background:
    Given the church is set up with its departments and people

  Scenario: Merge, pay from the old number, then undo
    Given a guest "JANE WANJIKU" paid 2000 to "TITHE" and 600 to "OFFER" from a new number
    And "Mary Wanjiku" has given 3000 to "TITHE"
    And "Mary Wanjiku" has pledged 10000 to "Building Fund"
    And I am signed in as the admin
    When the admin opens the merge page and picks the guest as duplicate and "Mary Wanjiku" as survivor
    Then the preview shows 2 contributions and 2 receipts moving
    And the preview shows the combined total as "KES 5,600"
    When the admin merges after typing the reason "Same person, second SIM" and the name "Mary Wanjiku"
    Then "Mary Wanjiku" now has 3 completed gifts totalling 5600
    And the survivor's receipt list shows receipts with the guest's original amounts
    And the guest is shown as merged in the admin members list

    When another Pay Bill payment of 500 arrives from the guest's number
    Then the 500 belongs to "Mary Wanjiku"

    When the admin undoes the merge with reason "Different people"
    Then the undo preview listed the post-merge 500 as going back
    And the guest is restored with 3100 given
    And "Mary Wanjiku" has 3000 given
    And the guest's number no longer credits "Mary Wanjiku"
