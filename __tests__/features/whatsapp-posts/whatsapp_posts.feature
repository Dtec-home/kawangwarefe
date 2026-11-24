@web
Feature: WhatsApp totals posts and shout-outs (WA-2 web, WA-3)
  Plan: DEPARTMENT_REPORTS/03_ADDITIONS_FUNDS_WHATSAPP.md — US-20, US-21, US-22, US-23 (E2, E3, E8).
  An admin decides when the totals post goes to the WhatsApp group and what it
  says, church-wide and per campaign, with a live preview; givers are tagged
  unless they or the campaign switch it off.

  Scenario: The admin sets the church-wide schedule (US-22)
    Given the admin is on the WhatsApp posts page
    Then the schedule reads "Hourly 08:00–20:00 when something changed, plus 23:50"
    When the admin chooses fixed times "18:00" and "12:00"
    And the admin saves the church settings
    Then the church settings are saved with fixed times "12:00, 18:00"

  Scenario: A campaign changes its interval and follows the church for the rest (US-22)
    Given the campaign "Church Building" follows the church settings
    When the admin stops using the church settings for the campaign
    And the admin posts every "2 hours" for the campaign
    And the admin saves the campaign settings
    Then the campaign saves only "intervalMinutes" as 120, the rest follow the church

  Scenario: The admin builds the message with a live preview (US-23)
    Given the admin is on the WhatsApp posts page
    When the admin switches on the "Thank-you line" block
    And the admin moves "Thank-you line" up
    And the admin writes the intro "Karibu wote!"
    Then the preview shows "Karibu wote!"
    When the admin saves the church settings
    Then the saved layout has "thank_you" before "given_earlier_days"

  Scenario: Givers are tagged unless the campaign switches it off (US-20)
    Given the campaign "Church Building" tags givers
    Then the preview shows "🙏 Thank you @Kamau!"
    When the admin switches off "Tag givers in group posts"
    Then the campaign is saved with tagging off

  Scenario: A member switches off being tagged (US-21)
    Given a member who is tagged in WhatsApp thank-yous
    When the member switches off "Tag me in WhatsApp group thank-yous"
    Then the member is told "You will no longer be tagged in WhatsApp posts."

  Scenario: A second test within 10 minutes is refused with the reason (US-22)
    Given the campaign "Church Building" follows the church settings
    When the admin sends a test to the group twice
    Then the first test is sent
    And the second is refused, explaining the 10-minute limit
