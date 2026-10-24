Feature: A deactivated champion's code stops counting
  Once staff deactivate a champion, new Pay Bill gifts with their code are
  no longer credited to them. What they raised before stays theirs. The
  account "ROOF JOHN" then matches nothing, so staff place the payment by hand.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"
    And staff have made the member2 champion "JOHN" of the Pay Bill campaign

  Scenario: Pay Bill with an inactive champion code does not credit the champion
    When the member sends KES 1000 from the M-Pesa menu to Pay Bill account "ROOF JOHN"
    Then staff see KES 1000 raised through champion "JOHN" from 1 donor

    Given I am signed in as the treasurer
    When staff deactivate champion "JOHN" on the Champions tab
    And a visitor on "254711300009" named "Kiprono" sends KES 500 from the M-Pesa menu to Pay Bill account "ROOF JOHN"
    Then staff find the KES 500 Pay Bill payment to "ROOF JOHN" waiting to be placed
    And staff see KES 1000 raised through champion "JOHN" from 1 donor
    And staff see KES 1000 raised for the Pay Bill campaign
    And the Champions tab lists "John Kamau" with code "JOHN" as "Inactive"
    And the champion page for "JOHN" says the champion was not found
    And no request left the machine
