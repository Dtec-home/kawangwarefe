Feature: Campaign champions (staff)
  On the Champions tab of a campaign, staff see every champion with what they
  have raised, invite a member as a champion, approve members who asked to
  join and deactivate a champion (ticket 5.10).

  Scenario: Staff see the champions of a campaign
    Given the campaign "New Church Roof" takes champions
    And "Jane Wanjiku" is an active champion with code "JANE" who raised "15000" from 3 donors towards "50000"
    And "Peter Otieno" is a pending champion with code "PETER"
    When staff open the Champions tab
    Then the row for "Jane Wanjiku" shows "JANE", "Active", "KES 15,000.00", "3" and "KES 50,000.00"
    And the row for "Jane Wanjiku" links to "https://church.example/campaigns/new-church-roof/c/JANE"
    And the row for "Peter Otieno" shows "PETER" and "Waiting for approval"

  Scenario: Staff invite a champion by phone
    Given the campaign "New Church Roof" takes champions
    When staff open the Champions tab
    And they invite "0712 345 678" with code "mama1" and a personal target of "30000"
    Then a champion is invited to campaign "42" with phone "254712345678", code "MAMA1" and personal target "30000"
    And they are told "Champion invited"

  Scenario: An invalid phone number is refused before sending
    Given the campaign "New Church Roof" takes champions
    When staff open the Champions tab
    And they invite "12345" with code "MAMA1" and no personal target
    Then they see the message "Enter a valid Safaricom or Airtel number"
    And no invitation is sent

  Scenario: Staff approve a pending champion
    Given the campaign "New Church Roof" takes champions
    And "Peter Otieno" is a pending champion with code "PETER"
    When staff open the Champions tab
    And they approve "Peter Otieno"
    Then champion "Peter Otieno" is approved
    And the row for "Peter Otieno" shows "PETER" and "Active"

  Scenario: Staff deactivate an active champion after confirming
    Given the campaign "New Church Roof" takes champions
    And "Jane Wanjiku" is an active champion with code "JANE" who raised "15000" from 3 donors towards "50000"
    When staff open the Champions tab
    And they deactivate "Jane Wanjiku" and confirm
    Then champion "Jane Wanjiku" is deactivated
    And the row for "Jane Wanjiku" shows "JANE" and "Inactive"

  Scenario: A campaign with no champions explains what champions are
    Given the campaign "New Church Roof" takes champions
    When staff open the Champions tab
    Then they are told there are no champions yet

  Scenario: A campaign that does not take champions points to Edit on the Overview tab
    Given the campaign "New Church Roof" does not take champions
    When staff open the Champions tab
    Then they are told the campaign does not take champions and to use Edit on the Overview tab
    And they cannot invite a champion
