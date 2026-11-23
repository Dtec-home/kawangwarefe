Feature: WhatsApp posts that thank givers by tag
  US-20, US-21, US-23 (ADR-0019): the admin sets the church group and an intro
  for the totals post; givers in the campaign group are tagged unless they
  switch it off in their profile, and then they are named instead.

  Background:
    Given the church is set up with its departments and people
    And the campaign "Shamba Land" with code "SHAMBA" and WhatsApp group "120363000000000001@g.us" has been approved
    And the member has given KES 500 to "Shamba Land" by M-Pesa prompt

  Scenario: A test post tags the giver; after opting out they are named
    Given I am signed in as the admin
    When I open Admin → WhatsApp posts
    And I choose the church WhatsApp group "SDA Kawangware Church"
    And I write the intro text "Karibu wote! Asante kwa kutoa." and put it first
    And I save the WhatsApp post settings
    Then I am told "WhatsApp post settings saved."
    And after a reload the church WhatsApp group is "SDA Kawangware Church" and the intro is "Karibu wote! Asante kwa kutoa."
    When I open the "WhatsApp posts" tab of the campaign "Shamba Land"
    And I send a test to the group now
    Then I am told "Test post sent to the WhatsApp group."
    And the test post to "120363000000000001@g.us" starts with "Karibu wote! Asante kwa kutoa." and tags the member
    When the member switches off WhatsApp tagging in their profile
    And the 23:50 totals post runs
    Then the totals post to "120363000000000001@g.us" names the member without tagging
    And no request left the machine
