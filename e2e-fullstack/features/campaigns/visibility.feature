Feature: Only approved campaigns are public
  Drafts and campaigns awaiting approval are never on the public site;
  their links show "not found". An approved campaign is listed.

  Background:
    Given the church is set up with its departments and people

  Scenario: Drafts and campaigns awaiting approval stay off the public site
    Given the campaign "Mission Van" with code "VAN" is still a draft
    And the campaign "Choir Robes" with code "ROBES" is awaiting approval
    And the campaign "Church Roof 2026" with code "ROOF" has been approved
    When a visitor opens the public campaigns list
    Then the public campaigns list shows "Church Roof 2026"
    And the public campaigns list does not show "Mission Van"
    And the public campaigns list does not show "Choir Robes"
    When a visitor opens the public page of the campaign "Mission Van"
    Then the visitor is told the campaign cannot be found
    When a visitor opens the public page of the campaign "Choir Robes"
    Then the visitor is told the campaign cannot be found
    When a visitor opens the public page of the campaign "Church Roof 2026"
    Then the public campaign page is titled "Church Roof 2026"
    And no request left the machine
