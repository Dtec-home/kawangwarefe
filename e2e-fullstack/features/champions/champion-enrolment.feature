Feature: Champions are invited by staff or volunteer and are approved
  A champion raises money for a campaign with their own code. Staff invite a
  member by phone (active at once); a member can also volunteer from their
  champion pages, and stays pending until staff approve.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"

  Scenario: Staff invite one champion and approve another who volunteered
    Given I am signed in as the treasurer
    When staff invite the member2 as champion "JOHN" on the campaign's Champions tab
    Then the Champions tab lists "John Kamau" with code "JOHN" as "Active"

    When the member signs in to look after champions
    And they ask to champion the Pay Bill campaign with code "GRACE"
    Then their champion pages show code "GRACE" as "Waiting for approval"

    When the treasurer signs in to look after champions
    And staff approve champion "GRACE" on the Champions tab
    Then the Champions tab lists "Mary Wanjiku" with code "GRACE" as "Active"
    And the Champions tab lists "John Kamau" with code "JOHN" as "Active"

    When the member signs in to look after champions
    Then their champion pages show code "GRACE" as "Active"
    And no request left the machine
