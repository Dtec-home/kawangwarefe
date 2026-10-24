Feature: Sharing the contributor list to the church WhatsApp group
  Staff share every donor's name and cumulative amount, largest first, with
  one tap to wa.me (decision 7). Every share is recorded.

  Background:
    Given the church is set up with its departments and people
    And the campaign "Church Roof 2026" with code "ROOF" has been approved
    And the member2 has given KES 2000 to "Church Roof 2026" by M-Pesa prompt
    And the member has given KES 500 to "Church Roof 2026" by M-Pesa prompt
    And the member has given KES 2500 to "Church Roof 2026" by M-Pesa prompt

  Scenario: Staff share the list of donors to WhatsApp
    Given I am signed in as the treasurer
    When I open the "Share list" tab of the campaign "Church Roof 2026"
    Then the WhatsApp contributor list shows 2 contributors and KES 5000 given
    And the WhatsApp text lists the donors largest first:
      | rank | name         | amount |
      | 1    | Mary Wanjiku | 3,000  |
      | 2    | John Kamau   | 2,000  |
    When I share the contributor list to WhatsApp
    Then WhatsApp opens with the contributor list ready to send
    And the backend records the share of the contributor list
    And no request left the machine
