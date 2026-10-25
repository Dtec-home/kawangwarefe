Feature: Pay Bill payments pay off pledges, oldest first
  A completed gift to a campaign code pays the giver's open pledges to that
  campaign, oldest first. A pledge paid in full is Fulfilled, and money
  beyond what is pledged stays unapplied.

  Background:
    Given the church is set up with its departments and people
    And the "Church Roof" campaign with Pay Bill code "ROOF" is taking pledges

  Scenario: Two pledges are paid by Pay Bill, partly and then in full with an overpayment
    Given I am signed in as the member
    When I open My pledges
    And I pledge KES 3000 to the campaign "Church Roof" from My pledges
    And I pledge KES 2000 to the campaign "Church Roof" from My pledges
    When the member pays KES 2000 by Pay Bill to the pledge campaign code "ROOF"
    Then my pledge of "KES 3,000.00" to "Church Roof" shows paid "KES 2,000.00", balance "KES 1,000.00" and status "Open"
    And my pledge of "KES 2,000.00" to "Church Roof" shows paid "KES 0.00", balance "KES 2,000.00" and status "Open"
    And My pledges totals show pledged "KES 5,000.00", paid "KES 2,000.00" and balance "KES 3,000.00"
    When the member pays KES 4000 by Pay Bill to the pledge campaign code "ROOF"
    Then my pledge of "KES 3,000.00" to "Church Roof" shows paid "KES 3,000.00", balance "KES 0.00" and status "Fulfilled"
    And my pledge of "KES 2,000.00" to "Church Roof" shows paid "KES 2,000.00", balance "KES 0.00" and status "Fulfilled"
    And My pledges totals show pledged "KES 5,000.00", paid "KES 5,000.00" and balance "KES 0.00"
    And my pledge of "KES 3,000.00" to "Church Roof" can no longer be cancelled or paid
    When I sign in for pledges as the treasurer
    And I open the pledge register
    Then the pledge register shows "Mary Wanjiku"'s pledge of "KES 3,000.00" with paid "KES 3,000.00", balance "KES 0.00" and status "Fulfilled"
    And the pledge register shows "Mary Wanjiku"'s pledge of "KES 2,000.00" with paid "KES 2,000.00", balance "KES 0.00" and status "Fulfilled"
    And the pledge register totals show pledged "KES 5,000.00", paid "KES 5,000.00", outstanding "KES 0.00" and 2 pledges
    And the member receives an SMS containing "Towards: Church Roof"
    And no request left the machine
