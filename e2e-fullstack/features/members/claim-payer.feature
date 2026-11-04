Feature: Adding a member whose number already gave by Pay Bill
  A Pay Bill payer the church has not identified yet is kept under the hash of
  their number. Adding that person as a member offers the payer's record, and
  using it keeps their earlier gifts on the new member (MP-0).

  Background:
    Given the church is set up with its departments and people

  Scenario: The admin uses the payer's record and the earlier gifts follow
    Given a phone new to the church pays 1500 and then 3000 to "TITHE" by Pay Bill as "RUTH"
    And I am signed in as the admin
    When the admin adds the member "Ruth" "Achieng" with that phone
    Then the admin is offered the Pay Bill record "Ruth" with "KES 4,500" in 2 payments
    When the admin uses that record
    Then the admin sees "'Ruth Achieng' now owns the earlier Pay Bill gifts from this number"
    And the member with that phone is "Ruth Achieng" with 2 gifts totalling 4500
