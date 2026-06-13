@parity
Feature: Browse church content
  Members browse published church content — announcements, devotionals and
  events. Only active/published items appear in each feed; expired, unpublished
  or inactive items are hidden.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: Published announcements are listed and expired ones are hidden
    Given 2 published announcements and 1 expired announcement
    When the announcements feed is loaded
    Then 2 announcements are shown

  Scenario: Only published devotionals are listed
    Given 2 published devotionals and 1 unpublished devotional
    When the devotionals feed is loaded
    Then 2 devotionals are shown

  Scenario: Only active events are listed
    Given 2 active events and 1 inactive event
    When the events feed is loaded
    Then 2 events are shown
