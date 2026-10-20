Feature: Give to a fundraising campaign
  A giver who follows a campaign link lands on /contribute?campaign=<slug>.
  Instead of the general department form they see the campaign, its progress,
  an M-Pesa prompt form that sends the gift to the campaign's department tagged
  with the campaign, and the Pay Bill account to use instead (ticket 1.12).
  Staff recording cash and envelope gifts can tag each line with an active
  campaign of that line's department (ticket 1.13).

  Scenario: A giver sends an M-Pesa prompt for a campaign
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    When a giver opens the contribute page for campaign "new-church-roof"
    Then they see the campaign "New Church Roof" with "KES 24,800.00" raised
    And they see the Pay Bill account "BUILD"
    When they give "1500" from phone "0712345678"
    Then the M-Pesa prompt is sent for "1500" to the campaign's department tagged with the campaign
    And they are taken to the confirmation page for campaign "new-church-roof"

  Scenario: The server refuses the prompt
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    And the server will refuse the prompt with "M-Pesa is unavailable"
    When a giver opens the contribute page for campaign "new-church-roof"
    And they give "1500" from phone "0712345678"
    Then they are told "M-Pesa is unavailable"
    And they stay on the campaign page

  Scenario: A paused campaign does not take gifts
    Given the campaign "new-church-roof" "New Church Roof" is not accepting gifts
    When a giver opens the contribute page for campaign "new-church-roof"
    Then they are told the campaign is not accepting gifts
    And they are offered a link back to the general giving page

  Scenario: An unknown campaign link
    Given there is no public campaign "no-such-thing"
    When a giver opens the contribute page for campaign "no-such-thing"
    Then they are told the campaign could not be found
    And they are offered a link back to the general giving page

  Scenario: Without a campaign the general form is shown
    When a giver opens the contribute page without a campaign
    Then they see the general contribution form

  Scenario: Staff tag a manual-entry line with a campaign
    Given the active campaign "New Church Roof" belongs to "Building Fund"
    When staff open the manual-entry lines
    And they put "2000" on line 1 for "Building Fund"
    And they put "500" on line 2 for "Tithe"
    Then line 1 offers the campaign "New Church Roof"
    And line 2 offers no campaign
    When they choose the campaign "New Church Roof" for line 1
    Then line 1 is sent tagged with campaign "New Church Roof"
    And line 2 is sent without a campaign

  Scenario: Changing a line's department drops its campaign
    Given the active campaign "New Church Roof" belongs to "Building Fund"
    When staff open the manual-entry lines
    And they put "2000" on line 1 for "Building Fund"
    And they choose the campaign "New Church Roof" for line 1
    And they change line 1 to "Tithe"
    Then line 1 is sent without a campaign
    And line 1 offers no campaign

  Scenario: Someone who may not list campaigns sees no campaign choice
    Given listing campaigns is refused
    When staff open the manual-entry lines
    And they put "2000" on line 1 for "Building Fund"
    Then line 1 offers no campaign
    And line 1 is sent without a campaign
