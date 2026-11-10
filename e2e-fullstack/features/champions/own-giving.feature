Feature: A champion's own giving on their page, share message and leaderboard
  ADR-0016 and F4: the champion's own giving is shown by default on their
  page and share message, and their leaderboard total is own giving plus
  giving through their code. Only they switch it off; then the server stops
  sending the amount and the board counts only what came through the code.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"
    And staff have made the member2 champion "JOHN" of the Pay Bill campaign
    And the member2 sends KES 5000 from the M-Pesa menu to Pay Bill account "ROOF"
    And a visitor on "254711300001" named "Peterson" sends KES 2000 from the M-Pesa menu to Pay Bill account "ROOF JOHN"

  Scenario: Shown by default, then switched off by the champion
    When a visitor opens champion "JOHN"'s page
    Then the champion page says "John has given KES 5,000 to this campaign"
    And the campaign page's champion leaderboard reads:
      | rank | champion | raised       | donors   |
      | 1    | John K.  | KES 7,000.00 | 2 donors |
    When the member2 signs in to look after champions
    And they open their champion page for the Pay Bill campaign
    Then the champion's WhatsApp message starts "I've given KES 5,000 to Roof Repair 2026. Join me:"
    When they switch off showing their own giving
    Then the champion's WhatsApp message starts "I'm raising money for Roof Repair 2026 at our church."
    And champion "JOHN"'s public page no longer shows or sends their own giving
    And the campaign page's champion leaderboard reads:
      | rank | champion | raised       | donors  |
      | 1    | John K.  | KES 2,000.00 | 1 donor |
