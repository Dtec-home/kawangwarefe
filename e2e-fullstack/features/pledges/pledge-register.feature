Feature: The treasurer keeps the pledge register
  Pledges written on paper cards are copied into the register (a new giver
  is found or added by phone), and the register is filtered, totalled and
  exported to Excel and PDF.

  Background:
    Given the church is set up with its departments and people
    And the "Church Roof" campaign with Pay Bill code "ROOF" is taking pledges
    And the "Youth Bus" campaign with Pay Bill code "BUS" is taking pledges
    And "Mary Wanjiku" has pledged KES 4000 to the "Church Roof" campaign
    And "John Kamau" has pledged KES 1500 to the "Youth Bus" campaign

  Scenario: The treasurer records a pledge card for a new giver, filters the register and exports it
    Given I am signed in as the treasurer
    When I open the pledge register
    And I record a pledge card for new giver "Peter Otieno" on phone "0722333444" pledging KES 3000 to the "Church Roof" campaign
    Then the pledge register lists "Peter Otieno" pledging "KES 3,000.00" to "Church Roof" from "Pledge card"
    And the pledge register lists "Mary Wanjiku" pledging "KES 4,000.00" to "Church Roof" from "Online"
    And the pledge register totals show pledged "KES 8,500.00", paid "KES 0.00", outstanding "KES 8,500.00" and 3 pledges
    When I filter the pledge register to the "Church Roof" campaign
    Then the pledge register lists only "Mary Wanjiku and Peter Otieno"
    And the pledge register totals show pledged "KES 7,000.00", paid "KES 0.00", outstanding "KES 7,000.00" and 2 pledges
    When I export the pledge register as "Export Excel" and get a file ending in ".xlsx"
    And I export the pledge register as "Export PDF" and get a file ending in ".pdf"
    When I search the pledge register for "Otieno"
    Then the pledge register lists only "Peter Otieno"
    When I reset the pledge register filters
    Then the pledge register lists only "Mary Wanjiku, John Kamau and Peter Otieno"
    When I filter the pledge register by status "Fulfilled"
    Then the pledge register says no pledges match
    When I reset the pledge register filters
    And I export the pledge register as "Export Excel" and get a file ending in ".xlsx"
    Then no request left the machine
