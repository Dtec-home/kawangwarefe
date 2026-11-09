Feature: The daily campaign total on WhatsApp
  ADR-0015: staff share or post the day's total by hand (no names), the
  23:50 job posts it once to the campaign's group, and the card says how the
  last automatic post went.

  Background:
    Given the church is set up with its departments and people
    And the campaign "Shamba Land" with code "SHAMBA" and WhatsApp group "120363000000000001@g.us" has been approved
    And the member2 has given KES 2000 to "Shamba Land" by M-Pesa prompt
    And the member has given KES 500 to "Shamba Land" by M-Pesa prompt

  Scenario: A treasurer posts the daily total, and the evening job posts it once
    Given I am signed in as the treasurer
    When I open the "Share list" tab of the campaign "Shamba Land"
    Then the daily total preview says "KES 2,500 from 2 givers" without naming anyone
    When I post the daily total to the group now
    Then I am told "Posted to the WhatsApp group."
    And the WhatsApp group "120363000000000001@g.us" has 1 post saying "KES 2,500 from 2 givers"
    When I post the daily total to the group now
    Then I am told to wait before posting again
    When the 23:50 daily total job runs twice
    Then the WhatsApp group "120363000000000001@g.us" has 2 posts saying "KES 2,500 from 2 givers"
    When I open the "Share list" tab of the campaign "Shamba Land"
    Then the daily total card says the last automatic post was sent
    And no request left the machine
