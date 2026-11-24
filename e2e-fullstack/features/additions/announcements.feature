Feature: Announcements posted to the church WhatsApp group
  US-24 (E4, E9): a published announcement goes to the church group once,
  and the admin sees that it went.

  Background:
    Given the church is set up with its departments and people
    And the admin has set the church WhatsApp group to "120363000000000009@g.us"

  Scenario: A new announcement is posted once and shows it was posted
    Given I am signed in as the admin
    When I create the announcement "Harambee Sunday" saying "Come one, come all.", published now and posted to the church WhatsApp group
    Then the announcement "Harambee Sunday" shows "WhatsApp: waiting to post"
    When the announcements job runs, posting 1
    Then the group "120363000000000009@g.us" has exactly 1 post starting with "*📢 Harambee Sunday*"
    And the post to "120363000000000009@g.us" reads "*📢 Harambee Sunday*", then "Come one, come all.", then the church name
    When the announcements job runs, posting 0
    Then the group "120363000000000009@g.us" has exactly 1 post starting with "*📢 Harambee Sunday*"
    And the announcement "Harambee Sunday" shows "Posted to WhatsApp"
    And no request left the machine
