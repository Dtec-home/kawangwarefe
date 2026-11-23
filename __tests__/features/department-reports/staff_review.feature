@web
Feature: Staff run the yearly department reports (DR-8)
  Plan: DEPARTMENT_REPORTS/01_SPRINT_PLAN.md — US-1, US-8, US-9, US-12, US-13, US-15.
  The admin opens the reporting period, the pastor follows every department on
  one tracker, sends reports back or approves them, and downloads the AGM book.

  Scenario: The admin opens a reporting period (US-1)
    Given the admin is on the reporting periods page with no periods
    When the admin opens the period "2026-2027" from "2026-07-01" to "2027-06-30" due "2027-07-31"
    Then the period "2026-2027" is listed as "Open"

  Scenario: A due date before the end date is refused before sending (US-1)
    Given the admin is on the reporting periods page with no periods
    When the admin tries to open the period "2026-2027" from "2026-07-01" to "2027-06-30" due "2027-06-01"
    Then the form says "Reports can't be due before the period ends"

  Scenario: The pastor follows every department on the tracker (US-8)
    Given the pastor opens the tracker for "2025-2026"
    Then the tracker shows "Building Fund" as "Submitted"
    And the tracker shows "Welfare" as "Not started"
    And "Choir" is marked overdue
    When the pastor filters the tracker by "Overdue"
    Then only "Choir" is listed

  Scenario: The pastor sends a report back with a comment (US-9)
    Given the pastor is reading the submitted "Building Fund" report
    When the pastor sends it back with "Please add the roof cost" on "Achievements"
    Then the report is returned with that comment on "achievements"

  Scenario: The pastor approves a submitted report (US-9)
    Given the pastor is reading the submitted "Building Fund" report
    When the pastor approves the report
    Then the report is approved

  Scenario: The AGM book waits for an approved report (US-12)
    Given the pastor opens the tracker for "2025-2026" with nothing approved
    Then the AGM book cannot be downloaded yet

  Scenario: The pastor downloads the AGM book (US-12)
    Given the pastor opens the tracker for "2025-2026" with "Ushers" approved
    When the pastor downloads the AGM book
    Then the file "Department-Reports-2025-2026.pdf" is downloaded

  Scenario: The admin reopens an approved report with a reason (US-13)
    Given the admin is reading the approved "Building Fund" report
    When the admin reopens it because "The roof invoice was missed"
    Then the report is reopened with that reason

  Scenario: The treasurer sees a late entry against the submitted figures (US-15)
    Given the treasurer is reading a submitted report whose money in was 5000.00
    And a late gift has since raised money in to 5500.00
    Then the "Money in" line is highlighted as changed by "+KES 500.00"
    And the panel says "A late entry changed the figures after submission"
