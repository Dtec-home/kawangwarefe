@web
Feature: Period summary on the Treasurer's Cash Statement card (T4.1, T4.2; 03 §5)
  Below the export controls the treasurer opens a period summary for the
  chosen date or range: the statement of local church funds and the
  remittances sent to the conference. Treasurers and admins keep the books;
  pastors see them read-only.

  Background:
    Given today is Thursday 2026-09-17 in Nairobi

  Scenario: Treasurer reviews the local church funds for a month
    Given the treasurer is on the Cash Statement export card
    And the local fund received 8000.00 and paid out 3000.00 in August 2026 with 15000.00 brought forward
    When the treasurer chooses the range 2026-08-01 to 2026-08-31
    And the treasurer opens the period summary
    Then the local fund statement shows "Balance at end" of "KES 20,000.00"

  Scenario: Treasurer sets the missing local fund opening balance
    Given no local fund opening balance has been set
    And the treasurer is on the Cash Statement export card
    When the treasurer opens the period summary
    And the treasurer sets the opening balance to "-1200.00" as of 2026-06-30
    Then setLocalFundOpeningBalance is requested with amount "-1200.00" as of 2026-06-30
    And the card shows the opening balance "KES -1,200.00"

  Scenario: Treasurer records a remittance for the month
    Given the treasurer is on the Cash Statement export card
    When the treasurer chooses the range 2026-08-01 to 2026-08-31
    And the treasurer opens the period summary
    And the treasurer records a "cheque" remittance of "32000" referenced "CHQ-8812" remitted on 2026-09-02
    Then createRemittance is requested for 2026-08-01 to 2026-08-31 with method "cheque" and amount "32000"
    And the remittances table lists "CHQ-8812"

  Scenario: Pastor sees the period summary read-only
    Given no local fund opening balance has been set
    And the pastor is on the Cash Statement export card
    When the pastor opens the period summary
    Then the pastor cannot set the opening balance or add a remittance
