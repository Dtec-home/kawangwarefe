Feature: The champion digest SMS
  A champion gets a short SMS when people give through their code: totals
  only, never donor names, with a link to their dashboard. At most one
  digest every few hours, so a busy day is a handful of messages.

  The receipt of a gift made in the daytime sends the digest straight away;
  the hourly job catches what came at night. Either way exactly one digest
  arrives, and the job never sends a second inside the interval.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"
    And staff have made the member2 champion "JOHN" of the Pay Bill campaign

  Scenario: One totals-only digest, then nothing more inside the interval
    When the member sends KES 1000 from the M-Pesa menu to Pay Bill account "ROOF JOHN"
    And the hourly champion digest job runs
    Then the member2 has received 1 champion digest SMS
    And the member2's champion digest reads "Roof Repair 2026: 1 new gift (KES 1,000) came through your code JOHN. Total through you: KES 1,000 from 1 donor. See who gave: <dashboard>"

    When a visitor on "254711300001" named "Peterson" sends KES 600 from the M-Pesa menu to Pay Bill account "ROOF-JOHN"
    And staff see KES 1600 raised through champion "JOHN" from 2 donors
    And the hourly champion digest job runs
    Then the champion digest job sends nothing
    And the member2 has received 1 champion digest SMS
    And no champion digest names a donor:
      | Mary | Wanjiku | Peterson |
    And no request left the machine
