Feature: The champion leaderboard on the public campaign page
  The campaign page ranks its champions by what they raised, named as
  "First L.", with totals only. Donor names never appear on public pages.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"
    And staff have made the member2 champion "JOHN" of the Pay Bill campaign
    And staff have made the member champion "GRACE" of the Pay Bill campaign

  Scenario: Champions are ranked by what they raised, without donor names
    When a visitor on "254711300001" named "Peterson" sends KES 2000 from the M-Pesa menu to Pay Bill account "ROOF JOHN"
    And a visitor on "254711300002" named "Akinyi" sends KES 3000 from the M-Pesa menu to Pay Bill account "ROOF GRACE"
    And a visitor on "254711300003" named "Barasa" sends KES 500 from the M-Pesa menu to Pay Bill account "ROOF-JOHN"
    Then staff see KES 2500 raised through champion "JOHN" from 2 donors
    And staff see KES 3000 raised through champion "GRACE" from 1 donor
    And the campaign page's champion leaderboard reads:
      | rank | champion   | raised       | donors   |
      | 1    | Mary W.    | KES 3,000.00 | 1 donor  |
      | 2    | John K.    | KES 2,500.00 | 2 donors |
    And no donor name appears on the public campaign or champion pages:
      | Peterson | Akinyi | Barasa |
    And no request left the machine
