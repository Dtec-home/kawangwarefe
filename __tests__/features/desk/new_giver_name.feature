Feature: The desk asks for a new giver's name
  A gift recorded for a phone the church has never seen creates a new giver
  record. So that receipts and contributor lists show a real name instead of
  "Guest Member", the recorder workspace and the admin manual-entry page ask
  for the giver's full name when the phone is new, refuse to save without it,
  send it with the gift and show it on the confirmation.

  Scenario: A recorder is asked for the name of a giver whose phone is new
    Given a recorder at the desk
    And the phone "0733111222" is new to the church
    When they look up the phone "0733111222"
    Then they are told a new giver record will be created
    And they are asked for the giver's full name

  Scenario: A recorder cannot save a new phone's gift without the name
    Given a recorder at the desk
    And the phone "0733111222" is new to the church
    When they look up the phone "0733111222"
    And they give "500" to "Tithe" and review the gift
    Then they are told "This phone number is new. Enter the giver's name."
    And no confirmation sheet opens
    And nothing is sent

  Scenario: A recorder sends the new giver's name and sees it on the confirmation
    Given a recorder at the desk
    And the phone "0733111222" is new to the church
    When they look up the phone "0733111222"
    And they enter the giver's full name "Mary Wanjiku"
    And they give "500" to "Tithe" and review the gift
    Then the confirmation sheet shows the giver "Mary Wanjiku"
    When they confirm the gift
    Then the gift is sent for phone "0733111222" with the new giver's name "Mary Wanjiku"
    And the receipt screen says the gift is from "Mary Wanjiku"

  Scenario: Changing the phone number forgets the name typed for the old one
    Given a recorder at the desk
    And the phone "0733111222" is new to the church
    When they look up the phone "0733111222"
    And they enter the giver's full name "Mary Wanjiku"
    And they change the phone number to "0733111223"
    Then they are no longer asked for the giver's full name

  Scenario: A registered member's phone does not ask for a name
    Given a recorder at the desk
    And the phone "0712345678" belongs to "Grace Achieng"
    When they look up the phone "0712345678"
    Then they are asked to confirm the name "Grace Achieng"
    And they are not asked for the giver's full name
    When they give "500" to "Tithe" and review the gift
    And they confirm the gift
    Then the gift is sent for phone "0712345678" without a new giver's name

  Scenario: An admin cannot save a new phone's gift without the name
    Given an admin on the manual-entry page
    And the phone "0733111222" is new to the church
    When the admin types the phone "0733111222" and gives "500" to "Tithe"
    And the admin saves the contribution
    Then the admin is told "This phone number is new. Enter the giver's name."
    And the admin is asked for the giver's full name
    And nothing is sent

  Scenario: An admin sends the new giver's name with the gift
    Given an admin on the manual-entry page
    And the phone "0733111222" is new to the church
    When the admin types the phone "0733111222" and gives "500" to "Tithe"
    And the admin enters the giver's full name "Mary Wanjiku"
    And the admin saves the contribution
    Then the gift is sent for phone "0733111222" with the new giver's name "Mary Wanjiku"
    And the admin sees receipt "20261024-0007"
