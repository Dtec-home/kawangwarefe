Feature: Public campaign pages
  Anyone can browse the church's active fundraising campaigns at /campaigns and
  open a campaign's own page to read its story, see how far it has got and
  follow its updates. Public pages show totals only and never name a donor
  (decision 7).

  Scenario: A visitor browses the active campaigns
    Given the active campaigns "New Church Roof" and "Youth Camp Bus"
    When a visitor opens the campaigns page
    Then they see a card for "New Church Roof" with "KES 24,800.00" raised
    And they see a card for "Youth Camp Bus"
    And the card for "New Church Roof" says "12 days left"
    And the card for "New Church Roof" links to "/campaigns/new-church-roof"

  Scenario: There are no active campaigns
    Given there are no active campaigns
    When a visitor opens the campaigns page
    Then they are told there are no campaigns to give to right now

  Scenario: A visitor reads a campaign's page
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    When a visitor opens the campaign page "new-church-roof"
    Then they see the heading "New Church Roof"
    And they see the story in 2 paragraphs
    And they see "KES 24,800.00" raised from "37 donors"
    And they see "12 days left"
    And they see the updates newest first: "Sheets delivered", "We have started"
    And no donor is named on the page

  Scenario: The gallery shows pictures and embeds YouTube videos safely
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    When a visitor opens the campaign page "new-church-roof"
    Then the gallery shows 1 picture
    And the gallery embeds the YouTube video "dQw4w9WgXcQ" without tracking cookies
    And the gallery leaves out the link that is not a real video

  Scenario: A paused campaign takes no gifts
    Given the campaign "new-church-roof" "New Church Roof" is not accepting gifts
    When a visitor opens the campaign page "new-church-roof"
    Then they see a notice that the campaign is not taking gifts right now
    And there is no give form

  Scenario: An unknown campaign link
    Given there is no public campaign "no-such-thing"
    When a visitor opens the campaign page "no-such-thing"
    Then they are told the campaign could not be found
    And they are offered a link to all campaigns
