Feature: Cancelling a pledge
  A member may cancel their own open pledge, and staff may cancel one in the
  register. A reason is required; a cancelled pledge stops counting.

  Background:
    Given the church is set up with its departments and people
    And the "Church Roof" campaign with Pay Bill code "ROOF" is taking pledges

  Scenario: A member cancels their own open pledge with a reason
    Given "Mary Wanjiku" has pledged KES 1000 to the "Church Roof" campaign
    And "Mary Wanjiku" has pledged KES 2500 to the "Church Roof" campaign
    And I am signed in as the member
    When I open My pledges
    And I cancel my pledge of "KES 1,000.00" to "Church Roof" giving the reason "no"
    Then the pledge cancel dialog asks for a longer reason
    When I cancel my pledge of "KES 1,000.00" to "Church Roof" giving the reason "My circumstances have changed"
    Then the pledge cancel dialog closes
    And my pledge of "KES 1,000.00" to "Church Roof" shows paid "KES 0.00", balance "KES 1,000.00" and status "Cancelled"
    And my pledge of "KES 1,000.00" to "Church Roof" can no longer be cancelled or paid
    And my pledge of "KES 2,500.00" to "Church Roof" shows paid "KES 0.00", balance "KES 2,500.00" and status "Open"
    And My pledges totals show pledged "KES 2,500.00", paid "KES 0.00" and balance "KES 2,500.00"
    And no request left the machine

  Scenario: The treasurer cancels a pledge in the register
    Given "John Kamau" has pledged KES 1500 to the "Church Roof" campaign
    And "Mary Wanjiku" has pledged KES 4000 to the "Church Roof" campaign
    And I am signed in as the treasurer
    When I open the pledge register
    And I cancel "John Kamau"'s pledge in the register giving the reason "Recorded twice by mistake"
    Then the pledge register shows "John Kamau"'s pledge of "KES 1,500.00" with paid "KES 0.00", balance "KES 1,500.00" and status "Cancelled"
    And the pledge register shows "Mary Wanjiku"'s pledge of "KES 4,000.00" with paid "KES 0.00", balance "KES 4,000.00" and status "Open"
    When I filter the pledge register by status "Cancelled"
    Then the pledge register lists only "John Kamau"
    When I sign in for pledges as the member2
    And I open My pledges
    Then my pledge of "KES 1,500.00" to "Church Roof" shows paid "KES 0.00", balance "KES 1,500.00" and status "Cancelled"
    And no request left the machine
