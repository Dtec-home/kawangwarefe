@web
Feature: Adding a member whose number already paid by Pay Bill
  When the number being added already gave by Pay Bill, the admin is offered
  that payer's record instead of an error, and can use it so the new member
  keeps the earlier gifts (MP-0). The backend rules are covered by the
  backend's admin/member_payer_claim.feature.

  Scenario: The admin is offered the payer's record and uses it
    Given Pay Bill payer "RUTH" gave KES 4,500 in 2 payments from "0712345678"
    When the admin adds member "Ruth Achieng" with phone "0712345678"
    Then the admin sees that "0712345678" has already given KES 4,500 in 2 Pay Bill payments as "RUTH"
    When the admin uses that record
    Then the payer record is claimed for "Ruth Achieng" with phone "0712345678"
    And the add member dialog closes

  Scenario: The admin goes back instead
    Given Pay Bill payer "RUTH" gave KES 4,500 in 2 payments from "0712345678"
    When the admin adds member "Ruth Achieng" with phone "0712345678"
    And the admin goes back
    Then the add member form still shows "Ruth"
    And nothing is claimed
