Feature: Charge an expense to a fundraising campaign
  When staff record or edit an expense, they can charge it to one of the
  campaigns of the expense's fund, so the campaign's statement shows what was
  spent on it. Charging is optional.

  Scenario: Staff see the campaigns of the chosen fund with their status
    Given the "Building Fund" has campaigns "New Church Roof" (active) and "Chairs" (paused)
    And the "Youth Fund" has a campaign "Youth Camp" (active)
    When staff choose the "Building Fund" for the expense
    Then they can charge it to "No campaign", "New Church Roof · Active", "Chairs · Paused"

  Scenario: Staff charge the expense to a campaign
    Given the "Building Fund" has campaigns "New Church Roof" (active) and "Chairs" (paused)
    When staff choose the "Building Fund" for the expense
    And they charge it to "Chairs · Paused"
    Then the expense is charged to campaign "Chairs"

  Scenario: Staff take the expense off a campaign
    Given the "Building Fund" has campaigns "New Church Roof" (active) and "Chairs" (paused)
    When staff edit a "Building Fund" expense charged to "New Church Roof"
    And they charge it to "No campaign"
    Then the expense is charged to no campaign

  Scenario: A closed campaign the expense is already charged to still shows
    Given the "Building Fund" has campaigns "New Church Roof" (active) and "Old Hall" (closed)
    When staff edit a "Building Fund" expense charged to "Old Hall"
    Then the campaign shown is "Old Hall · Closed"

  Scenario: Nothing to choose before a fund is picked
    Given the "Building Fund" has campaigns "New Church Roof" (active) and "Chairs" (paused)
    When staff have not chosen a fund yet
    Then no campaign choice is shown

  Scenario: A fund with no campaigns shows no campaign choice
    Given the "Youth Fund" has a campaign "Youth Camp" (active)
    When staff choose the "Welfare Fund" for the expense
    Then no campaign choice is shown

  Scenario: Viewers who may not list campaigns see no campaign choice
    Given listing campaigns is refused
    When staff choose the "Building Fund" for the expense
    Then no campaign choice is shown
