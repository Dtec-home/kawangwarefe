Feature: Sharing a campaign
  Every campaign page shows how far the campaign has got, without naming any
  donor, and lets people pass the link on through WhatsApp and other apps.

  Scenario: A visitor sees the campaign's progress without donor names
    Given a campaign that has raised "24800.00" of "100000.00" from 37 donors
    When the progress is shown
    Then the visitor sees "KES 24,800.00" raised of "KES 100,000.00"
    And the visitor sees "37 donors"

  Scenario: A visitor shares the campaign on WhatsApp
    Given the campaign page "https://church.example/campaigns/building-fund"
    When the share options are shown with the message "Help us finish the roof"
    Then the WhatsApp link carries the message and the page link
