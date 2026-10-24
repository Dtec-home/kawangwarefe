Feature: Campaigns and pledges on USSD
  Members without a smartphone dial the church's USSD code. "4. Campaigns &
  Pledges" lets them give to a campaign by M-Pesa, make a pledge, and see
  what they still owe. The network operator posts every key press to the
  backend; nothing here goes through the browser except the staff check.

  Background:
    Given the church is set up with its departments and people
    And the Building Fund runs the desk campaign "New Church Roof" with Pay Bill code "ROOF"
    And John Kamau champions the desk campaign with the code "JOHN"

  Scenario: A member gives to a campaign through a champion on USSD and pays the M-Pesa prompt
    When the member dials the church USSD code
    Then the USSD screen offers "4. Campaigns & Pledges"
    When the USSD caller presses "4"
    Then the USSD screen offers "1. Give to a campaign"
    When the USSD caller presses "1"
    Then the USSD screen offers "New Church Roof (ROOF)"
    When the USSD caller presses "1"
    And the USSD caller presses "500"
    Then the USSD screen offers "Champion code?"
    When the USSD caller presses "JOHN"
    Then the USSD screen offers "Champion: JOHN"
    When the USSD caller presses "1"
    Then the USSD session ends with "Payment request sent to"
    And an M-Pesa prompt for 500 to account "ROOF JOHN" waits on the USSD caller's phone
    When the USSD caller pays the M-Pesa prompt
    Then the desk campaign has raised "500.00" from 1 gift
    And the desk campaign's champion "JOHN" has raised "500.00" by the treasurer's books
    And no request left the machine

  Scenario: A member pledges on USSD, staff see it, and My pledges shows the balance
    When member2 dials the church USSD code
    And the USSD caller presses "4"
    Then the USSD screen offers "3. Make a pledge"
    When the USSD caller presses "3"
    And the USSD caller presses "1"
    And the USSD caller presses "3000"
    Then the USSD screen offers "Pay within how many months?"
    When the USSD caller presses "3"
    Then the USSD screen offers "1. Confirm"
    When the USSD caller presses "1"
    Then the USSD session ends with "Thanks! You pledged"
    Given I am signed in as the treasurer
    When the treasurer opens the pledge register
    Then the pledge register lists "John Kamau" pledging "KES 3,000.00" to the desk campaign
    When member2 dials the church USSD code again and opens My pledges
    Then the USSD screen offers "My pledges (balance)"
    And the USSD screen shows a balance of 3000 for the desk campaign
    And no request left the machine
