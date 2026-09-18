Feature: Collection sessions and statement certification
  Recorders group the cash they take during a service into a collection
  session, count it when the service ends and hand it to the treasurer. A
  counted total that differs from the recorded total needs a reason. The
  treasurer confirms each handover and certifies the day's Cash Statement,
  which locks entries and voids for that date (T5.3, PRD §5.4, D13, D14).

  Scenario: A recorder opens a session, records gifts and closes it with a variance
    Given a signed-in recorder with no open collection session
    When they start a collection session named "Divine Service"
    Then the session banner shows "0 receipts · KES 0.00 recorded"
    When gifts totalling "1500.00" in "3" receipts are recorded in the session
    Then the session banner shows "3 receipts · KES 1,500.00 recorded"
    When they close and count "1300" with the reason "Gave KES 200 change to a visitor"
    Then the session is closed with counted cash "1300.00" and the reason "Gave KES 200 change to a visitor"

  Scenario: A denomination breakdown must add up to the counted cash
    Given a signed-in recorder with an open session recording "1500.00" in "3" receipts
    When they count "1500" as "1" x KES 1000 and "2" x KES 200
    Then they are told "The breakdown adds up to KES 1,400.00, not KES 1,500.00"
    And the session is not closed

  Scenario: A retried gift is recorded only once
    Given a signed-in recorder whose first save attempt loses the connection
    When they record a walk-in gift of "200" from "Visitor - John" and retry
    Then the retry reuses the idempotency key of the first attempt
    And receipt "20260917-0013" is shown as already recorded

  Scenario: The treasurer confirms a counted session's handover
    Given the treasurer is reviewing a closed session "Sabbath School" short by "200.00"
    When they confirm the handover for "Sabbath School"
    Then the session "Sabbath School" is shown as confirmed

  Scenario: The treasurer certifies the day's statement
    Given the treasurer is viewing the uncertified statement for "2026-09-12"
    When they certify the statement
    Then the statement shows "Certified by Tom Treasurer"
