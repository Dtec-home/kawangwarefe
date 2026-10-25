Feature: Campaign statement tab
  Staff open a campaign's Statement tab to see the campaign's own books: every
  shilling that came in (and through which channel), every expense or payout
  charged to it, and the running balance. They can narrow it to a period,
  read it as charts or as a table, and export it to Excel or PDF for the
  treasurer and the church board.

  Background:
    Given the campaign "Church Building" has pledges of "300000.00" and has received "125000.00"

  Scenario: Staff see money in, money out and the balance
    Given the statement has these lines
      | on         | description               | channel  | in        | out      | balance   |
      | 2026-11-02 | Jane Wanjiku              | mpesa    | 100000.00 | 0.00     | 100000.00 |
      | 2026-11-09 | Sabbath envelopes         | envelope | 25000.00  | 0.00     | 125000.00 |
      | 2026-11-12 | Cement for the foundation | expense  | 0.00      | 40000.00 | 85000.00  |
    When they open the Statement tab
    Then the summary shows "KES 125,000.00" in, "KES 40,000.00" out and a balance of "KES 85,000.00"
    And the line "Cement for the foundation" shows "Expense" with "KES 40,000.00" out and a balance of "KES 85,000.00"
    And the line "Jane Wanjiku" shows "M-Pesa" with "KES 100,000.00" in and a balance of "KES 100,000.00"
    And the totals row shows "KES 125,000.00" in, "KES 40,000.00" out and "KES 85,000.00"
    And the statement covers "All time"

  Scenario: Staff compare what was pledged with what was received
    Given the statement has these lines
      | on         | description  | channel | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku | mpesa   | 125000.00 | 0.00 | 125000.00 |
    When they open the Statement tab
    Then they see "KES 300,000.00" pledged and "KES 125,000.00" received, "42%" of pledges

  Scenario: The charts can also be read as tables
    Given the statement has these lines
      | on         | description       | channel  | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku      | mpesa    | 100000.00 | 0.00 | 100000.00 |
      | 2026-11-09 | Sabbath envelopes | envelope | 25000.00  | 0.00 | 125000.00 |
    When they open the Statement tab
    Then there is a chart titled "Money in over time"
    And there is a chart titled "Money in by channel"
    When they show the "Money in by channel" chart as a table
    Then that table lists "M-Pesa" with "KES 100,000.00" and "Envelope" with "KES 25,000.00"

  Scenario: Staff narrow the statement to a period
    Given the statement has these lines
      | on         | description  | channel | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku | mpesa   | 100000.00 | 0.00 | 100000.00 |
    When they open the Statement tab
    And they choose a date range from "2026-11-01" to "2026-11-30"
    Then the statement is asked for "2026-11-01" to "2026-11-30"
    When they choose "All time"
    Then the statement is asked for all time

  Scenario: A period that ends before it starts is refused
    Given the statement has these lines
      | on         | description  | channel | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku | mpesa   | 100000.00 | 0.00 | 100000.00 |
    When they open the Statement tab
    And they choose a date range from "2026-11-30" to "2026-11-01"
    Then they see "The end date must not be before the start date"
    And the export buttons are disabled

  Scenario: A campaign with no money yet says so
    Given the statement has no lines
    When they open the Statement tab
    Then they are told no money has come in or gone out yet

  Scenario: The tab explains when the statement cannot load
    Given the statement cannot be loaded
    When they open the Statement tab
    Then they see "Could not load the statement"

  Scenario: Staff export the statement to Excel
    Given the statement has these lines
      | on         | description  | channel | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku | mpesa   | 100000.00 | 0.00 | 100000.00 |
    When they open the Statement tab
    And they choose "Export Excel"
    Then the file "church-building-statement.xlsx" is downloaded
    And the export was for "excel" over all time
    And they are told "Statement exported"

  Scenario: Staff export a period to PDF
    Given the statement has these lines
      | on         | description  | channel | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku | mpesa   | 100000.00 | 0.00 | 100000.00 |
    When they open the Statement tab
    And they choose a date range from "2026-11-01" to "2026-11-30"
    And they choose "Export PDF"
    Then the file "church-building-statement.pdf" is downloaded
    And the export was for "pdf" from "2026-11-01" to "2026-11-30"

  Scenario: A refused export is explained
    Given the statement has these lines
      | on         | description  | channel | in        | out  | balance   |
      | 2026-11-02 | Jane Wanjiku | mpesa   | 100000.00 | 0.00 | 100000.00 |
    And exporting is refused with "You cannot export this campaign"
    When they open the Statement tab
    And they choose "Export Excel"
    Then they are told "You cannot export this campaign"
    And no file is downloaded
