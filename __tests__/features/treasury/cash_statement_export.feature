@web
Feature: Treasurer exports the Sabbath cash statement (T3.4, 03 §6)
  On Reports → Exports the treasurer downloads the church treasurer's cash
  statement for the most recent Sabbath, or for a date range, as a PDF or an
  Excel workbook. Dates are Nairobi-local.

  Scenario: Treasurer exports Sabbath cash statement
    Given today is Wednesday 2026-09-16 in Nairobi
    And the treasurer is on the Cash Statement export card
    Then the statement date defaults to Saturday 2026-09-12
    When the treasurer generates the statement as PDF on Letter paper
    Then generateCashStatement is requested for 2026-09-12 to 2026-09-12
    And the file "Cash_Statement_2026-09-12.pdf" is downloaded

  Scenario: Treasurer exports a month as Excel on A4
    Given today is Wednesday 2026-09-16 in Nairobi
    And the treasurer is on the Cash Statement export card
    When the treasurer chooses the range 2026-08-01 to 2026-08-31
    And the treasurer generates the statement as Excel on A4 paper
    Then generateCashStatement is requested for 2026-08-01 to 2026-08-31
    And the file "Cash_Statement_2026-08-01_to_2026-08-31.xlsx" is downloaded

  Scenario: A range longer than 366 days is refused before export
    Given today is Wednesday 2026-09-16 in Nairobi
    And the treasurer is on the Cash Statement export card
    When the treasurer chooses the range 2025-01-01 to 2026-01-02
    Then the card shows "A Cash Statement can cover at most 366 days"
    And the statement cannot be generated
