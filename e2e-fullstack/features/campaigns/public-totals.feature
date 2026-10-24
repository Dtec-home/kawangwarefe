Feature: Public campaign pages show totals only
  Anyone can see how much a campaign has raised, from how many donors and how
  close it is to the target, but never who gave (decision 7).

  Background:
    Given the church is set up with its departments and people

  Scenario: After gifts, the public page shows totals and no donor names
    Given the campaign "Church Roof 2026" with code "ROOF" and a target of 10000 has been approved
    And the member has given KES 1000 to "Church Roof 2026" by M-Pesa prompt
    And the member2 has given KES 1500 to "Church Roof 2026" by M-Pesa prompt
    When a visitor opens the public page of the campaign "Church Roof 2026"
    Then the public campaign page shows KES 2500 raised of KES 10000 at 25% from 2 donors
    And the public campaign page names none of the donors
    When a visitor opens the public campaigns list
    Then the public campaigns list shows "Church Roof 2026" with KES 2500 raised from 2 donors
    And the public campaigns list names none of the donors
    And no request left the machine
