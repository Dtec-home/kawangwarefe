Feature: Giving through a champion
  A gift with the account "<CAMPAIGN> <CHAMPION>" (or a dash between them), or
  from the champion's own page, goes to the campaign and counts for the
  champion. Givers are told the champion sees their name and amount.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"
    And staff have made the member2 champion "JOHN" of the Pay Bill campaign

  Scenario: Pay Bill with the champion code after a space or a dash
    When the member sends KES 1000 from the M-Pesa menu to Pay Bill account "ROOF JOHN"
    Then "member" gets a receipt SMS saying "Towards: Roof Repair 2026" and "Your champion John can see your name and amount."
    When the member sends KES 500 from the M-Pesa menu to Pay Bill account "ROOF-JOHN"
    Then "member" gets a receipt SMS saying "Towards: Roof Repair 2026" and "Your champion John can see your name and amount."
    And staff see KES 1500 raised for the Pay Bill campaign
    And staff see KES 1500 raised through champion "JOHN" from 1 donor
    And no request left the machine

  Scenario: A visitor gives on the champion's page with the M-Pesa prompt
    When a visitor opens champion "JOHN"'s page
    Then the champion page is headed "Raised by John K. for Roof Repair 2026"
    And the champion page tells givers "John can see your name and the amount you give."
    And the champion page shows the Pay Bill account "ROOF JOHN"
    When they give KES 800 through the champion page from "254711222555"
    Then the M-Pesa prompt on "254711222555" is for account "ROOF JOHN"
    When they approve the champion gift's M-Pesa prompt on their phone
    Then "254711222555" gets a receipt SMS saying "Towards: Roof Repair 2026" and "Your champion John can see your name and amount."
    And staff see KES 800 raised for the Pay Bill campaign
    And staff see KES 800 raised through champion "JOHN" from 1 donor
    When a visitor opens champion "JOHN"'s page
    Then the champion page shows "KES 800.00" raised from "1 donor"
    And no request left the machine
