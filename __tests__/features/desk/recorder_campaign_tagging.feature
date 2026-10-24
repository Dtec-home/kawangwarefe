Feature: Recorders tag desk lines with a campaign
  The recorder workspace lists the campaigns that take gifts through the
  recorder-safe campaign list. A line whose department has an active campaign
  gets a campaign picker; other lines do not. The chosen campaign is sent with
  that line only. If the list is refused, the form still works without it.

  Background:
    Given the phone "0712345678" belongs to "Grace Achieng"
    And a recorder at the desk records for "0712345678"

  Scenario: The campaign picker appears for a department with an active campaign
    Given the "Building" department has the active campaign "Roof Appeal"
    When they give "1000" to "Tithe"
    Then no campaign picker is shown
    When they change line 1 to "Building"
    Then line 1 offers the campaigns "No campaign, Roof Appeal"
    And the picker for line 1 is labelled "Line 1 · Building"

  Scenario: Only the line of the campaign's department gets a picker
    Given the "Building" department has the active campaign "Roof Appeal"
    When they give "1000" to "Tithe" and "500" to "Building"
    Then line 1 has no campaign picker
    And line 2 offers the campaigns "No campaign, Roof Appeal"

  Scenario: The campaign is sent with its line only
    Given the "Building" department has the active campaign "Roof Appeal"
    When they give "1000" to "Tithe" and "500" to "Building"
    And they choose the campaign "Roof Appeal" for line 2
    And they review and confirm the gift
    Then the gift is sent with line 1 to "Tithe" untagged and line 2 to "Building" for "Roof Appeal"

  Scenario: Moving a tagged line to another department drops its campaign
    Given the "Building" department has the active campaign "Roof Appeal"
    When they give "500" to "Building"
    And they choose the campaign "Roof Appeal" for line 1
    And they change line 1 to "Tithe"
    And they review and confirm the gift
    Then the gift is sent with line 1 to "Tithe" untagged

  Scenario: No campaigns take gifts, so no picker is shown
    Given no campaign takes gifts
    When they give "500" to "Building"
    Then no campaign picker is shown

  Scenario: A refused campaign list leaves the form working without a picker
    Given the campaign list is refused to this recorder
    When they give "500" to "Building"
    Then no campaign picker is shown
    When they review and confirm the gift
    Then the gift is sent with line 1 to "Building" untagged
