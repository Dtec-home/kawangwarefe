Feature: A visitor gives to a campaign by M-Pesa prompt
  The give panel sends an M-Pesa prompt to the visitor's phone with the
  campaign's Pay Bill code as the account. Safaricom confirms the payment
  through the prompt callback and also echoes it as a Pay Bill payment; the
  gift is counted once.

  Background:
    Given the church is set up with its departments and people
    And the campaign "Church Roof 2026" with code "ROOF" has been approved

  Scenario: A visitor gives from the campaign page and pays
    When a visitor opens the public page of the campaign "Church Roof 2026"
    And the visitor asks the campaign give panel for an M-Pesa prompt of KES 1500 to "0711222333"
    Then an M-Pesa prompt for KES 1500 went to "254711222333" with the campaign code "ROOF" as the account
    When the visitor pays the campaign prompt on "254711222333" and Safaricom echoes the Pay Bill payment
    Then the campaign confirmation page says the payment was successful
    And the campaign confirmation page invites the giver to share "Church Roof 2026"
    And "254711222333" gets a campaign receipt SMS saying "Towards: Church Roof 2026" with the WhatsApp list notice
    And the public page of "Church Roof 2026" shows KES 1500 raised from 1 donor
    And "Church Roof 2026" counted 1 gift of KES 1500, not the Pay Bill echo as well
    And no request left the machine

  Scenario: A visitor gives from the contribute page and cancels the prompt
    When a visitor opens the contribute page for the campaign "Church Roof 2026"
    And the visitor asks the campaign give panel for an M-Pesa prompt of KES 700 to "0722333444"
    Then an M-Pesa prompt for KES 700 went to "254722333444" with the campaign code "ROOF" as the account
    When the visitor cancels the campaign prompt on "254722333444"
    Then the campaign confirmation page says the payment failed
    And the public page of "Church Roof 2026" shows KES 0 raised from 0 donors
    And "Church Roof 2026" counted no gifts
    And no request left the machine
