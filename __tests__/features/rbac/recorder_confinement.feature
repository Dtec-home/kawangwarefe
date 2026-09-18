Feature: Pure recorder is confined to /record
  A recorder who is not staff may only record physical giving. After login they
  land on the recording workspace, admin routes send them back to it, and the
  admin navigation offers nothing else (RR-2, RR-4). Server-side checks remain
  the real enforcement (RR-10).

  Scenario: A pure recorder lands on the recording workspace after login
    Given a signed-in member whose only extra role is "recorder"
    When they finish logging in without a redirect target
    Then they land on "/record"

  Scenario: A pure recorder is sent back to /record from admin pages
    Given a signed-in member whose only extra role is "recorder"
    When they open an admin page that requires staff access
    Then the admin page is not shown
    And they are redirected to "/record"

  Scenario: A pure recorder can use the recording workspace
    Given a signed-in member whose only extra role is "recorder"
    When they open the recording workspace
    Then the recording workspace is shown
    And the admin navigation offers only "Record giving"

  Scenario: Staff are not confined
    Given a signed-in staff member
    When they open an admin page that requires staff access
    Then the admin page is shown
    And the admin navigation offers "Record giving" among other items
