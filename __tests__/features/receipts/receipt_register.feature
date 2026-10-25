Feature: Receipt register
  Staff look up receipts in the register by date, number, name or M-Pesa code.
  A mistake is corrected by voiding the receipt: only a treasurer or admin may
  void, and must give a reason. A voided receipt keeps its number and shows as
  VOID (RC-6, D6). The backend re-checks every permission.

  Scenario: Staff see today's receipts by default
    Given a signed-in staff member who cannot void receipts
    And receipt "20260917-0003" for "Mary Wanjiru" of "1500.00" was issued today
    When they open the receipt register
    Then the register lists receipt "20260917-0003" for "Mary Wanjiru"

  Scenario: Staff search the register by M-Pesa code
    Given a signed-in staff member who cannot void receipts
    And receipt "20260917-0004" paid with M-Pesa code "TIH12ABC34" is voided
    When they open the receipt register
    And they search for "TIH12ABC34"
    Then the register lists receipt "20260917-0004" marked VOID

  Scenario: A pastor cannot void a receipt
    Given a signed-in staff member who cannot void receipts
    And receipt "20260917-0003" for "Mary Wanjiru" of "1500.00" was issued today
    When they open the receipt register
    Then no void action is offered

  Scenario: A treasurer must give a reason to void
    Given a signed-in treasurer
    And receipt "20260917-0003" for "Mary Wanjiru" of "1500.00" was issued today
    When they open the receipt register
    And they void receipt "20260917-0003" with reason "typo"
    Then they are told the reason needs at least 10 characters

  Scenario: A treasurer voids a receipt with a reason
    Given a signed-in treasurer
    And receipt "20260917-0003" for "Mary Wanjiru" of "1500.00" was issued today
    When they open the receipt register
    And they void receipt "20260917-0003" with reason "Amount entered wrongly"
    Then the register lists receipt "20260917-0003" marked VOID
