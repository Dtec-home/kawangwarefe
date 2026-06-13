@parity
Feature: Role-based access control
  Admin capabilities are gated by role, and scoped admins (department / group)
  may only act within the scope they were assigned. Wrong-role and out-of-scope
  access is denied.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A staff administrator can manage content and generate reports
    Given a member with the "admin" role
    Then they can manage content
    And they can generate financial reports
    And they have staff privileges

  Scenario: A content administrator can manage content but is not financial staff
    Given a member with the "content_admin" role
    Then they can manage content
    And they cannot generate financial reports
    And they do not have staff privileges

  Scenario: A regular member is denied every admin capability
    Given a member with the "member" role
    Then they cannot manage content
    And they cannot generate financial reports
    And they cannot send bulk messages

  Scenario: A department administrator may only message their own department
    Given a department administrator scoped to the "Welfare" department
    And another department "Youth" they do not administer
    Then they can send bulk messages
    And their messaging scope includes the "Welfare" department
    And their messaging scope excludes the "Youth" department

  Scenario: A group administrator may only message their own group
    Given a group administrator scoped to the "Choir" group
    And another group "Ushers" they do not administer
    Then their messaging scope includes the "Choir" group
    And their messaging scope excludes the "Ushers" group
