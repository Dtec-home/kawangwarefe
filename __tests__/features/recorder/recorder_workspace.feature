Feature: Recorder workspace
  A recorder takes cash and envelope gifts on a phone during service. Every
  giver gets a system receipt number. A recorder sees only their own entries
  for today and cannot void or edit; they can reprint, resend the SMS, or ask a
  treasurer or admin to void a receipt (RR-3, RR-5, RR-6). Entries are for
  today unless an admin opened a catch-up window (RR-7, D13).

  Scenario: A recorder records a member's multi-line cash gift
    Given a signed-in recorder
    And the phone "0712345678" belongs to "Mary Wanjiru"
    When they look up the phone "0712345678"
    Then they are asked to confirm the name "Mary Wanjiru"
    When they add "1000" to "Tithe" and "500" to "Combined Offering"
    And they review and confirm the gift
    Then receipt "20260917-0012" is shown
    And the SMS status says "SMS receipt sent to the giver"

  Scenario: A walk-in giver gets a receipt but no SMS
    Given a signed-in recorder
    When they record a walk-in gift of "200" to "Tithe" from "Visitor - John"
    Then receipt "20260917-0013" is shown
    And the SMS status says "Walk-in: no SMS sent"

  Scenario: A recorder asks for a void from today's entries
    Given a signed-in recorder
    And they issued receipt "20260917-0012" for "Mary Wanjiru" of "1500.00" today
    When they open today's entries
    Then today's entries list receipt "20260917-0012" for "Mary Wanjiru"
    When they request a void of "20260917-0012" because "Recorded against the wrong giver"
    Then receipt "20260917-0012" shows the void was requested
