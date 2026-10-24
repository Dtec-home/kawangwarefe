Feature: The desk credits a campaign line to a champion
  A giver may hand over an envelope "for John's roof". The desk tags the line
  with the campaign and types the champion's code (e.g. JOHN), so the gift
  counts on John's dashboard. The code belongs to one campaign, so the field
  appears only once a campaign is chosen, and a new campaign choice clears it.
  The server checks the code and refuses a wrong one.

  Background:
    Given the "Building" department has the active campaigns "Roof Appeal" and "New Chairs"
    And the phone "0712345678" belongs to "Grace Achieng"
    And a recorder at the desk records for "0712345678"

  Scenario: The champion field appears only after a campaign is chosen
    When they give "700" to "Building"
    Then line 1 offers the campaigns "No campaign, Roof Appeal, New Chairs"
    And line 1 has no champion code field
    When they choose the campaign "Roof Appeal" for line 1
    Then line 1 has an empty champion code field

  Scenario: The champion code is upper-cased and cleaned as it is typed
    When they give "700" to "Building"
    And they choose the campaign "Roof Appeal" for line 1
    And they type the champion code "jo hn!" for line 1
    Then the champion code for line 1 reads "JOHN"

  Scenario: Choosing another campaign clears the champion code
    When they give "700" to "Building"
    And they choose the campaign "Roof Appeal" for line 1
    And they type the champion code "john" for line 1
    And they choose the campaign "New Chairs" for line 1
    Then the champion code for line 1 reads ""

  Scenario: Choosing "No campaign" removes the champion code field
    When they give "700" to "Building"
    And they choose the campaign "Roof Appeal" for line 1
    And they type the champion code "john" for line 1
    And they choose the campaign "No campaign" for line 1
    Then line 1 has no champion code field

  Scenario: The champion code is sent with the campaign line
    When they give "700" to "Building"
    And they choose the campaign "Roof Appeal" for line 1
    And they type the champion code "john" for line 1
    And they review and confirm the gift
    Then the gift is sent with line 1 to "Building" for "Roof Appeal" through champion "JOHN"

  Scenario: A refused champion code is shown and no receipt is issued
    Given the server refuses the gift with "Building: PETER is not an active champion of this campaign"
    When they give "700" to "Building"
    And they choose the campaign "Roof Appeal" for line 1
    And they type the champion code "peter" for line 1
    And they review and confirm the gift
    Then they are told "Building: PETER is not an active champion of this campaign"
    And no receipt is shown
