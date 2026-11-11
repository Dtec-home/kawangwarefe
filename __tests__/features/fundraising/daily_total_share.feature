@web
Feature: Sharing the daily total by hand
  ADR-0015 D5: staff preview the day's total and who gave, share or copy it,
  or post it to the group now; a second post within 10 minutes is refused.

  Scenario: A treasurer posts the daily total to the group
    Given the daily total for Shamba today is KES 1,500 from 2 givers
    When the treasurer opens the daily total card
    Then the preview says "KES 1,500 from 2 givers"
    When the treasurer taps "Post to group now"
    Then they are told "Posted to the WhatsApp group."
    When the treasurer taps "Post to group now" again
    Then they are told to wait
