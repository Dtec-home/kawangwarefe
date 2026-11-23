Feature: A department leader writes and submits the yearly report
  The Building Fund leader writes the report in the standard template; the money
  table comes from the books. Plan: DEPARTMENT_REPORTS/01_SPRINT_PLAN.md
  (US-1..US-7).

  Background:
    Given the church is set up with its departments and people
    And a phone new to the church pays 1500 and then 3000 to "BLDG" by Pay Bill as "RUTH"
    And the admin has opened the reporting period "2026-2027" from "2026-07-01" to "2027-06-30" due "2027-07-31"

  Scenario: The leader writes, previews and submits the Building Fund report
    Given I am signed in as the dept_admin
    When I open Department Reports
    Then I see the "Building Fund" report for "2026-2027" as "Not started"
    When I start the "Building Fund" report
    Then the leaders section lists "Dan Builder"
    When I write the introduction "We look after the church buildings."
    And I add the objectives "Repair the roof; Paint the hall"
    And I add the achievement "Roof repaired in March" for the objective "Repair the roof"
    And I write the conclusion "Thank you to every giver."
    Then the report says it is saved
    And the financial statement shows money in of "KES 4,500.00"
    When I preview and submit the report
    Then the report shows the status "Submitted"

  Scenario: Submit lists what is still missing
    Given I am signed in as the dept_admin
    When I open Department Reports
    And I start the "Building Fund" report
    And I preview the report
    Then the preview lists the missing sections "Introduction / Departmental Mission, Objectives, Achievements, Conclusion"
