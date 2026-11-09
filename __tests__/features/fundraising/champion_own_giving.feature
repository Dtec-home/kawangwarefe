@web
Feature: A champion's own giving on their personal link
  ADR-0016: shown by default on the page and in the share message; only the
  champion switches it; nothing at zero.

  Scenario: The share message includes it
    Given Jane has given KES 5,000 to Shamba and shows it
    When Jane opens her share kit
    Then Jane's WhatsApp message starts "I've given KES 5,000 to Shamba. Join me:"

  Scenario: Switched off, the message no longer mentions it
    Given Jane has given KES 5,000 to Shamba and hides it
    When Jane opens her share kit
    Then Jane's WhatsApp message starts "I'm raising money for Shamba at our church. Please support me!"

  Scenario: The public page shows it, and nothing at zero
    Given the server sends Jane's own giving as "5000.00"
    Then the page shows "Jane has given KES 5,000 to this campaign"
    Given the server sends no own giving for Jane
    Then the page shows no own-giving line
