Feature: A champion's own dashboard
  A champion sees who gave through them, by name and amount (decision 4),
  with their personal link and Pay Bill account to share. Nobody else can
  open their dashboard.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"
    And staff have made the member2 champion "JOHN" of the Pay Bill campaign
    And the member sends KES 1000 from the M-Pesa menu to Pay Bill account "ROOF JOHN"
    And a visitor on "254711300001" named "Peterson" sends KES 600 from the M-Pesa menu to Pay Bill account "ROOF-JOHN"
    And staff see KES 1600 raised through champion "JOHN" from 2 donors

  Scenario: The champion sees their donors' names and amounts and their share kit
    When the member2 signs in to look after champions
    And they open their champion page for the Pay Bill campaign
    Then the champion dashboard shows "KES 1,600.00" raised from 2 donors
    And the champion dashboard lists these donors:
      | name         | amount       |
      | Mary Wanjiku | KES 1,000.00 |
      | Peterson     | KES 600.00   |
    And the champion's share kit links to their page "/c/JOHN"
    And the champion's share kit Pay Bill line ends with "Account ROOF JOHN"
    And no request left the machine

  Scenario: Another member cannot open the champion's dashboard
    When the member signs in to look after champions
    And they open champion "JOHN"'s dashboard by its link
    Then the champion dashboard stays closed to them, showing no donors
    And no request left the machine

  # Was @fixme (E2E-C REQUEST 1): fixed in ChampionDashboardView, which now
  # reads the server's refusal as "not found".
  Scenario: Another member is told the champion page was not found
    When the member signs in to look after champions
    And they open champion "JOHN"'s dashboard by its link
    Then they are told the champion page was not found
