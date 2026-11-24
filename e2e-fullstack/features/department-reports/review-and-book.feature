Feature: The pastor reviews department reports and downloads the AGM book
  Plan: DEPARTMENT_REPORTS/01_SPRINT_PLAN.md (US-8..US-12).

  Background:
    Given the church is set up with its departments and people
    And the admin has opened the reporting period "2026-2027" from "2026-07-01" to "2027-06-30" due "2027-07-31"
    And the dept_admin has submitted a complete "Building Fund" report

  Scenario: Returned, fixed, approved and filed
    Given I am signed in as the pastor
    When I open the department report tracker for "2026-2027"
    Then the tracker shows "Building Fund" as "Submitted"
    And the tracker shows "Welfare" as "Not started"
    When I open the "Building Fund" report and send it back with "Please add the roof cost" on "Achievements"
    Then the dept_admin receives an SMS containing "returned"
    When the dept_admin fixes the achievements to "Roof repaired in March for KES 120,000" and resubmits
    And I open the department report tracker for "2026-2027"
    And I open the "Building Fund" report and approve it
    Then the tracker shows "Building Fund" as "Approved"
    And I can download the "Building Fund" report as PDF and Word
    And I can download the AGM book for "2026-2027"
