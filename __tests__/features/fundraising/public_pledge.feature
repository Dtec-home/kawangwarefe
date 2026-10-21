Feature: Pledge from the public campaign page
  A visitor on a campaign's public page who cannot give today can pledge to give
  later: they enter their name, phone, amount and an optional due date, confirm
  with the one-time code sent by SMS, and the pledge becomes active at once
  (decision 3). Reminders follow by SMS (decision 5) (ticket 3.9).

  Scenario: A guest pledges and confirms with the SMS code
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges
    When a visitor opens the pledge card
    And they pledge "5000" as "Jane Wanjiru" from phone "0712345678" due "2026-12-31"
    Then a code is requested for "Jane Wanjiru" on "254712345678" for "5000" due "2026-12-31" on "new-church-roof"
    And they are asked for the 6-digit code
    When they enter the code "123456"
    Then the pledge "p-1" is confirmed with the code "123456"
    And they are told the pledge is confirmed and they will be reminded by SMS

  Scenario: A guest pledges without a due date
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges
    When a visitor opens the pledge card
    And they pledge "2000" as "Jane Wanjiru" from phone "0712345678"
    Then a code is requested with no due date

  Scenario: A wrong code is refused
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges
    And the server will refuse the code with "That code is not correct. Try again."
    When a visitor opens the pledge card
    And they pledge "5000" as "Jane Wanjiru" from phone "0712345678" due "2026-12-31"
    And they enter the code "000000"
    Then they see the message "That code is not correct. Try again."
    And they are still asked for the 6-digit code

  Scenario: Too many code requests are refused
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges
    And the server will refuse to send a code with "Too many requests. Try again in 10 minutes."
    When a visitor opens the pledge card
    And they pledge "5000" as "Jane Wanjiru" from phone "0712345678" due "2026-12-31"
    Then they see the message "Too many requests. Try again in 10 minutes."
    And they are not asked for a code

  Scenario: Asking for a new code starts the pledge again
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges
    When a visitor opens the pledge card
    And they pledge "5000" as "Jane Wanjiru" from phone "0712345678" due "2026-12-31"
    And they ask for a new code
    Then a code has been requested 2 times
    When they enter the code "654321"
    Then the pledge "p-2" is confirmed with the code "654321"

  Scenario: An invalid phone number is caught before sending
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges
    When a visitor opens the pledge card
    And they pledge "5000" as "Jane Wanjiru" from phone "12345"
    Then they are told to enter a valid phone number
    And no code is requested

  Scenario: A campaign that does not take pledges shows no pledge card
    Given the public campaign "new-church-roof" "New Church Roof" does not take pledges
    When a visitor opens the pledge card
    Then there is no pledge card

  Scenario: A paused campaign shows no pledge card
    Given the public campaign "new-church-roof" "New Church Roof" takes pledges but is not accepting gifts
    When a visitor opens the pledge card
    Then there is no pledge card
