Feature: My pledges
  A signed-in member opens /pledges to see what they have pledged, what they
  have paid and what is left, pay the balance through the campaign's give page,
  make a new pledge to a campaign or a department, and cancel an open pledge
  with a reason (ticket 3.8).

  Scenario: A member sees their pledges with paid and balance
    Given the member has pledged "10000" to the campaign "New Church Roof" and paid "4000"
    And the member has pledged "2000" to the department "Welfare" and paid "2000"
    When the member opens My pledges
    Then they see the pledge to "New Church Roof" with "KES 4,000.00" paid and "KES 6,000.00" left
    And the pledge to "New Church Roof" is marked "Open"
    And the pledge to "Welfare" is marked "Fulfilled"

  Scenario: An overdue pledge is highlighted
    Given the member has an overdue pledge of "5000" to the campaign "New Church Roof"
    When the member opens My pledges
    Then the pledge to "New Church Roof" is marked "Overdue"
    And the pledge to "New Church Roof" shows its due date as overdue

  Scenario: Paying the balance of a campaign pledge opens the campaign's give page
    Given the member has pledged "10000" to the campaign "New Church Roof" and paid "4000"
    When the member opens My pledges
    Then "Pay balance" on the pledge to "New Church Roof" goes to "/contribute?campaign=new-church-roof"

  Scenario: Paying the balance of a department pledge opens the give page
    Given the member has pledged "3000" to the department "Welfare" and paid "1000"
    When the member opens My pledges
    Then "Pay balance" on the pledge to "Welfare" goes to "/contribute"

  Scenario: A member with no pledges is invited to make one
    Given the member has no pledges
    When the member opens My pledges
    Then they are told they have no pledges yet

  Scenario: The pledges cannot be loaded
    Given loading the pledges fails
    When the member opens My pledges
    Then they are told the pledges could not be loaded

  Scenario: A member pledges to a campaign
    Given the member has no pledges
    And the campaign "New Church Roof" takes pledges
    When the member opens My pledges
    And they make a pledge of "5000" to the campaign "New Church Roof" due "2026-12-31"
    Then the pledge is created for "5000" to campaign "42" due "2026-12-31"
    And they are told "Pledge recorded"

  Scenario: A member pledges to a department without a due date
    Given the member has no pledges
    And the campaign "New Church Roof" takes pledges
    When the member opens My pledges
    And they make a pledge of "1500" to the department "Welfare"
    Then the pledge is created for "1500" to department "7" with no due date

  Scenario: The server refuses a new pledge
    Given the member has no pledges
    And the campaign "New Church Roof" takes pledges
    And the server will refuse the pledge with "You already have an open pledge to this campaign"
    When the member opens My pledges
    And they make a pledge of "5000" to the campaign "New Church Roof" due "2026-12-31"
    Then they see the message "You already have an open pledge to this campaign"

  Scenario: A member cancels an open pledge with a reason
    Given the member has pledged "10000" to the campaign "New Church Roof" and paid "4000"
    When the member opens My pledges
    And they cancel the pledge to "New Church Roof" because "Lost my job this month"
    Then the pledge is cancelled with the reason "Lost my job this month"
    And they are told "Pledge cancelled"
