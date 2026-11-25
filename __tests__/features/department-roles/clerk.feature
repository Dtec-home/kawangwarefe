Feature: The church clerk reads every yearly department report (R4)
  A clerk reads every yearly report, the tracker and the periods, and
  downloads them. A clerk cannot write, send back, approve or reopen, and sees
  no money pages. A clerk who is nothing else lands on Department Reports and
  sees only that menu. The server remains the real enforcement.

  Scenario: A clerk lands on Department Reports after login
    Given a signed-in member whose only extra role is "clerk"
    When they finish logging in without a redirect target
    Then they land on "/admin/department-reports"

  Scenario: A clerk's navigation offers only Department Reports
    Given a signed-in member whose only extra role is "clerk"
    When they open Department Reports
    Then the page is shown
    And the admin navigation offers only "Department Reports"

  Scenario: A clerk can open the tracker
    Given a signed-in member whose only extra role is "clerk"
    When they open the tracker for a period
    Then the tracker is shown

  Scenario: A clerk is kept away from money pages
    Given a signed-in member whose only extra role is "clerk"
    When they open an admin page that requires staff access
    Then the admin page is not shown
    And they are redirected to "/admin/department-reports"

  Scenario: A clerk reads a report but cannot review it
    Given a signed-in member whose only extra role is "clerk"
    When they open a submitted report
    Then they can download it as PDF and Word
    But they see no "Send back", "Approve" or "Reopen"
    And they see no books-today comparison

