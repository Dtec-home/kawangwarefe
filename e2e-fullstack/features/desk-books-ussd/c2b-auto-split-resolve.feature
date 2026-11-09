Feature: Resolving a Pay Bill payment to a department that splits automatically
  A treasurer files an unmatched Pay Bill payment to a department whose giving
  is divided across purposes automatically (e.g. Combined Offering -> CKC/LCB).
  They are not asked to pick a purpose or divide the amount (F5).

  Background:
    Given the church is set up with its departments and people
    And "Combined Offering" with code "COMBO" splits giving 60% to "CKC" and 40% to "LCB"

  Scenario: The configured split is applied without dividing by hand
    Given the member pays 50 by Pay Bill with the account "QZX9 unknown"
    And I am signed in as the admin
    When I resolve that payment to "Combined Offering" without choosing a purpose
    Then the member's 50 is filed as 30 to "CKC" and 20 to "LCB" in "COMBO"
