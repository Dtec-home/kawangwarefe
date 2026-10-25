Feature: A champion's public page
  A champion raises money for a campaign through their own link,
  /campaigns/<slug>/c/<code>. The page says who is raising, shows what they
  have raised (and their personal target, if they set one) above the whole
  campaign's progress, and gives through the champion's code: the M-Pesa
  prompt carries the code, and the Pay Bill account is "<CAMPAIGN> <CHAMPION>".
  Givers are told, right by the form, that the champion sees their name and
  amount (decision 4). Public pages show totals only (tickets 5.7, 5.8).

  Scenario: A giver gives through a champion's link
    Given "Mary Wanjiku" is an active champion "MARY" of "New Church Roof" with "KES 12,500.00" raised from 9 donors
    And her personal target is "50000.00"
    When a visitor opens the champion page "new-church-roof" "MARY"
    Then they see "Raised by Mary Wanjiku for New Church Roof"
    And they see the champion's total "KES 12,500.00" from "9 donors"
    And they see her personal target "KES 50,000.00" at "25%"
    And they see the whole campaign's progress "KES 24,800.00"
    And they are told "Mary can see your name and the amount you give."
    And they see the Pay Bill account "BUILD MARY"
    When they give "1500" from phone "0712345678"
    Then the M-Pesa prompt is sent for "1500" tagged with the campaign and champion code "MARY"
    And they are taken to the confirmation page for campaign "new-church-roof"

  Scenario: A champion without a personal target
    Given "Mary Wanjiku" is an active champion "MARY" of "New Church Roof" with "KES 12,500.00" raised from 1 donors
    When a visitor opens the champion page "new-church-roof" "MARY"
    Then they see the champion's total "KES 12,500.00" from "1 donor"
    And they see no personal target

  Scenario: The champion page is shared with the champion's link
    Given "Mary Wanjiku" is an active champion "MARY" of "New Church Roof" with "KES 12,500.00" raised from 9 donors
    When a visitor opens the champion page "new-church-roof" "MARY"
    Then the WhatsApp share carries the champion link and the account "BUILD MARY"
    And there is a link to the main campaign page "new-church-roof"

  Scenario: A paused campaign takes no gifts on the champion page
    Given "Mary Wanjiku" is an active champion "MARY" of "New Church Roof" with "KES 12,500.00" raised from 9 donors
    And the campaign is not accepting gifts
    When a visitor opens the champion page "new-church-roof" "MARY"
    Then they are told the campaign is not taking gifts
    And there is no M-Pesa prompt form

  Scenario: A closed campaign's champion page shows the final totals
    Given "Mary Wanjiku" is an active champion "MARY" of "New Church Roof" with "KES 12,500.00" raised from 9 donors
    And the campaign has closed
    When a visitor opens the champion page "new-church-roof" "MARY"
    Then they are told the campaign has closed
    And they see the champion's total "KES 12,500.00" from "9 donors"
    And there is no M-Pesa prompt form
    And they are not asked to share the champion page

  Scenario: An unknown or inactive champion link
    Given there is no active champion "NOBODY" for "new-church-roof"
    When a visitor opens the champion page "new-church-roof" "NOBODY"
    Then they are told the champion link could not be found
    And there is a link to the main campaign page "new-church-roof"

  Scenario: The campaign page shows the champion leaderboard
    Given the campaign "new-church-roof" has champions "Mary Wanjiku" "MARY" with "12500.00" from 9 and "John Otieno" "JOHN" with "8000.00" from 4
    When the leaderboard for "new-church-roof" is shown
    Then row 1 is "Mary Wanjiku" with "KES 12,500.00" and "9 donors"
    And row 2 is "John Otieno" with "KES 8,000.00" and "4 donors"
    And "John Otieno" links to "/campaigns/new-church-roof/c/JOHN"

  Scenario: A campaign with no champions yet
    Given the campaign "new-church-roof" has no champions yet
    When the leaderboard for "new-church-roof" is shown
    Then they are invited to become a champion

  Scenario: A campaign without champions shows no leaderboard
    When the leaderboard is shown for a campaign that does not allow champions
    Then no leaderboard is shown
