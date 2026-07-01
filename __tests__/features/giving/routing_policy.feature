@parity
Feature: Department routing policy
  A category's routing mode decides where a member's contribution is routed and
  whether extra details are required: top-level categories route to the top
  level, auto-route categories route the member to their group (and may reject
  when the member has no group), and purpose-required categories reject giving
  that does not name a purpose.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A top-level category is accepted and routed to the top level
    Given a "TOP_LEVEL" category "Tithe"
    And a member who belongs to no group
    When the member's giving to the category is evaluated
    Then the contribution is accepted
    And it is routed to the top level

  Scenario: An auto-route category routes the member to their group
    Given an "AUTO_MEMBER_GROUP" category "Choir Fund" allowing the "Choir" group
    And a member who belongs to the "Choir" group
    When the member's giving to the category is evaluated
    Then the contribution is accepted
    And it is routed to the "Choir" group

  Scenario: An auto-route category rejects when the member has no group
    Given an "AUTO_MEMBER_GROUP" category "Choir Fund" allowing the "Choir" group that rejects when there is no group
    And a member who belongs to no group
    When the member's giving to the category is evaluated
    Then the contribution is rejected with "Member has no group for this department"

  Scenario: A purpose-required category rejects giving without a purpose
    Given a "REQUIRES_PURPOSE" category "Welfare"
    And a member who belongs to no group
    When the member's giving to the category is evaluated
    Then the contribution is rejected with "Purpose is required for this department"
