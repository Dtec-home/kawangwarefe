Feature: A member pledges from My pledges
  A signed-in member promises an amount to a campaign or a department and
  sees, per pledge and in total, what they pledged, paid and still owe.

  Background:
    Given the church is set up with its departments and people
    And the "Church Roof" campaign with Pay Bill code "ROOF" is taking pledges

  Scenario: A member pledges to a campaign and to a department
    Given I am signed in as the member
    When I open My pledges
    Then My pledges says I have no pledges yet
    When I pledge KES 5000 to the campaign "Church Roof" from My pledges
    And I pledge KES 1200 to the department "Welfare" from My pledges
    Then my pledge of "KES 5,000.00" to "Church Roof" shows paid "KES 0.00", balance "KES 5,000.00" and status "Open"
    And my pledge of "KES 1,200.00" to "Welfare" shows paid "KES 0.00", balance "KES 1,200.00" and status "Open"
    And My pledges totals show pledged "KES 6,200.00", paid "KES 0.00" and balance "KES 6,200.00"
    And no request left the machine
