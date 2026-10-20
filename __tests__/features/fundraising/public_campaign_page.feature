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

  Scenario: A visitor gives from the campaign page
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    When a visitor opens the campaign page "new-church-roof"
    Then they see the M-Pesa give form for the campaign
    And they see the Pay Bill account "BUILD"
    And they are told "Contributors to this campaign are listed by name and amount in the church WhatsApp group."

  Scenario: A visitor shares the campaign
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    When a visitor opens the campaign page "new-church-roof"
    Then they can share the campaign on WhatsApp with the message "Help us raise funds for New Church Roof. Give via M-Pesa Pay Bill 247247, account BUILD, or online:"
    And the shared link is "https://church.example/campaigns/new-church-roof"

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

  Scenario: A shared campaign link shows a rich preview
    Given the church API describes the campaign "new-church-roof" "New Church Roof"
    When the link preview for "new-church-roof" is built
    Then the preview title is "New Church Roof"
    And the preview description says "KES 24,800 raised of KES 100,000"
    And the preview points to "/campaigns/new-church-roof"
    And the preview is a large-image card

  Scenario: The link preview still works when the church API is unreachable
    Given the church API cannot be reached
    When the link preview for "new-church-roof" is built
    Then the preview title is "Campaign"
    And the preview points to "/campaigns/new-church-roof"

  Scenario: After giving to a campaign the giver is invited to share it
    Given the campaign "new-church-roof" "New Church Roof" is accepting gifts
    When the giver reaches the confirmation page for campaign "new-church-roof"
    Then they see "Share this campaign" for "New Church Roof"
    And the WhatsApp share link points to "https://church.example/campaigns/new-church-roof"

  Scenario: After giving without a campaign there is nothing to share
    When the giver reaches the confirmation page without a campaign
    Then they are not asked to share a campaign
