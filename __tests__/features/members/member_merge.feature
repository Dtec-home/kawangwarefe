@web
Feature: Choosing and confirming a merge
  An admin or treasurer chooses the two people by phone number, sees who each
  is, and confirms the merge with a reason and the survivor's typed name (F3).

  Scenario: Two numbers open the merge preview
    Given the number "0711000001" belongs to "Jane Wanjiku" and "0733000002" to "JANE"
    When I enter "0711000001" to keep and "0733000002" as the duplicate
    Then I see "Jane Wanjiku" kept and "JANE" merged in
    And I can open the preview for keeping "Jane Wanjiku"

  Scenario: Merge needs a reason and the survivor's name
    Given I am confirming a merge into "Jane Wanjiku"
    When I give the reason "Same person" and type "Jane W"
    Then I cannot merge yet
    When I type "Jane Wanjiku"
    Then I can merge
