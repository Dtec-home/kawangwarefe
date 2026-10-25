Feature: Pledge reminders by SMS
  Decision 5: a reminder 3 days before the due date and one overdue notice,
  each with the balance and how to pay by Pay Bill. A pledge past its due
  date with a balance becomes Overdue.

  Background:
    Given the church is set up with its departments and people
    And the "Church Roof" campaign with Pay Bill code "ROOF" is taking pledges

  Scenario: A pledge due in 3 days gets a reminder and an overdue pledge gets a notice
    Given "Mary Wanjiku" has pledged KES 4000 to the "Church Roof" campaign, due in 3 days
    And "John Kamau" has pledged KES 1500 to the "Church Roof" campaign, due yesterday
    When the member pays KES 1000 by Pay Bill to the pledge campaign code "ROOF"
    And the pledge reminders job runs
    Then 2 pledge reminders went out
    And "Mary Wanjiku" gets a pledge reminder SMS that it is due soon with balance "KES 3,000" and Pay Bill account "ROOF"
    And "John Kamau" gets an overdue pledge notice with balance "KES 1,500" and Pay Bill account "ROOF"
    When the pledge reminders job runs
    Then 0 pledge reminders went out
    When I sign in for pledges as the member2
    And I open My pledges
    Then my pledge of "KES 1,500.00" to "Church Roof" shows paid "KES 0.00", balance "KES 1,500.00" and status "Overdue"
    And my pledge of "KES 1,500.00" to "Church Roof" is marked overdue
    When I sign in for pledges as the treasurer
    And I open the pledge register
    Then the pledge register shows "John Kamau"'s pledge of "KES 1,500.00" with paid "KES 0.00", balance "KES 1,500.00" and status "Overdue"
    And the pledge register shows "Mary Wanjiku"'s pledge of "KES 4,000.00" with paid "KES 1,000.00", balance "KES 3,000.00" and status "Open"
    And no request left the machine
