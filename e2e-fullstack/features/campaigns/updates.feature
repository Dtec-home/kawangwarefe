Feature: Campaign updates, and texting everyone who has given
  Staff post news on the campaign page. They can also SMS everyone who has
  given: one SMS per donor, however many times they gave.

  Background:
    Given the church is set up with its departments and people
    And the campaign "Church Roof 2026" with code "ROOF" has been approved
    And the member has given KES 500 to "Church Roof 2026" by M-Pesa prompt
    And the member has given KES 700 to "Church Roof 2026" by M-Pesa prompt
    And the member2 has given KES 1000 to "Church Roof 2026" by M-Pesa prompt

  Scenario: Staff post an update and SMS every donor once
    Given I am signed in as the treasurer
    When I open the "Updates" tab of the campaign "Church Roof 2026"
    And I post the campaign update "The roof is on" saying "Thank you all. The iron sheets are up." and also SMS everyone who has given
    Then the public page of "Church Roof 2026" shows the update "The roof is on" saying "Thank you all. The iron sheets are up."
    And the member gets exactly one SMS about the campaign update "The roof is on"
    And the member2 gets exactly one SMS about the campaign update "The roof is on"
    And nobody who has not given gets an SMS about the campaign update "The roof is on"
    And no request left the machine
