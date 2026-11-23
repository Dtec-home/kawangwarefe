@web
Feature: A department leader writes the yearly report (DR-7)
  Plan: DEPARTMENT_REPORTS/01_SPRINT_PLAN.md — US-2..US-7 and US-10.
  The Building Fund leader finds the report to write, starts it with the
  leaders filled in, writes it one section at a time with hints, sees the
  money from the books, previews it and submits it, and fixes it when the
  pastor sends it back.

  Scenario: The leader sees the report to write, its status and due date (US-2)
    Given the period "2026-2027" is open and due "2027-07-31"
    And today is "2027-07-19"
    When the Building Fund leader opens Department Reports
    Then the "Building Fund" card shows the period "2026-2027" as "Not started"
    And the card says "Due in 12 days"

  Scenario: Starting a report opens it with the leaders filled in (US-3)
    Given the period "2026-2027" is open and due "2027-07-31"
    When the Building Fund leader starts the "Building Fund" report
    Then the editor for report "5" opens
    And the leaders section lists "Dan Builder"

  Scenario: Last year's objectives can be carried forward (US-3)
    Given a draft report with last year's objective "Hold a youth camp" from "2025-2026"
    When the leader opens the Objectives section
    And the leader carries forward "Hold a youth camp"
    Then the objective "Hold a youth camp" is carried forward

  Scenario: Every section shows the template hint (US-4)
    Given a freshly started draft report
    When the leader opens the "Challenges" section
    Then the section shows the hint "What got in the way? Keep it factual and leave out names."
    And the leader adds the challenge "Transport costs rose mid-year"
    Then the challenges saved are "Transport costs rose mid-year"

  Scenario: Writing a section is saved automatically (US-5)
    Given the leader is editing a freshly started report
    When the leader writes the introduction "We look after the church buildings."
    Then the report says it is saved
    And 5 of 8 sections are done

  Scenario: The money table comes from the books (US-6)
    Given a freshly started draft report
    When the leader opens the "Financial Statement" section
    Then the money in row shows "KES 4,500.00"
    And the balance carried forward shows "KES 4,300.00"
    And no amount can be edited
    When the leader notes "Harambee in May" on the money in line "Roof appeal"
    Then the note is saved for the money in line "Roof appeal"

  Scenario: Submit lists what is still missing (US-7)
    Given a freshly started draft report
    When the leader previews the report
    Then the preview lists the missing sections "Introduction / Departmental Mission, Objectives, Achievements, Conclusion"
    And Submit report is disabled

  Scenario: A complete report is submitted after one confirmation (US-7)
    Given a complete draft report
    When the leader previews and submits the report
    Then the report is submitted

  Scenario: The leader sees what the reviewer asked for and resubmits (US-10)
    Given a report returned with "Please add the roof cost" on "achievements"
    Then the comments banner shows "Please add the roof cost"
    And the comment is pinned on the "Achievements" section
    When the leader changes achievement 1 to "Roof repaired in March for KES 120,000"
    Then the achievements saved are "Roof repaired in March for KES 120,000"
    When the leader previews and submits the report
    Then the report is submitted
